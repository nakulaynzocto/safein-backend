import { Response, NextFunction } from 'express';
import { UserSubscriptionService } from '../../services/userSubscription/userSubscription.service';
import { ResponseUtil } from '../../utils';
import {
    ICreateUserSubscriptionDTO,
    IUpdateUserSubscriptionDTO,
    IGetUserSubscriptionsQuery,
    IGetUserActiveSubscriptionRequest,
} from '../../types/userSubscription/userSubscription.types';
import { ERROR_CODES } from '../../utils/constants';
import { TryCatch } from '../../decorators';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/errorHandler';
import { RazorpayService } from '../../services/razorpay/razorpay.service';
import { EmployeeUtil } from '../../utils/employee.util';

export class UserSubscriptionController {

    /**
     * Get user's active subscription
     * GET /api/v1/user-subscriptions/active/:userId
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
     * Get trial limits status
     * GET /api/v1/user-subscriptions/trial-limits
     * For employees, returns admin's subscription status
     */
    @TryCatch('Failed to get trial limits status')
    static async getTrialLimitsStatus(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user || !req.user._id) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }

        // Check if user is an employee
        // If employee, use admin's subscription (employee's createdBy)
        // If admin, use their own subscription
        const isEmployee = await EmployeeUtil.isEmployee(req.user);
        let userId = req.user._id.toString();

        if (isEmployee) {
            // Employee uses admin's subscription
            const adminUserId = await EmployeeUtil.getAdminUserIdForEmployee(req.user);
            if (adminUserId) {
                userId = adminUserId;
            } else {
                // If admin not found, return default/empty status
                throw new AppError(
                    'Employee account is not properly linked to an admin. Please contact your administrator.',
                    ERROR_CODES.FORBIDDEN
                );
            }
        }

        const status = await UserSubscriptionService.getSubscriptionStatus(userId);

        ResponseUtil.success(res, 'Trial limits status retrieved successfully', status);
    }

    /**
     * Create Razorpay order for subscription
     * POST /api/v1/user-subscriptions/razorpay/checkout
     * Employees cannot purchase subscriptions - they use admin's subscription
     */
    @TryCatch('Failed to create checkout session')
    static async createRazorpayCheckout(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }

        // Check if user is an employee - employees cannot purchase subscriptions
        const isEmployee = await EmployeeUtil.isEmployee(req.user);
        if (isEmployee) {
            throw new AppError(
                "Employees cannot purchase subscriptions. Your access is managed by your administrator. Please contact your administrator to upgrade the subscription.",
                ERROR_CODES.FORBIDDEN
            );
        }

        const request = {
            planId: req.body.planId,
            successUrl: req.body.successUrl,
            cancelUrl: req.body.cancelUrl,
        };

        const order = await RazorpayService.createOrder(request, req.user._id.toString());

        ResponseUtil.success(res, 'Checkout session created successfully', order, ERROR_CODES.CREATED);
    }

    /**
     * Verify Razorpay payment and activate subscription
     * POST /api/v1/user-subscriptions/razorpay/verify
     * Employees cannot purchase subscriptions - they use admin's subscription
     */
    @TryCatch('Failed to verify Razorpay payment')
    static async verifyRazorpayPayment(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }

        // Check if user is an employee - employees cannot purchase subscriptions
        const isEmployee = await EmployeeUtil.isEmployee(req.user);
        if (isEmployee) {
            throw new AppError(
                "Employees cannot purchase subscriptions. Your access is managed by your administrator. Please contact your administrator to upgrade the subscription.",
                ERROR_CODES.FORBIDDEN
            );
        }

        const { orderId, paymentId, signature, planId } = req.body;

        const isValid = RazorpayService.verifyPaymentSignature({
            razorpayOrderId: orderId,
            razorpayPaymentId: paymentId,
            razorpaySignature: signature,
        });

        if (!isValid) {
            throw new AppError('Invalid Razorpay signature', ERROR_CODES.BAD_REQUEST);
        }

        const subscription = await UserSubscriptionService.createPaidSubscriptionFromPlan(
            req.user._id.toString(),
            planId,
            orderId,
            paymentId
        );

        ResponseUtil.success(res, 'Payment verified and subscription activated', subscription, ERROR_CODES.CREATED);
    }

    /**
     * Get available addons
     * GET /api/v1/user-subscriptions/addons/available
     */
    @TryCatch('Failed to get available addons')
    static async getAvailableAddons(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        const publicOnly = req.query.publicOnly !== 'false';
        const addons = await UserSubscriptionService.getAvailableAddons(publicOnly);
        ResponseUtil.success(res, 'Available addons retrieved successfully', addons);
    }

    /**
     * Create Razorpay order for addon
     * POST /api/v1/user-subscriptions/addons/razorpay/checkout
     */
    @TryCatch('Failed to create addon checkout session')
    static async createAddonRazorpayCheckout(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }

        const { addonId } = req.body;
        if (!addonId) {
            throw new AppError('Addon ID is required', ERROR_CODES.BAD_REQUEST);
        }

        const order = await RazorpayService.createAddonOrder(addonId, req.user._id.toString());
        ResponseUtil.success(res, 'Addon checkout session created successfully', order, ERROR_CODES.CREATED);
    }

    /**
     * Verify Razorpay payment and activate addon
     * POST /api/v1/user-subscriptions/addons/razorpay/verify
     */
    @TryCatch('Failed to verify addon payment')
    static async verifyAddonPayment(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }

        const { orderId, paymentId, signature, addonId } = req.body;

        const isValid = RazorpayService.verifyPaymentSignature({
            razorpayOrderId: orderId,
            razorpayPaymentId: paymentId,
            razorpaySignature: signature,
        });

        if (!isValid) {
            throw new AppError('Invalid Razorpay signature', ERROR_CODES.BAD_REQUEST);
        }

        const addon = await UserSubscriptionService.createAddonSubscription(
            req.user._id.toString(),
            addonId,
            orderId,
            paymentId
        );

        ResponseUtil.success(res, 'Addon payment verified and activated', addon, ERROR_CODES.CREATED);
    }


    /**
     * Get all user subscriptions with pagination
     * GET /api/v1/user-subscriptions
     */
    @TryCatch('Failed to get user subscriptions')
    static async getAllUserSubscriptions(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        const query: IGetUserSubscriptionsQuery = req.query;

        if (!query.userId && req.user) {
            query.userId = req.user._id.toString();
        }

        const result = await UserSubscriptionService.getAllUserSubscriptions(query);

        ResponseUtil.success(res, 'User subscriptions retrieved successfully', result);
    }


    /**
     * Get user subscription history (all successful purchases)
     * GET /api/v1/user-subscriptions/history
     */
    @TryCatch('Failed to get subscription history')
    static async getUserSubscriptionHistory(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }

        const history = await UserSubscriptionService.getUserSubscriptionHistory(req.user._id.toString());

        ResponseUtil.success(res, 'Subscription history retrieved successfully', history);
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
        if (!req.user || !req.user.roles.includes('admin')) {
            throw new AppError('Admin access required', ERROR_CODES.FORBIDDEN);
        }

        await UserSubscriptionService.processExpiredSubscriptions();

        ResponseUtil.success(res, 'Expired subscriptions processed successfully');
    }

    /**
     * Handle Razorpay webhook events
     * POST /api/v1/user-subscriptions/razorpay/webhook
     * Note: This route does NOT require authentication as it's called by Razorpay
     */
    @TryCatch('Failed to process Razorpay webhook')
    static async handleRazorpayWebhook(req: any, res: Response, _next: NextFunction): Promise<void> {
        // Get webhook signature from header
        const webhookSignature = req.headers['x-razorpay-signature'];

        if (!webhookSignature) {
            throw new AppError('Missing Razorpay webhook signature', ERROR_CODES.UNAUTHORIZED);
        }

        // Get raw body (from middleware or fallback to stringified body)
        const rawBody = req.rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));

        // Verify webhook signature
        const isValidSignature = RazorpayService.verifyWebhookSignature(rawBody, webhookSignature);

        if (!isValidSignature) {
            throw new AppError('Invalid Razorpay webhook signature', ERROR_CODES.UNAUTHORIZED);
        }

        // Parse webhook event (already parsed in middleware, but handle both cases)
        const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

        const eventType = event.event || event.type;
        const payload = event.payload || event;

        // Handle different webhook events
        switch (eventType) {
            case 'payment.captured':
                await this.handlePaymentCaptured(payload);
                break;

            case 'payment.failed':
                // Payment failed
                await this.handlePaymentFailed(payload);
                break;

            case 'order.paid':
                // Order paid (alternative to payment.captured)
                await this.handleOrderPaid(payload);
                break;

            default:
                // Unhandled webhook event type
                break;
        }

        // Always return 200 to acknowledge receipt
        ResponseUtil.success(res, 'Webhook processed successfully');
    }

    /**
     * Handle payment.captured event
     */
    private static async handlePaymentCaptured(payload: any): Promise<void> {
        try {
            const payment = payload.payment?.entity || payload.payment;
            const order = payload.order?.entity || payload.order;

            if (!payment || !order) {
                return;
            }

            const orderId = order.id || order.order_id;
            const paymentId = payment.id || payment.payment_id;

            const userId = order.notes?.userId || payment.notes?.userId;
            const planId = order.notes?.planId || payment.notes?.planId;

            if (!userId || !planId) {
                return;
            }

            // Create subscription from plan with idempotency check
            await UserSubscriptionService.createPaidSubscriptionFromPlan(
                userId,
                planId,
                orderId,
                paymentId
            );
        } catch (error: any) {
            // Don't throw - webhook should still return 200
        }
    }

    /**
     * Handle payment.failed event
     */
    private static async handlePaymentFailed(_payload: any): Promise<void> {
        try {
            // Payment failure logic
        } catch (error: any) {
            // Silently handle error
        }
    }

    /**
     * Handle order.paid event
     */
    private static async handleOrderPaid(payload: any): Promise<void> {
        try {
            const order = payload.order?.entity || payload.order;
            const payment = payload.payment?.entity || payload.payment;

            if (!order || !payment) {
                return;
            }

            const orderId = order.id || order.order_id;
            const paymentId = payment.id || payment.payment_id;
            const userId = order.notes?.userId || payment.notes?.userId;
            const planId = order.notes?.planId || payment.notes?.planId;

            if (!userId || !planId) {
                return;
            }

            await UserSubscriptionService.createPaidSubscriptionFromPlan(
                userId,
                planId,
                orderId,
                paymentId
            );
        } catch (error: any) {
            // Don't throw - webhook should still return 200
        }
    }

    /**
     * Admin only: Add extra limits
     * POST /api/v1/user-subscriptions/extra-limits
     */
    @TryCatch('Failed to add extra limits')
    static async addExtraLimits(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        const { userId, type, quantity, notes, addonId } = req.body;

        if (!userId || !type || !quantity) {
            throw new AppError('Missing required fields: userId, type, quantity', ERROR_CODES.BAD_REQUEST);
        }

        const addon = await UserSubscriptionService.addExtraLimits(userId, type, quantity, 'admin', notes, addonId);

        ResponseUtil.success(res, 'Extra limits added successfully', addon, ERROR_CODES.CREATED);
    }
}
