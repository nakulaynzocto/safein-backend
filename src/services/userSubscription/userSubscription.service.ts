import mongoose, { Document } from 'mongoose';
import { UserSubscription } from '../../models/userSubscription/userSubscription.model';
import { User } from '../../models/user/user.model';
import { Employee } from '../../models/employee/employee.model';
import { Visitor } from '../../models/visitor/visitor.model';
import { Appointment } from '../../models/appointment/appointment.model';
import { AppError } from '../../middlewares/errorHandler';
import { ERROR_CODES } from '../../utils/constants';
import { ICreateUserSubscriptionDTO, IGetUserSubscriptionsQuery, IUserSubscription, IUserSubscriptionResponse, IUpdateUserSubscriptionDTO, IUserSubscriptionListResponse, IUserSubscriptionStats } from '../../types/userSubscription/userSubscription.types';
import { SubscriptionPlan } from '../../models/subscription/subscription.model';

export class UserSubscriptionService {
    /**
     * Activate a free trial for a user.
     * This is typically called after verifying eligibility (no payment provider dependency).
     */
    static async createFreeTrial(userId: string, trialDays: number = 3): Promise<IUserSubscription & Document> {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const user = await User.findById(userId).session(session);
            if (!user) {
                throw new AppError('User not found', ERROR_CODES.NOT_FOUND);
            }

            const existingSubscription = await UserSubscription.findOne({
                userId: new mongoose.Types.ObjectId(userId),
                isActive: true,
                isDeleted: false,
            }).session(session);

            if (existingSubscription) {
                if (existingSubscription.planType === 'free') {
                    existingSubscription.startDate = new Date();
                    existingSubscription.endDate = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
                    await existingSubscription.save({ session });
                    await session.commitTransaction();
                    return existingSubscription;
                } else {
                    throw new AppError('User already has an active subscription.', ERROR_CODES.CONFLICT);
                }
            }

            const startDate = new Date();
            const endDate = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);

            const newSubscription = new UserSubscription({
                userId: new mongoose.Types.ObjectId(userId),
                planType: 'free',
                startDate,
                endDate,
                isActive: true,
                paymentStatus: 'succeeded',
                trialDays,
            });

            await newSubscription.save({ session });

            user.activeSubscriptionId = newSubscription._id as mongoose.Types.ObjectId;
            await user.save({ session });

            await session.commitTransaction();
            return newSubscription;
        } catch (error) {
            await session.abortTransaction();
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError('Failed to activate free trial', ERROR_CODES.INTERNAL_SERVER_ERROR);
        } finally {
            session.endSession();
        }
    }

    /**
     * Get user's active subscription
     */
    static async getUserActiveSubscription(userId: string): Promise<IUserSubscriptionResponse | null> {
        try {
            const subscription = await UserSubscription.findOne({
                userId: new mongoose.Types.ObjectId(userId),
                isActive: true,
                isDeleted: false,
                endDate: { $gt: new Date() }, // Ensure not expired
            });

            if (!subscription) {
                return null;
            }

            return this.formatUserSubscriptionResponse(subscription);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Create a paid subscription after successful Razorpay payment
     * Includes idempotency check to prevent duplicate processing
     */
    static async createPaidSubscriptionFromPlan(
        userId: string,
        planId: string,
        razorpayOrderId?: string,
        razorpayPaymentId?: string
    ): Promise<IUserSubscription & Document> {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            // IDEMPOTENCY CHECK: If paymentId exists, check if subscription already created for this payment
            if (razorpayPaymentId) {
                const existingSubscription = await UserSubscription.findOne({
                    razorpayPaymentId: razorpayPaymentId,
                    isDeleted: false,
                }).session(session);

                if (existingSubscription) {
                    console.log(`⚠️ Subscription already exists for payment ${razorpayPaymentId}. Skipping duplicate creation.`);
                    await session.abortTransaction();
                    return existingSubscription; // Return existing subscription (idempotent)
                }
            }

            const plan = await SubscriptionPlan.findOne({
                _id: new mongoose.Types.ObjectId(planId),
                isDeleted: false,
                isActive: true,
            }).session(session);

            if (!plan) {
                throw new AppError('Subscription plan not found or inactive', ERROR_CODES.NOT_FOUND);
            }

            // Deactivate existing active subscription (if any)
            await UserSubscription.updateMany(
                {
                    userId: new mongoose.Types.ObjectId(userId),
                    isActive: true,
                    isDeleted: false,
                },
                {
                    $set: { isActive: false, paymentStatus: 'cancelled', endDate: new Date() },
                },
                { session }
            );

            const startDate = new Date();
            const endDate = this.calculateEndDate(startDate, plan.planType);

            const subscription = new UserSubscription({
                userId: new mongoose.Types.ObjectId(userId),
                planType: plan.planType,
                startDate,
                endDate,
                isActive: true,
                paymentStatus: 'succeeded',
                trialDays: plan.trialDays || 0,
                razorpayOrderId: razorpayOrderId || undefined,
                razorpayPaymentId: razorpayPaymentId || undefined,
            });

            await subscription.save({ session });
            await session.commitTransaction();
            return subscription;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    private static calculateEndDate(startDate: Date, planType: string): Date {
        const end = new Date(startDate);
        switch (planType) {
            case 'weekly':
                end.setDate(end.getDate() + 7);
                break;
            case 'monthly':
                end.setMonth(end.getMonth() + 1);
                break;
            case 'quarterly':
                end.setMonth(end.getMonth() + 3);
                break;
            case 'yearly':
                end.setFullYear(end.getFullYear() + 1);
                break;
            case 'free':
            default:
                end.setDate(end.getDate() + 30);
                break;
        }
        return end;
    }

    /**
     * Check if user has active premium subscription
     */
    static async hasActivePremiumSubscription(userId: string): Promise<boolean> {
        try {
            const activeSubscription = await this.getUserActiveSubscription(userId);
            if (!activeSubscription) {
                return false;
            }
            return activeSubscription.planType !== 'free';
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all user subscriptions with pagination, filtering, and sorting.
     */
    static async getAllUserSubscriptions(
        query: IGetUserSubscriptionsQuery
    ): Promise<IUserSubscriptionListResponse> {
        try {
            const { page = 1, limit = 10, userId, planType, status, sortBy, sortOrder } = query;
            const skip = (page - 1) * limit;

            const filter: any = { isDeleted: false };
            if (userId) {
                filter.userId = new mongoose.Types.ObjectId(userId);
            }
            if (planType) {
                filter.planType = planType;
            }
            if (status) { // This maps to paymentStatus in our model
                filter.paymentStatus = status;
            }

            const sort: any = {};
            if (sortBy && sortOrder) {
                sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
            } else {
                sort.createdAt = -1; // Default sort
            }

            const subscriptions = await UserSubscription.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate('userId', 'email companyId') // Populate user details if needed
                .exec();

            const totalSubscriptions = await UserSubscription.countDocuments(filter);

            const formattedSubscriptions = subscriptions.map(sub => this.formatUserSubscriptionResponse(sub));

            return {
                subscriptions: formattedSubscriptions,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalSubscriptions / limit),
                    totalSubscriptions,
                    hasNextPage: totalSubscriptions > skip + subscriptions.length,
                    hasPrevPage: page > 1,
                },
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get user subscription by ID.
     */
    static async getUserSubscriptionById(id: string): Promise<IUserSubscriptionResponse | null> {
        try {
            const subscription = await UserSubscription.findById(id).populate('userId', 'email companyId');

            if (!subscription) {
                throw new AppError('User subscription not found', ERROR_CODES.NOT_FOUND);
            }

            return this.formatUserSubscriptionResponse(subscription);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Create a new user subscription.
     */
    static async createUserSubscription(
        subscriptionData: ICreateUserSubscriptionDTO
    ): Promise<IUserSubscriptionResponse> {
        try {
            const newSubscriptionData = {
                ...subscriptionData,
                userId: new mongoose.Types.ObjectId(subscriptionData.userId),
            };

            const newSubscription = await UserSubscription.create(newSubscriptionData);

            return this.formatUserSubscriptionResponse(newSubscription);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update an existing user subscription.
     */
    static async updateUserSubscription(
        id: string,
        updateData: IUpdateUserSubscriptionDTO
    ): Promise<IUserSubscriptionResponse> {
        try {
            const updatedSubscriptionData: any = { ...updateData };

            if (updatedSubscriptionData.userId) {
                updatedSubscriptionData.userId = new mongoose.Types.ObjectId(updatedSubscriptionData.userId);
            }
            if (updatedSubscriptionData.deletedBy) {
                updatedSubscriptionData.deletedBy = new mongoose.Types.ObjectId(updatedSubscriptionData.deletedBy);
            }

            const updatedSubscription = await UserSubscription.findByIdAndUpdate(
                id,
                updatedSubscriptionData,
                { new: true }
            );

            if (!updatedSubscription) {
                throw new AppError('User subscription not found', ERROR_CODES.NOT_FOUND);
            }

            return this.formatUserSubscriptionResponse(updatedSubscription);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Cancel a user subscription (soft delete).
     */
    static async cancelUserSubscription(id: string): Promise<IUserSubscriptionResponse> {
        try {
            const subscription = await UserSubscription.findById(id);

            if (!subscription) {
                throw new AppError('User subscription not found', ERROR_CODES.NOT_FOUND);
            }

            subscription.isDeleted = true;
            subscription.deletedAt = new Date();
            subscription.isActive = false;

            await subscription.save();

            return this.formatUserSubscriptionResponse(subscription);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get subscription statistics.
     */
    static async getSubscriptionStats(): Promise<IUserSubscriptionStats> {
        try {
            const totalSubscriptions = await UserSubscription.countDocuments({ isDeleted: false });
            const activeSubscriptions = await UserSubscription.countDocuments({ isActive: true, isDeleted: false });
            const canceledSubscriptions = await UserSubscription.countDocuments({ isDeleted: true });
            const expiredSubscriptions = await UserSubscription.countDocuments({ isActive: false, endDate: { $lte: new Date() }, isDeleted: false });
            const trialingSubscriptions = await UserSubscription.countDocuments({ planType: 'free', isActive: true, endDate: { $gt: new Date() }, isDeleted: false });

            const totalRevenue = 0;
            const averageSubscriptionValue = 0;

            return {
                totalSubscriptions,
                activeSubscriptions,
                canceledSubscriptions,
                expiredSubscriptions,
                trialingSubscriptions,
                subscriptionsByStatus: {
                    active: activeSubscriptions,
                    canceled: canceledSubscriptions,
                    expired: expiredSubscriptions,
                    pending: await UserSubscription.countDocuments({ paymentStatus: 'pending', isDeleted: false }),
                    past_due: 0, // Not explicitly handled yet
                    trialing: trialingSubscriptions,
                },
                totalRevenue,
                averageSubscriptionValue,
            };
        } catch (error) {
            throw error;
        }
    }

    static async getTrialLimitsCounts(userId: string): Promise<{
        employees: number;
        visitors: number;
        appointments: number;
    }> {
        const userObjectId = new mongoose.Types.ObjectId(userId);
        const [employeeCount, visitorCount, appointmentCount] = await Promise.all([
            Employee.countDocuments({ createdBy: userObjectId, isDeleted: false }),
            Visitor.countDocuments({ createdBy: userObjectId, isDeleted: false }),
            Appointment.countDocuments({ createdBy: userObjectId, isDeleted: false }),
        ]);

        return {
            employees: employeeCount,
            visitors: visitorCount,
            appointments: appointmentCount,
        };
    }

    /**
     * Process expired subscriptions (e.g., set to inactive, update payment status).
     * This method would typically be called by a cron job.
     */
    static async processExpiredSubscriptions(): Promise<void> {
        try {
            const now = new Date();
            const expiredSubscriptions = await UserSubscription.find({
                isActive: true,
                endDate: { $lte: now },
                isDeleted: false,
            });

            for (const subscription of expiredSubscriptions) {
                subscription.isActive = false;
                subscription.paymentStatus = 'failed'; // Assuming expiry due to failed payment/non-renewal
                await subscription.save();
            }

        } catch (error) {
            throw error;
        }
    }

    /**
     * Format user subscription response
     */
    private static formatUserSubscriptionResponse(subscription: IUserSubscription & Document): IUserSubscriptionResponse {
        const isTrialing = subscription.planType === 'free' && subscription.endDate > new Date();

        return {
            _id: (subscription._id as mongoose.Types.ObjectId).toString(),
            userId: subscription.userId.toString(),
            planType: subscription.planType,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            isActive: subscription.isActive,
            paymentStatus: subscription.paymentStatus,
            trialDays: subscription.trialDays || 0,
            isTrialing,
            isDeleted: subscription.isDeleted,
            deletedAt: subscription.deletedAt,
            deletedBy: subscription.deletedBy ? (subscription.deletedBy as mongoose.Types.ObjectId).toString() : undefined,
            createdAt: subscription.createdAt,
            updatedAt: subscription.updatedAt,
        };
    }
}
