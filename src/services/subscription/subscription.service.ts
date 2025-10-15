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

        // Check if plan with same name already exists
        const existingPlan = await SubscriptionPlan.findOne({
            name: planData.name,
            isDeleted: false
        }).session(session);

        if (existingPlan) {
            throw new AppError('Subscription plan with this name already exists', ERROR_CODES.CONFLICT);
        }

        // Create new subscription plan
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
            sortBy = 'sortOrder',
            sortOrder = 'asc'
        } = query;

        // Build filter object
        const filter: any = { isDeleted: false };

        if (planType) {
            filter.planType = planType;
        }

        if (isActive !== undefined) {
            filter.isActive = isActive;
        }

        if (isPopular !== undefined) {
            filter.isPopular = isPopular;
        }

        // Build sort object
        const sort: any = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Execute queries
        const [plans, totalPlans] = await Promise.all([
            SubscriptionPlan.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            SubscriptionPlan.countDocuments(filter)
        ]);

        // Format response
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
        console.log(planId, "planIdplanIdplanId>>>>>");
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

        // Check if name is being updated and if it conflicts
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

        // Update plan
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

        // Format plans by type
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
            isPopular: true
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
            isActive: true
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
            amount: plan.amount,
            currency: plan.currency,
            features: plan.features,
            isActive: plan.isActive,
            isPopular: plan.isPopular,
            trialDays: plan.trialDays,
            sortOrder: plan.sortOrder,
            metadata: plan.metadata,
            formattedPrice: plan.formattedPrice,
            monthlyEquivalent: plan.monthlyEquivalent,
            savingsPercentage: plan.savingsPercentage,
            createdAt: plan.createdAt,
            updatedAt: plan.updatedAt
        };
    }
}
