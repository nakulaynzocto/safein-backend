import mongoose, { Document } from 'mongoose';
import { UserSubscription } from '../../models/userSubscription/userSubscription.model';
import { User } from '../../models/user/user.model';
import { Employee } from '../../models/employee/employee.model';
import { Visitor } from '../../models/visitor/visitor.model';
import { Appointment } from '../../models/appointment/appointment.model';
import { AppError } from '../../middlewares/errorHandler';
import { ERROR_CODES } from '../../utils/constants';
import { ICreateUserSubscriptionDTO, IGetUserSubscriptionsQuery, IUserSubscription, IUserSubscriptionResponse, IUpdateUserSubscriptionDTO, IUserSubscriptionListResponse, IUserSubscriptionStats, ITrialLimitsStatus } from '../../types/userSubscription/userSubscription.types';
import { SubscriptionPlan } from '../../models/subscription/subscription.model';
import { SubscriptionHistory } from '../../models/subscriptionHistory/subscriptionHistory.model';


export class UserSubscriptionService {

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
     * Create or update paid subscription after successful Razorpay payment
     * Updates existing subscription instead of creating new one (better approach)
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

            // Find existing subscription and update it instead of creating new
            const existingSubscription = await UserSubscription.findOne({
                userId: new mongoose.Types.ObjectId(userId),
                isDeleted: false,
            }).sort({ createdAt: -1 }).session(session);


            const now = new Date();
            let segmentStart = now;
            const isExtension = existingSubscription && existingSubscription.isActive && existingSubscription.endDate > now;

            if (isExtension && existingSubscription) {
                segmentStart = existingSubscription.endDate;
            }

            // Calculate base end date for new plan
            const baseEndDate = this.calculateEndDate(segmentStart, plan.planType);

            // Subtract 1 day so it expires the day before renewal
            const endDate = new Date(baseEndDate);
            endDate.setDate(endDate.getDate() - 1);

            // NOTE: We don't add remaining days anymore because we are chaining the dates sequentially.

            let subscription: IUserSubscription & Document;

            if (existingSubscription) {
                // UPDATE existing subscription instead of creating new
                existingSubscription.planType = plan.planType;

                // Only update start date if we are resetting/overwriting (not extending)
                if (!isExtension) {
                    existingSubscription.startDate = segmentStart;
                }

                // End date is always extended to the new segment end
                existingSubscription.endDate = endDate;
                existingSubscription.isActive = true;
                existingSubscription.paymentStatus = 'succeeded';
                existingSubscription.trialDays = plan.trialDays || 0;
                existingSubscription.razorpayOrderId = razorpayOrderId || undefined;
                existingSubscription.razorpayPaymentId = razorpayPaymentId || undefined;
                existingSubscription.updatedAt = new Date();

                await existingSubscription.save({ session });
                subscription = existingSubscription;
            } else {
                // Create new only if no existing subscription found
                subscription = new UserSubscription({
                    userId: new mongoose.Types.ObjectId(userId),
                    planType: plan.planType,
                    startDate: segmentStart,
                    endDate,
                    isActive: true,
                    paymentStatus: 'succeeded',
                    trialDays: plan.trialDays || 0,
                    razorpayOrderId: razorpayOrderId || undefined,
                    razorpayPaymentId: razorpayPaymentId || undefined,
                });

                await subscription.save({ session });
            }

            // Store purchase history
            const taxPercentage = plan.taxPercentage || 0;
            const taxAmount = (plan.amount * taxPercentage) / 100;

            const subscriptionHistory = new SubscriptionHistory({
                userId: new mongoose.Types.ObjectId(userId),
                subscriptionId: subscription._id as mongoose.Types.ObjectId,
                planType: plan.planType,
                planId: new mongoose.Types.ObjectId(planId),
                purchaseDate: new Date(),
                startDate: segmentStart,
                endDate: endDate,
                amount: plan.amount,
                currency: plan.currency || 'INR',
                paymentStatus: 'succeeded',
                razorpayOrderId: razorpayOrderId || undefined,
                razorpayPaymentId: razorpayPaymentId || undefined,
                // previousSubscriptionId: previousSubscriptionId,
                // remainingDaysFromPrevious: remainingDaysFromPrevious,
                source: 'user',
                taxAmount,
                taxPercentage
            });

            await subscriptionHistory.save({ session });

            // Update user's activeSubscriptionId
            const user = await User.findById(userId).session(session);
            if (user) {
                user.activeSubscriptionId = subscription._id as mongoose.Types.ObjectId;
                await user.save({ session });
            }

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
     * Get a comprehensive subscription status for a user
     */
    static async getSubscriptionStatus(userId: string): Promise<ITrialLimitsStatus> {
        // Fetch necessary data in parallel
        const subDocPromise = UserSubscription.findOne({
            userId: new mongoose.Types.ObjectId(userId),
            isDeleted: false
        }).sort({ createdAt: -1 });

        const countsPromise = this.getTrialLimitsCounts(userId);

        const [subDoc, counts] = await Promise.all([subDocPromise, countsPromise]);

        const formattedSub = subDoc ? this.formatUserSubscriptionResponse(subDoc) : null;

        // Determine plan type to fetch limits
        const planType = formattedSub ? formattedSub.planType : 'free';

        // Fetch plan details to get limits
        const planDoc = await SubscriptionPlan.findOne({ planType: planType, isActive: true });

        const isActive = !!formattedSub && formattedSub.hasActiveSubscription;
        const isTrial = !formattedSub || formattedSub.planType === 'free' || formattedSub.isTrialing;
        const subscriptionStatus = formattedSub ? formattedSub.subscriptionStatus || 'none' : 'none';
        const isExpired = !isActive;

        const checkCreationLimit = (type: 'employees' | 'visitors' | 'appointments') => {
            // Default to -1 (unlimited) if plan not found
            // If plan found, use its limit. If limit is undefined in DB, default to -1.
            const limit = planDoc?.limits?.[type] ?? -1;
            const current = counts[type];

            // If limit is -1, it's unlimited.
            if (limit === -1) {
                const reached = isExpired; // Only reached if expired
                return { limit, current, reached, canCreate: !isExpired };
            }

            // If limit is set (> -1)
            const reached = isExpired || current >= limit;
            return { limit, current, reached, canCreate: !isExpired && !reached };
        };

        return {
            isTrial,
            planType,
            subscriptionStatus,
            isActive: isActive || false,
            isExpired,
            limits: {
                employees: checkCreationLimit('employees'),
                visitors: checkCreationLimit('visitors'),
                appointments: checkCreationLimit('appointments'),
            }
        };
    }

    /**
     * Check if a user can create another resource based on their plan limits
     */
    static async checkPlanLimits(userId: string, type: 'employees' | 'visitors' | 'appointments'): Promise<void> {
        const status = await this.getSubscriptionStatus(userId);

        if (status.isExpired) {
            throw new AppError(
                'Your subscription has expired. Please upgrade or recharge to create new items.',
                ERROR_CODES.PAYMENT_REQUIRED
            );
        }

        const limitInfo = status.limits[type];
        if (status.isTrial && limitInfo.reached) {
            throw new AppError(
                `Your free ${type} limit (${limitInfo.limit}) has been reached. Please upgrade to continue.`,
                ERROR_CODES.PAYMENT_REQUIRED
            );
        }
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
     * Get subscription history for a user (all successful purchases)
     */
    static async getUserSubscriptionHistory(userId: string): Promise<any[]> {
        try {
            const history = await SubscriptionHistory.find({
                userId: new mongoose.Types.ObjectId(userId),
                isDeleted: false,
                paymentStatus: 'succeeded', // Only successful payments
            })
                .sort({ purchaseDate: -1 }) // Most recent first
                .populate('planId', 'name amount currency')
                .exec();

            return history.map((item) => ({
                _id: (item._id as mongoose.Types.ObjectId).toString(),
                subscriptionId: item.subscriptionId.toString(),
                planType: item.planType,
                planName: (item.planId as any)?.name || `${item.planType} Plan`,
                purchaseDate: item.purchaseDate,
                startDate: item.startDate,
                endDate: item.endDate,
                amount: item.amount || 0,
                currency: item.currency || 'INR',
                paymentStatus: item.paymentStatus,
                razorpayOrderId: item.razorpayOrderId,
                razorpayPaymentId: item.razorpayPaymentId,
                remainingDaysFromPrevious: item.remainingDaysFromPrevious || 0,
                taxAmount: item.taxAmount || 0,
                taxPercentage: item.taxPercentage || 0,
                createdAt: item.createdAt,
            }));
        } catch (error) {
            throw error;
        }
    }

    /**
     * Format user subscription response with permission flags
     */
    private static formatUserSubscriptionResponse(subscription: IUserSubscription & Document): IUserSubscriptionResponse {
        const now = new Date();
        const isTrialing = subscription.planType === 'free' && subscription.endDate > now;
        const isExpired = subscription.endDate <= now;

        // Calculate permission flags on backend for security
        const hasActiveSubscription =
            subscription.isActive &&
            !subscription.isDeleted &&
            subscription.paymentStatus === 'succeeded' &&
            !isExpired;

        const canAccessDashboard = hasActiveSubscription || isTrialing;

        // Determine subscription status
        let subscriptionStatus: 'active' | 'trialing' | 'cancelled' | 'expired' | 'pending';
        if (subscription.paymentStatus === 'cancelled') {
            subscriptionStatus = 'cancelled';
        } else if (isExpired) {
            subscriptionStatus = 'expired';
        } else if (isTrialing) {
            subscriptionStatus = 'trialing';
        } else if (subscription.paymentStatus === 'pending') {
            subscriptionStatus = 'pending';
        } else if (hasActiveSubscription) {
            subscriptionStatus = 'active';
        } else {
            subscriptionStatus = 'pending';
        }

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
            // Permission flags calculated on backend
            canAccessDashboard,
            hasActiveSubscription,
            subscriptionStatus,
        };
    }
}
