import { SubscriptionPlan } from '../../models/subscription/subscription.model';
import {
    ICreateSubscriptionPlanDTO,
    IUpdateSubscriptionPlanDTO,
    ISubscriptionPlanResponse,
    IGetSubscriptionPlansQuery,
    ISubscriptionPlanListResponse,
    ISubscriptionPlanStats
} from '../../types/subscription/subscription.types';
import { ERROR_CODES } from '../../utils/constants';
import { AppError } from '../../middlewares/errorHandler';
import { Transaction } from '../../decorators';
import mongoose from 'mongoose';

export class SubscriptionPlanService {
    /**
     * Create a new subscription plan
     */
    @Transaction('Failed to create subscription plan')
    static async createSubscriptionPlan(
        planData: ICreateSubscriptionPlanDTO,
        _createdBy: string,
        options: { session?: any } = {}
    ): Promise<ISubscriptionPlanResponse> {
        const { session } = options;

        const existingPlan = await SubscriptionPlan.findOne({
            name: planData.name,
            isDeleted: false
        }).session(session);

        if (existingPlan) {
            throw new AppError('Subscription plan with this name already exists', ERROR_CODES.CONFLICT);
        }

        const subscriptionPlan = new SubscriptionPlan({
            ...planData,
            currency: planData.currency || 'usd',
            isActive: planData.isActive ?? true,
            isPopular: planData.isPopular ?? false,
            trialDays: planData.trialDays || 0,
            sortOrder: planData.sortOrder || 0
        });

        await subscriptionPlan.save({ session });

        return this.formatSubscriptionPlanResponse(subscriptionPlan);
    }

    /**
     * Get all subscription plans with pagination and filtering
     * @param query - Query parameters for filtering and pagination
     * @param query.page - Page number (default: 1)
     * @param query.limit - Items per page (default: 10)
     * @param query.planType - Filter by plan type (free, weekly, monthly, quarterly, yearly)
     * @param query.isActive - Filter by active status ('all' to show all)
     * @param query.isPopular - Filter by popular status
     * @param query.isPublic - Filter by public visibility ('all' to show all)
     * @param query.sortBy - Field to sort by (default: 'sortOrder')
     * @param query.sortOrder - Sort direction 'asc' or 'desc' (default: 'asc')
     * @returns Promise with paginated subscription plans and metadata
     */
    static async getAllSubscriptionPlans(
        query: IGetSubscriptionPlansQuery
    ): Promise<ISubscriptionPlanListResponse> {
        const {
            page = 1,
            limit = 10,
            planType,
            isActive,
            isPopular,
            isPublic,
            sortBy = 'sortOrder',
            sortOrder = 'asc'
        } = query;

        const filter: any = { isDeleted: false };

        // Handle Visibility Filter
        if (isPublic === 'all') {
            // No filter on isPublic - show everything (for Super Admin)
        } else if (isPublic !== undefined) {
            filter.isPublic = isPublic;
        } else {
            // Default: Show public + legacy (missing field)
            filter.isPublic = { $ne: false };
        }

        if (planType) {
            filter.planType = planType;
        }

        // By default, only show active plans unless explicitly set to false
        if (isActive === 'all') {
            // No active filter - show all
        } else if (isActive !== undefined) {
            filter.isActive = isActive;
        } else {
            filter.isActive = true; // Default to active plans only
        }

        if (isPopular !== undefined) {
            filter.isPopular = isPopular;
        }

        const sort: any = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const skip = (page - 1) * limit;

        const [plans, totalPlans] = await Promise.all([
            SubscriptionPlan.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            SubscriptionPlan.countDocuments(filter)
        ]);

        const formattedPlans = plans.map(plan => this.formatSubscriptionPlanResponse(plan));

        const totalPages = Math.ceil(totalPlans / limit);

        return {
            plans: formattedPlans,
            pagination: {
                currentPage: page,
                totalPages,
                totalPlans,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        };
    }

    /**
     * Get subscription plan by ID
     */
    static async getSubscriptionPlanById(planId: string): Promise<ISubscriptionPlanResponse> {
        const subscriptionPlan = await SubscriptionPlan.findOne({
            _id: planId,
            isDeleted: false
        });

        if (!subscriptionPlan) {
            throw new AppError('Subscription plan not found', ERROR_CODES.NOT_FOUND);
        }

        return this.formatSubscriptionPlanResponse(subscriptionPlan);
    }

    /**
     * Update subscription plan
     */
    @Transaction('Failed to update subscription plan')
    static async updateSubscriptionPlan(
        planId: string,
        updateData: IUpdateSubscriptionPlanDTO,
        options: { session?: any } = {}
    ): Promise<ISubscriptionPlanResponse> {
        const { session } = options;

        const subscriptionPlan = await SubscriptionPlan.findOne({
            _id: planId,
            isDeleted: false
        }).session(session);

        if (!subscriptionPlan) {
            throw new AppError('Subscription plan not found', ERROR_CODES.NOT_FOUND);
        }

        if (updateData.name && updateData.name !== subscriptionPlan.name) {
            const existingPlan = await SubscriptionPlan.findOne({
                name: updateData.name,
                _id: { $ne: planId },
                isDeleted: false
            }).session(session);

            if (existingPlan) {
                throw new AppError('Subscription plan with this name already exists', ERROR_CODES.CONFLICT);
            }
        }

        Object.assign(subscriptionPlan, updateData);
        await subscriptionPlan.save({ session });

        return this.formatSubscriptionPlanResponse(subscriptionPlan);
    }

    /**
     * Delete subscription plan (soft delete)
     */
    @Transaction('Failed to delete subscription plan')
    static async deleteSubscriptionPlan(
        planId: string,
        deletedBy: string,
        options: { session?: any } = {}
    ): Promise<void> {
        const { session } = options;

        const subscriptionPlan = await SubscriptionPlan.findOne({
            _id: planId,
            isDeleted: false
        }).session(session);

        if (!subscriptionPlan) {
            throw new AppError('Subscription plan not found', ERROR_CODES.NOT_FOUND);
        }

        subscriptionPlan.isDeleted = true;
        subscriptionPlan.deletedAt = new Date();
        subscriptionPlan.deletedBy = deletedBy ? new mongoose.Types.ObjectId(deletedBy) : undefined;
        await subscriptionPlan.save({ session });
    }

    /**
     * Restore subscription plan
     */
    @Transaction('Failed to restore subscription plan')
    static async restoreSubscriptionPlan(
        planId: string,
        options: { session?: any } = {}
    ): Promise<ISubscriptionPlanResponse> {
        const { session } = options;

        const subscriptionPlan: any = await SubscriptionPlan.findOne({
            _id: planId,
            isDeleted: true
        }).session(session);

        if (!subscriptionPlan) {
            throw new AppError('Subscription plan not found', ERROR_CODES.NOT_FOUND);
        }

        subscriptionPlan.isDeleted = false;
        subscriptionPlan.deletedAt = null;
        subscriptionPlan.deletedBy = null;
        await subscriptionPlan.save({ session });

        return this.formatSubscriptionPlanResponse(subscriptionPlan);
    }

    /**
     * Get subscription plan statistics
     * Calculates aggregated statistics including:
     * - Total number of plans
     * - Active plans count
     * - Popular plans count
     * - Plans grouped by type
     * - Average price across all active plans
     * @returns Promise with subscription plan statistics
     */
    static async getSubscriptionPlanStats(): Promise<ISubscriptionPlanStats> {
        const [
            totalPlans,
            activePlans,
            popularPlans,
            plansByType,
            averagePrice
        ] = await Promise.all([
            SubscriptionPlan.countDocuments({ isDeleted: false }),
            SubscriptionPlan.countDocuments({ isDeleted: false, isActive: true }),
            SubscriptionPlan.countDocuments({ isDeleted: false, isActive: true, isPopular: true }),
            SubscriptionPlan.aggregate([
                { $match: { isDeleted: false } },
                { $group: { _id: '$planType', count: { $sum: 1 } } }
            ]),
            SubscriptionPlan.aggregate([
                { $match: { isDeleted: false, isActive: true, amount: { $gt: 0 } } },
                { $group: { _id: null, avgPrice: { $avg: '$amount' } } }
            ])
        ]);

        const plansByTypeFormatted = {
            free: 0,
            weekly: 0,
            monthly: 0,
            quarterly: 0,
            yearly: 0
        };

        plansByType.forEach((item: any) => {
            plansByTypeFormatted[item._id as keyof typeof plansByTypeFormatted] = item.count;
        });

        return {
            totalPlans,
            activePlans,
            popularPlans,
            plansByType: plansByTypeFormatted,
            averagePrice: averagePrice[0]?.avgPrice || 0,
            totalRevenue: 0 // This would be calculated based on actual subscriptions
        };
    }

    /**
     * Get popular subscription plans
     */
    static async getPopularSubscriptionPlans(): Promise<ISubscriptionPlanResponse[]> {
        const plans = await SubscriptionPlan.find({
            isDeleted: false,
            isActive: true,
            isPopular: true,
            isPublic: { $ne: false }
        }).sort({ sortOrder: 1 });

        return plans.map(plan => this.formatSubscriptionPlanResponse(plan));
    }

    /**
     * Get subscription plans by type
     */
    static async getSubscriptionPlansByType(planType: string): Promise<ISubscriptionPlanResponse[]> {
        const plans = await SubscriptionPlan.find({
            planType,
            isDeleted: false,
            isActive: true,
            isPublic: { $ne: false }
        }).sort({ sortOrder: 1 });

        return plans.map(plan => this.formatSubscriptionPlanResponse(plan));
    }

    /**
     * Format subscription plan response
     */
    private static formatSubscriptionPlanResponse(plan: any): ISubscriptionPlanResponse {
        return {
            _id: plan._id.toString(),
            name: plan.name,
            description: plan.description,
            planType: plan.planType,
            amount: plan.amount, // Return as stored (Rupees)
            currency: plan.currency,
            features: plan.features,
            isActive: plan.isActive,
            isPopular: plan.isPopular,
            isPublic: plan.isPublic,
            trialDays: plan.trialDays,
            sortOrder: plan.sortOrder,
            discountPercentage: plan.discountPercentage,
            metadata: plan.metadata,
            formattedPrice: plan.formattedPrice,
            monthlyEquivalent: plan.monthlyEquivalent,
            savingsPercentage: plan.savingsPercentage,
            createdAt: plan.createdAt,
            updatedAt: plan.updatedAt
        };
    }
}
