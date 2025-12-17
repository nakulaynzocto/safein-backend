import { Response, NextFunction } from 'express';
import { UserSubscriptionService } from '../../services/userSubscription/userSubscription.service';
import { ResponseUtil } from '../../utils';
import {
    ICreateUserSubscriptionDTO,
    IUpdateUserSubscriptionDTO,
    IGetUserSubscriptionsQuery,
    IAssignFreePlanRequest,
    IGetUserActiveSubscriptionRequest,
    ICheckPremiumSubscriptionRequest
} from '../../types/userSubscription/userSubscription.types';
import { ERROR_CODES, TRIAL_LIMITS } from '../../utils/constants';
import { TryCatch } from '../../decorators';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/errorHandler';
import { RazorpayService } from '../../services/razorpay/razorpay.service';

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
        };

        // Free trial: 3 days only, planType = 'free'
        const subscription = await UserSubscriptionService.createFreeTrial(request.userId);

        ResponseUtil.success(res, 'Free plan assigned successfully', subscription, ERROR_CODES.CREATED);
    }

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
     * Check if user has premium subscription
     * GET /api/v1/user-subscriptions/check-premium/:userId
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
     * Get trial limits status
     * GET /api/v1/user-subscriptions/trial-limits
     */
    @TryCatch('Failed to get trial limits status')
    static async getTrialLimitsStatus(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user || !req.user._id) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }

        const userId = req.user._id.toString();
        const activeSubscription = await UserSubscriptionService.getUserActiveSubscription(userId);

        const isTrialLikePlan = !activeSubscription || activeSubscription.planType === 'free' || activeSubscription.isTrialing;

        if (isTrialLikePlan) {
            const counts = await UserSubscriptionService.getTrialLimitsCounts(userId);

            ResponseUtil.success(res, 'Trial limits status retrieved successfully', {
                isTrial: true,
                limits: {
                    employees: {
                        limit: TRIAL_LIMITS.employees,
                        current: counts.employees,
                        reached: counts.employees >= TRIAL_LIMITS.employees
                    },
                    visitors: {
                        limit: TRIAL_LIMITS.visitors,
                        current: counts.visitors,
                        reached: counts.visitors >= TRIAL_LIMITS.visitors
                    },
                    appointments: {
                        limit: TRIAL_LIMITS.appointments,
                        current: counts.appointments,
                        reached: counts.appointments >= TRIAL_LIMITS.appointments
                    },
                }
            });
            return;
        }

        ResponseUtil.success(res, 'Trial limits status retrieved successfully', {
            isTrial: false,
            limits: {
                employees: { limit: -1, current: 0, reached: false },
                visitors: { limit: -1, current: 0, reached: false },
                appointments: { limit: -1, current: 0, reached: false },
            }
        });
    }

    /**
     * Create Razorpay order for subscription
     * POST /api/v1/user-subscriptions/razorpay/checkout
     */
    @TryCatch('Failed to create checkout session')
    static async createRazorpayCheckout(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
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
     */
    @TryCatch('Failed to verify Razorpay payment')
    static async verifyRazorpayPayment(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
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
        if (!req.user || req.user.role !== 'admin') {
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
        
        // Razorpay webhook structure: { event: 'payment.captured', payload: { payment: {...}, order: {...} } }
        const eventType = event.event || event.type;
        const payload = event.payload || event;

        console.log('Razorpay webhook received:', {
            eventType,
            payloadKeys: Object.keys(payload),
            orderId: payload.order?.entity?.id || payload.order?.id,
            paymentId: payload.payment?.entity?.id || payload.payment?.id
        });

        // Handle different webhook events
        switch (eventType) {
            case 'payment.captured':
                // Payment successfully captured
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
                console.log(`Unhandled Razorpay webhook event: ${eventType}`);
        }

        // Always return 200 to acknowledge receipt
        ResponseUtil.success(res, 'Webhook processed successfully');
    }

    /**
     * Handle payment.captured event
     */
    private static async handlePaymentCaptured(payload: any): Promise<void> {
        try {
            // Razorpay webhook payload structure: { payment: { entity: {...} }, order: { entity: {...} } }
            const payment = payload.payment?.entity || payload.payment;
            const order = payload.order?.entity || payload.order;
            
            if (!payment || !order) {
                console.error('Invalid payment.captured payload - missing payment or order:', {
                    hasPayment: !!payment,
                    hasOrder: !!order,
                    payloadKeys: Object.keys(payload)
                });
                return;
            }

            const orderId = order.id || order.order_id;
            const paymentId = payment.id || payment.payment_id;
            
            // Get userId and planId from order notes (we stored them when creating the order)
            const userId = order.notes?.userId || payment.notes?.userId;
            const planId = order.notes?.planId || payment.notes?.planId;

            if (!userId || !planId) {
                console.error('Missing userId or planId in payment notes:', { 
                    orderId, 
                    paymentId,
                    orderNotes: order.notes,
                    paymentNotes: payment.notes
                });
                return;
            }

            // Create subscription from plan with idempotency check
            await UserSubscriptionService.createPaidSubscriptionFromPlan(
                userId, 
                planId,
                orderId,
                paymentId
            );
            console.log(`✅ Subscription created for user ${userId} from plan ${planId} via webhook (Order: ${orderId}, Payment: ${paymentId})`);
        } catch (error: any) {
            console.error('Error handling payment.captured:', error);
            // Don't throw - webhook should still return 200
        }
    }

    /**
     * Handle payment.failed event
     */
    private static async handlePaymentFailed(payload: any): Promise<void> {
        try {
            const { payment, order } = payload.payment?.entity || payload;
            console.log('Payment failed:', payment?.id || payment?.payment_id, order?.id || order?.order_id);
            // Log failed payment for monitoring
            // You can add additional logic here like sending notification to user
        } catch (error: any) {
            console.error('Error handling payment.failed:', error);
        }
    }

    /**
     * Handle order.paid event
     */
    private static async handleOrderPaid(payload: any): Promise<void> {
        try {
            // Razorpay webhook payload structure: { order: { entity: {...} }, payment: { entity: {...} } }
            const order = payload.order?.entity || payload.order;
            const payment = payload.payment?.entity || payload.payment;
            
            if (!order || !payment) {
                console.error('Invalid order.paid payload - missing order or payment:', {
                    hasOrder: !!order,
                    hasPayment: !!payment,
                    payloadKeys: Object.keys(payload)
                });
                return;
            }

            const orderId = order.id || order.order_id;
            const paymentId = payment.id || payment.payment_id;
            const userId = order.notes?.userId || payment.notes?.userId;
            const planId = order.notes?.planId || payment.notes?.planId;

            if (!userId || !planId) {
                console.error('Missing userId or planId in order notes:', { 
                    orderId, 
                    paymentId,
                    orderNotes: order.notes,
                    paymentNotes: payment.notes
                });
                return;
            }

            // Create subscription from plan with order and payment IDs
            await UserSubscriptionService.createPaidSubscriptionFromPlan(
                userId, 
                planId, 
                orderId, 
                paymentId
            );
            console.log(`✅ Subscription created for user ${userId} from plan ${planId} via order.paid webhook`);
        } catch (error: any) {
            console.error('Error handling order.paid:', error);
            // Don't throw - webhook should still return 200
        }
    }
}
