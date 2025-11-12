import { Response, NextFunction } from 'express';
import { UserSubscriptionService } from '../../services/userSubscription/userSubscription.service';
import { StripeService } from '../../services/stripe/stripe.service';
import { ResponseUtil } from '../../utils';
import {
    ICreateUserSubscriptionDTO,
    IUpdateUserSubscriptionDTO,
    IGetUserSubscriptionsQuery,
    IStripeCheckoutSessionRequest,
    IAssignFreePlanRequest,
    IGetUserActiveSubscriptionRequest,
    ICheckPremiumSubscriptionRequest
} from '../../types/userSubscription/userSubscription.types';
import { ERROR_CODES } from '../../utils/constants';
import { TryCatch } from '../../decorators';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/errorHandler';

export class UserSubscriptionController {
    /**
     * Assign free plan to new user
     * POST /api/v1/user-subscriptions/assign-free-plan
     */
    @TryCatch('Failed to assign free plan')
    static async assignFreePlanToNewUser(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }

        const request: IAssignFreePlanRequest = {
            userId: req.user._id.toString(),
            stripeCustomerId: req.user.stripeCustomerId, // Ensure stripeCustomerId is passed
        };

        // The service method is createFreeTrial, not assignFreePlanToNewUser
        const subscription = await UserSubscriptionService.createFreeTrial(request.userId, request.stripeCustomerId as string);

        ResponseUtil.success(res, 'Free plan assigned successfully', subscription, ERROR_CODES.CREATED);
    }

    /**
     * Get user's active subscription
     * GET /api/v1/user-subscriptions/active
     */
    @TryCatch('Failed to get active subscription')
    static async getUserActiveSubscription(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }

        const request: IGetUserActiveSubscriptionRequest = {
            userId: req.user._id.toString()
        };

        const subscription = await UserSubscriptionService.getUserActiveSubscription(request.userId);

        ResponseUtil.success(res, 'Active subscription retrieved successfully', subscription);
    }

    /**
     * Check if user has premium subscription
     * GET /api/v1/user-subscriptions/premium-check
     */
    @TryCatch('Failed to check premium subscription')
    static async checkPremiumSubscription(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }

        const request: ICheckPremiumSubscriptionRequest = {
            userId: req.user._id.toString()
        };

        const hasPremium = await UserSubscriptionService.hasActivePremiumSubscription(request.userId);

        ResponseUtil.success(res, 'Premium subscription check completed', { hasPremium });
    }

    /**
     * Create Stripe checkout session
     * POST /api/v1/stripe/checkout-session
     */
    @TryCatch('Failed to create checkout session')
    static async createCheckoutSession(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }

        const request: IStripeCheckoutSessionRequest = {
            planId: req.body.planId,
            successUrl: req.body.successUrl,
            cancelUrl: req.body.cancelUrl,
            customerEmail: req.user.email
        };

        const session = await StripeService.createCheckoutSession(request, req.user._id.toString());

        ResponseUtil.success(res, 'Checkout session created successfully', session, ERROR_CODES.CREATED);
    }

    /**
     * Handle Stripe webhook
     * POST /api/v1/stripe/webhook
     */
    @TryCatch('Failed to handle webhook')
    static async handleStripeWebhook(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        const signature = req.headers['stripe-signature'] as string;

        if (!signature) {
            throw new AppError('Stripe signature is required', ERROR_CODES.BAD_REQUEST);
        }

        await StripeService.handleWebhookEvent(req.body, signature);

        ResponseUtil.success(res, 'Webhook processed successfully');
    }

    /**
     * Get all user subscriptions with pagination
     * GET /api/v1/user-subscriptions
     */
    @TryCatch('Failed to get user subscriptions')
    static async getAllUserSubscriptions(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        const query: IGetUserSubscriptionsQuery = req.query;

        // If no userId provided, use authenticated user's ID
        if (!query.userId && req.user) {
            query.userId = req.user._id.toString();
        }

        const result = await UserSubscriptionService.getAllUserSubscriptions(query);

        ResponseUtil.success(res, 'User subscriptions retrieved successfully', result);
    }

    /**
     * Get user subscription by ID
     * GET /api/v1/user-subscriptions/:id
     */
    @TryCatch('Failed to get user subscription')
    static async getUserSubscriptionById(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        const { id } = req.params;
        const subscription = await UserSubscriptionService.getUserSubscriptionById(id);

        ResponseUtil.success(res, 'User subscription retrieved successfully', subscription);
    }

    /**
     * Create user subscription
     * POST /api/v1/user-subscriptions
     */
    @TryCatch('Failed to create user subscription')
    static async createUserSubscription(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }

        const subscriptionData: ICreateUserSubscriptionDTO = {
            ...req.body,
            userId: req.body.userId || req.user._id.toString()
        };

        const subscription = await UserSubscriptionService.createUserSubscription(subscriptionData);

        ResponseUtil.success(res, 'User subscription created successfully', subscription, ERROR_CODES.CREATED);
    }

    /**
     * Update user subscription
     * PUT /api/v1/user-subscriptions/:id
     */
    @TryCatch('Failed to update user subscription')
    static async updateUserSubscription(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        const { id } = req.params;
        const updateData: IUpdateUserSubscriptionDTO = req.body;
        const subscription = await UserSubscriptionService.updateUserSubscription(id, updateData);

        ResponseUtil.success(res, 'User subscription updated successfully', subscription);
    }

    /**
     * Cancel user subscription
     * DELETE /api/v1/user-subscriptions/:id
     */
    @TryCatch('Failed to cancel user subscription')
    static async cancelUserSubscription(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        const { id } = req.params;
        const subscription = await UserSubscriptionService.cancelUserSubscription(id);

        ResponseUtil.success(res, 'User subscription canceled successfully', subscription);
    }

    /**
     * Get subscription statistics
     * GET /api/v1/user-subscriptions/stats
     */
    @TryCatch('Failed to get subscription statistics')
    static async getSubscriptionStats(_req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        const stats = await UserSubscriptionService.getSubscriptionStats();

        ResponseUtil.success(res, 'Subscription statistics retrieved successfully', stats);
    }

    /**
     * Process expired subscriptions (Admin only)
     * POST /api/v1/user-subscriptions/process-expired
     */
    @TryCatch('Failed to process expired subscriptions')
    static async processExpiredSubscriptions(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user || req.user.role !== 'admin') {
            throw new AppError('Admin access required', ERROR_CODES.FORBIDDEN);
        }

        await UserSubscriptionService.processExpiredSubscriptions();

        ResponseUtil.success(res, 'Expired subscriptions processed successfully');
    }
}
