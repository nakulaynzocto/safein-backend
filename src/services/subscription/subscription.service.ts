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
import { getTaxSplit } from '../../utils/invoiceHelpers';

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
            taxPercentage: planData.taxPercentage || 0,
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
            sortOrder = 'asc',
            userId,
            profileId
        } = query;

        const filter: any = { isDeleted: false };

        // ... existing filters ...
        if (isPublic === 'all') {
        } else if (isPublic !== undefined) {
            filter.isPublic = isPublic;
        } else {
            filter.isPublic = { $ne: false };
        }

        if (planType) {
            filter.planType = planType;
        }

        if (isActive === 'all') {
        } else if (isActive !== undefined) {
            filter.isActive = isActive;
        } else {
            filter.isActive = true;
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

        // If userId provided, fetch user and profile for tax split
        let user: any = null;
        let profile: any = null;
        if (userId) {
            const UserModel = mongoose.model('User');
            user = await UserModel.findById(userId);

            if (profileId) {
                const ProfileModel = mongoose.model('SafeinProfile');
                profile = await ProfileModel.findById(profileId);
            } else {
                // Try to find any profile if none provided
                const ProfileModel = mongoose.model('SafeinProfile');
                profile = await ProfileModel.findOne() || await ProfileModel.findOne({ isDefault: true });
            }
        }

        const formattedPlans = plans.map(plan => {
            const res = this.formatSubscriptionPlanResponse(plan);

            if (user && res.taxAmount > 0) {
                res.taxSplit = getTaxSplit(
                    res.taxAmount,
                    res.taxPercentage,
                    user.address,
                    profile?.companyDetails?.state || 'Karnataka',
                    profile?.companyDetails?.country || 'India'
                );
            }

            return res;
        });

        const totalPages = Math.ceil(totalPlans / limit);

        return {
            plans: formattedPlans,
            pagination: {
                currentPage: Number(page),
                totalPages,
                totalPlans,
                hasNextPage: Number(page) < totalPages,
                hasPrevPage: Number(page) > 1
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
     * Calculate duration in days based on plan type
     */
    private static calculateDuration(planType: string): number {
        switch (planType) {
            case 'weekly':
                return 7;
            case 'monthly':
                return 30;
            case 'quarterly':
                return 90;
            case 'yearly':
                return 365;
            case 'free':
            default:
                return 30; // default to 30 days
        }
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
            taxPercentage: plan.taxPercentage || 0,
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
            duration: plan.duration || SubscriptionPlanService.calculateDuration(plan.planType),
            taxAmount: Math.round(((plan.amount || 0) * (plan.taxPercentage || 0)) / 100),
            totalAmount: plan.totalAmount || Math.round((plan.amount || 0) + ((plan.amount || 0) * (plan.taxPercentage || 0)) / 100), // Calculate if virtual missing (lean)
            monthlyEquivalent: plan.monthlyEquivalent,
            savingsPercentage: plan.savingsPercentage,
            createdAt: plan.createdAt,
            updatedAt: plan.updatedAt,
            limits: plan.limits || { employees: -1, visitors: -1, appointments: -1, spotPasses: 0 },
            modules: plan.modules || { visitorInvite: false, message: false }
        };
    }
}
