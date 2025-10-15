import { Response, NextFunction } from 'express';
import { SubscriptionPlanService } from '../../services/subscription/subscription.service';
import { ResponseUtil } from '../../utils';
import {
    ICreateSubscriptionPlanDTO,
    IUpdateSubscriptionPlanDTO,
    IGetSubscriptionPlansQuery
} from '../../types/subscription/subscription.types';
import { ERROR_CODES } from '../../utils/constants';
import { TryCatch } from '../../decorators';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/errorHandler';

export class SubscriptionPlanController {
    /**
     * Create a new subscription plan
     * POST /api/v1/subscription-plans
     */
    @TryCatch('Failed to create subscription plan')
    static async createSubscriptionPlan(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }

        const planData: ICreateSubscriptionPlanDTO = req.body;
        const createdBy = req.user._id.toString();
        const subscriptionPlan = await SubscriptionPlanService.createSubscriptionPlan(planData, createdBy);

        ResponseUtil.success(res, 'Subscription plan created successfully', subscriptionPlan, ERROR_CODES.CREATED);
    }

    /**
     * Get all subscription plans with pagination and filtering
     * GET /api/v1/subscription-plans
     */
    @TryCatch('Failed to get subscription plans')
    static async getAllSubscriptionPlans(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        const query: IGetSubscriptionPlansQuery = req.query;
        const result = await SubscriptionPlanService.getAllSubscriptionPlans(query);

        ResponseUtil.success(res, 'Subscription plans retrieved successfully', result);
    }

    /**
     * Get subscription plan by ID
     * GET /api/v1/subscription-plans/:id
     */
    @TryCatch('Failed to get subscription plan')
    static async getSubscriptionPlanById(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        const { id } = req.params;
        const subscriptionPlan = await SubscriptionPlanService.getSubscriptionPlanById(id);

        ResponseUtil.success(res, 'Subscription plan retrieved successfully', subscriptionPlan);
    }

    /**
     * Update subscription plan
     * PUT /api/v1/subscription-plans/:id
     */
    @TryCatch('Failed to update subscription plan')
    static async updateSubscriptionPlan(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        const { id } = req.params;
        const updateData: IUpdateSubscriptionPlanDTO = req.body;
        const subscriptionPlan = await SubscriptionPlanService.updateSubscriptionPlan(id, updateData);

        ResponseUtil.success(res, 'Subscription plan updated successfully', subscriptionPlan);
    }

    /**
     * Delete subscription plan (soft delete)
     * DELETE /api/v1/subscription-plans/:id
     */
    @TryCatch('Failed to delete subscription plan')
    static async deleteSubscriptionPlan(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }

        const { id } = req.params;
        const deletedBy = req.user._id.toString();
        await SubscriptionPlanService.deleteSubscriptionPlan(id, deletedBy);

        ResponseUtil.success(res, 'Subscription plan deleted successfully');
    }

    /**
     * Restore subscription plan
     * PUT /api/v1/subscription-plans/:id/restore
     */
    @TryCatch('Failed to restore subscription plan')
    static async restoreSubscriptionPlan(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        const { id } = req.params;
        const subscriptionPlan = await SubscriptionPlanService.restoreSubscriptionPlan(id);

        ResponseUtil.success(res, 'Subscription plan restored successfully', subscriptionPlan);
    }

    /**
     * Get subscription plan statistics
     * GET /api/v1/subscription-plans/stats
     */
    @TryCatch('Failed to get subscription plan statistics')
    static async getSubscriptionPlanStats(_req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        const stats = await SubscriptionPlanService.getSubscriptionPlanStats();

        ResponseUtil.success(res, 'Subscription plan statistics retrieved successfully', stats);
    }

    /**
     * Get popular subscription plans
     * GET /api/v1/subscription-plans/popular
     */
    @TryCatch('Failed to get popular subscription plans')
    static async getPopularSubscriptionPlans(_req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        const plans = await SubscriptionPlanService.getPopularSubscriptionPlans();

        ResponseUtil.success(res, 'Popular subscription plans retrieved successfully', plans);
    }

    /**
     * Get subscription plans by type
     * GET /api/v1/subscription-plans/type/:planType
     */
    @TryCatch('Failed to get subscription plans by type')
    static async getSubscriptionPlansByType(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        const { planType } = req.params;
        const plans = await SubscriptionPlanService.getSubscriptionPlansByType(planType);

        ResponseUtil.success(res, 'Subscription plans retrieved successfully', plans);
    }
}
