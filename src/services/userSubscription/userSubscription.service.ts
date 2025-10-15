import { UserSubscription } from '../../models/userSubscription/userSubscription.model';
import { SubscriptionPlan } from '../../models/subscription/subscription.model';
import { StripeService } from '../stripe/stripe.service';
import {
    ICreateUserSubscriptionDTO,
    IUpdateUserSubscriptionDTO,
    IUserSubscriptionResponse,
    IGetUserSubscriptionsQuery,
    IUserSubscriptionListResponse,
    IUserSubscriptionStats,
    IAssignFreePlanRequest,
    IGetUserActiveSubscriptionRequest,
    ICheckPremiumSubscriptionRequest
} from '../../types/userSubscription/userSubscription.types';
import { ERROR_CODES } from '../../utils/constants';
import { AppError } from '../../middlewares/errorHandler';
import { Transaction } from '../../decorators';

export class SubscriptionService {
    /**
     * Assign free plan to new user
     */
    @Transaction('Failed to assign free plan to user')
    static async assignFreePlanToNewUser(
        request: IAssignFreePlanRequest,
        options: { session?: any } = {}
    ): Promise<IUserSubscriptionResponse> {
        const { session } = options;

        try {
            // Check if user already has a subscription
            const existingSubscription = await UserSubscription.findOne({
                userId: request.userId,
                isDeleted: false
            }).session(session);

            if (existingSubscription) {
                console.warn(`User ${request.userId} already has a subscription`);
                return this.formatUserSubscriptionResponse(existingSubscription);
            }

            // Find free plan
            const freePlan = await SubscriptionPlan.findOne({
                planType: 'free',
                isActive: true,
                isDeleted: false
            }).session(session);

            if (!freePlan) {
                throw new AppError('Free plan not found', ERROR_CODES.NOT_FOUND);
            }

            // Create free subscription
            const subscription = new UserSubscription({
                userId: request.userId,
                planId: freePlan._id,
                status: 'active',
                startDate: new Date(),
                isAutoRenew: false,
                amount: 0,
                currency: 'usd',
                billingCycle: 'monthly'
            });

            await subscription.save({ session });

            console.log(`Free plan assigned to user ${request.userId}`);

            return this.formatUserSubscriptionResponse(subscription);
        } catch (error) {
            console.error('Error assigning free plan:', error);
            throw error;
        }
    }

    /**
     * Get user's active subscription
     */
    static async getUserActiveSubscription(
        request: IGetUserActiveSubscriptionRequest
    ): Promise<IUserSubscriptionResponse | null> {
        try {
            const subscription = await UserSubscription.findOne({
                userId: request.userId,
                status: 'active',
                isDeleted: false,
                $or: [
                    { endDate: { $exists: false } },
                    { endDate: { $gt: new Date() } }
                ]
            }).populate('planId', 'name planType amount features');

            if (!subscription) {
                return null;
            }

            return this.formatUserSubscriptionResponse(subscription);
        } catch (error) {
            console.error('Error getting user active subscription:', error);
            throw error;
        }
    }

    /**
     * Check if user has active premium subscription
     */
    static async hasActivePremiumSubscription(
        request: ICheckPremiumSubscriptionRequest
    ): Promise<boolean> {
        try {
            const subscription = await UserSubscription.findOne({
                userId: request.userId,
                status: 'active',
                amount: { $gt: 0 },
                isDeleted: false,
                $or: [
                    { endDate: { $exists: false } },
                    { endDate: { $gt: new Date() } }
                ]
            });

            return !!subscription;
        } catch (error) {
            console.error('Error checking premium subscription:', error);
            throw error;
        }
    }

    /**
     * Create user subscription
     */
    @Transaction('Failed to create user subscription')
    static async createUserSubscription(
        subscriptionData: ICreateUserSubscriptionDTO,
        options: { session?: any } = {}
    ): Promise<IUserSubscriptionResponse> {
        const { session } = options;

        try {
            // Verify plan exists
            const plan = await SubscriptionPlan.findOne({
                _id: subscriptionData.planId,
                isActive: true,
                isDeleted: false
            }).session(session);

            if (!plan) {
                throw new AppError('Subscription plan not found', ERROR_CODES.NOT_FOUND);
            }

            // Check if user already has an active subscription
            const existingSubscription = await UserSubscription.findOne({
                userId: subscriptionData.userId,
                status: 'active',
                isDeleted: false
            }).session(session);

            if (existingSubscription) {
                throw new AppError('User already has an active subscription', ERROR_CODES.CONFLICT);
            }

            // Create subscription
            const subscription = new UserSubscription({
                ...subscriptionData,
                currency: subscriptionData.currency || 'usd',
                status: subscriptionData.status || 'pending',
                startDate: subscriptionData.startDate || new Date(),
                isAutoRenew: subscriptionData.isAutoRenew ?? true
            });

            await subscription.save({ session });

            console.log(`User subscription created: ${subscription._id}`);

            return this.formatUserSubscriptionResponse(subscription);
        } catch (error) {
            console.error('Error creating user subscription:', error);
            throw error;
        }
    }

    /**
     * Update user subscription
     */
    @Transaction('Failed to update user subscription')
    static async updateUserSubscription(
        subscriptionId: string,
        updateData: IUpdateUserSubscriptionDTO,
        options: { session?: any } = {}
    ): Promise<IUserSubscriptionResponse> {
        const { session } = options;

        try {
            const subscription = await UserSubscription.findOne({
                _id: subscriptionId,
                isDeleted: false
            }).session(session);

            if (!subscription) {
                throw new AppError('User subscription not found', ERROR_CODES.NOT_FOUND);
            }

            // Update subscription
            Object.assign(subscription, updateData);
            await subscription.save({ session });

            console.log(`User subscription updated: ${subscriptionId}`);

            return this.formatUserSubscriptionResponse(subscription);
        } catch (error) {
            console.error('Error updating user subscription:', error);
            throw error;
        }
    }

    /**
     * Get all user subscriptions with pagination
     */
    static async getAllUserSubscriptions(
        query: IGetUserSubscriptionsQuery
    ): Promise<IUserSubscriptionListResponse> {
        try {
            const {
                page = 1,
                limit = 10,
                status,
                userId,
                planId,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = query;

            // Build filter object
            const filter: any = { isDeleted: false };

            if (status) {
                filter.status = status;
            }

            if (userId) {
                filter.userId = userId;
            }

            if (planId) {
                filter.planId = planId;
            }

            // Build sort object
            const sort: any = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            // Calculate pagination
            const skip = (page - 1) * limit;

            // Execute queries
            const [subscriptions, totalSubscriptions] = await Promise.all([
                UserSubscription.find(filter)
                    .populate('userId', 'name email')
                    .populate('planId', 'name planType amount features')
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                UserSubscription.countDocuments(filter)
            ]);

            // Format response
            const formattedSubscriptions = subscriptions.map(subscription =>
                this.formatUserSubscriptionResponse(subscription)
            );

            const totalPages = Math.ceil(totalSubscriptions / limit);

            return {
                subscriptions: formattedSubscriptions,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalSubscriptions,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            };
        } catch (error) {
            console.error('Error getting user subscriptions:', error);
            throw error;
        }
    }

    /**
     * Get user subscription by ID
     */
    static async getUserSubscriptionById(subscriptionId: string): Promise<IUserSubscriptionResponse> {
        try {
            const subscription = await UserSubscription.findOne({
                _id: subscriptionId,
                isDeleted: false
            }).populate('userId', 'name email')
                .populate('planId', 'name planType amount features');

            if (!subscription) {
                throw new AppError('User subscription not found', ERROR_CODES.NOT_FOUND);
            }

            return this.formatUserSubscriptionResponse(subscription);
        } catch (error) {
            console.error('Error getting user subscription by ID:', error);
            throw error;
        }
    }

    /**
     * Cancel user subscription
     */
    @Transaction('Failed to cancel user subscription')
    static async cancelUserSubscription(
        subscriptionId: string,
        options: { session?: any } = {}
    ): Promise<IUserSubscriptionResponse> {
        const { session } = options;

        try {
            const subscription = await UserSubscription.findOne({
                _id: subscriptionId,
                isDeleted: false
            }).session(session);

            if (!subscription) {
                throw new AppError('User subscription not found', ERROR_CODES.NOT_FOUND);
            }

            // Cancel Stripe subscription if exists
            if (subscription.stripeSubscriptionId) {
                await StripeService.cancelSubscription(subscription.stripeSubscriptionId);
            }

            // Update subscription status
            subscription.status = 'canceled';
            subscription.isAutoRenew = false;
            await subscription.save({ session });

            console.log(`User subscription canceled: ${subscriptionId}`);

            return this.formatUserSubscriptionResponse(subscription);
        } catch (error) {
            console.error('Error canceling user subscription:', error);
            throw error;
        }
    }

    /**
     * Get subscription statistics
     */
    static async getSubscriptionStats(): Promise<IUserSubscriptionStats> {
        try {
            const [
                totalSubscriptions,
                activeSubscriptions,
                canceledSubscriptions,
                expiredSubscriptions,
                trialingSubscriptions,
                subscriptionsByStatus,
                revenueData
            ] = await Promise.all([
                UserSubscription.countDocuments({ isDeleted: false }),
                UserSubscription.countDocuments({
                    status: 'active',
                    isDeleted: false,
                    $or: [
                        { endDate: { $exists: false } },
                        { endDate: { $gt: new Date() } }
                    ]
                }),
                UserSubscription.countDocuments({ status: 'canceled', isDeleted: false }),
                UserSubscription.countDocuments({ status: 'expired', isDeleted: false }),
                UserSubscription.countDocuments({ status: 'trialing', isDeleted: false }),
                UserSubscription.aggregate([
                    { $match: { isDeleted: false } },
                    { $group: { _id: '$status', count: { $sum: 1 } } }
                ]),
                UserSubscription.aggregate([
                    { $match: { isDeleted: false, status: 'active' } },
                    { $group: { _id: null, totalRevenue: { $sum: '$amount' }, avgValue: { $avg: '$amount' } } }
                ])
            ]);

            // Format subscriptions by status
            const subscriptionsByStatusFormatted = {
                active: 0,
                canceled: 0,
                expired: 0,
                pending: 0,
                past_due: 0,
                trialing: 0
            };

            subscriptionsByStatus.forEach((item: any) => {
                subscriptionsByStatusFormatted[item._id as keyof typeof subscriptionsByStatusFormatted] = item.count;
            });

            return {
                totalSubscriptions,
                activeSubscriptions,
                canceledSubscriptions,
                expiredSubscriptions,
                trialingSubscriptions,
                subscriptionsByStatus: subscriptionsByStatusFormatted,
                totalRevenue: revenueData[0]?.totalRevenue || 0,
                averageSubscriptionValue: revenueData[0]?.avgValue || 0
            };
        } catch (error) {
            console.error('Error getting subscription stats:', error);
            throw error;
        }
    }

    /**
     * Process expired subscriptions
     */
    static async processExpiredSubscriptions(): Promise<void> {
        try {
            const expiredSubscriptions = await UserSubscription.find({
                status: 'active',
                endDate: { $lt: new Date() },
                isDeleted: false
            });

            for (const subscription of expiredSubscriptions) {
                subscription.status = 'expired';
                subscription.isAutoRenew = false;
                await subscription.save();

                console.log(`Subscription expired: ${subscription._id}`);
            }

            console.log(`Processed ${expiredSubscriptions.length} expired subscriptions`);
        } catch (error) {
            console.error('Error processing expired subscriptions:', error);
            throw error;
        }
    }

    /**
     * Format user subscription response
     */
    private static formatUserSubscriptionResponse(subscription: any): IUserSubscriptionResponse {
        return {
            _id: subscription._id.toString(),
            userId: subscription.userId?.toString() || subscription.userId,
            planId: subscription.planId?.toString() || subscription.planId,
            status: subscription.status,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            trialEndDate: subscription.trialEndDate,
            isAutoRenew: subscription.isAutoRenew,
            amount: subscription.amount,
            currency: subscription.currency,
            billingCycle: subscription.billingCycle,
            stripeSubscriptionId: subscription.stripeSubscriptionId,
            stripeCustomerId: subscription.stripeCustomerId,
            stripePriceId: subscription.stripePriceId,
            stripePaymentMethodId: subscription.stripePaymentMethodId,
            stripeInvoiceId: subscription.stripeInvoiceId,
            metadata: subscription.metadata,
            formattedAmount: subscription.formattedAmount || `$${(subscription.amount / 100).toFixed(2)}`,
            daysRemaining: subscription.daysRemaining,
            isExpired: subscription.isExpired || false,
            isTrialing: subscription.isTrialing || false,
            createdAt: subscription.createdAt,
            updatedAt: subscription.updatedAt
        };
    }
}
