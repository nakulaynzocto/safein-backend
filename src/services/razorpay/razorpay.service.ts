import Razorpay from 'razorpay';
import { razorpayConfig } from '../../config/razorpay.config';
import { AppError } from '../../middlewares/errorHandler';
import { ERROR_CODES } from '../../utils/constants';
import { SubscriptionPlan } from '../../models/subscription/subscription.model';
import { User } from '../../models/user/user.model';

export interface IRazorpayOrderRequest {
    planId: string;
    successUrl?: string;
    cancelUrl?: string;
}

export interface IRazorpayOrderResponse {
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
    planId: string;
    userEmail: string;
}

export class RazorpayService {
    private static instance: Razorpay | null = null;

    private static getClient(): Razorpay {
        if (!this.instance) {
            if (!razorpayConfig.keyId || !razorpayConfig.keySecret) {
                throw new AppError('Razorpay keys are not configured', ERROR_CODES.INTERNAL_SERVER_ERROR);
            }
            this.instance = new Razorpay({
                key_id: razorpayConfig.keyId,
                key_secret: razorpayConfig.keySecret,
            });
        }
        return this.instance;
    }

    static async createOrder(data: IRazorpayOrderRequest, userId: string): Promise<IRazorpayOrderResponse> {
        const plan = await SubscriptionPlan.findById(data.planId).where({
            isDeleted: false,
            isActive: true,
        });

        if (!plan) {
            throw new AppError('Subscription plan not found or inactive', ERROR_CODES.NOT_FOUND);
        }

        const user = await User.findById(userId);
        if (!user) {
            throw new AppError('User not found', ERROR_CODES.NOT_FOUND);
        }
        if (!user.email) {
            throw new AppError('User must have an email for payment', ERROR_CODES.BAD_REQUEST);
        }

        // Razorpay expects amount in the smallest currency unit (paise for INR)
        // plan.amount is stored in rupees, so multiply by 100 to convert to paise
        const amountInSubUnits = Math.round((plan.amount || 0) * 100);
        const planId = (plan as any)._id ? (plan as any)._id.toString() : String(data.planId);

        try {
            const planIdStr = (plan as any)._id
                ? (plan as any)._id.toString()
                : String(data.planId);

            const receipt = `plan_${planIdStr.slice(-10)}_${Date.now()
                .toString()
                .slice(-6)}`;

            const order = await this.getClient().orders.create({
                amount: amountInSubUnits,
                currency: plan.currency?.toUpperCase() || 'INR',
                receipt,
                payment_capture: true,
                notes: {
                    planId: planIdStr,
                    userId,
                    email: user.email,
                },
            } as any);
            return {
                orderId: (order as any).id,
                amount: Number((order as any).amount),
                currency: (order as any).currency,
                keyId: razorpayConfig.keyId,
                planId,
                userEmail: user.email,
            };

        } catch (error: any) {
            console.error('Razorpay order creation failed:', error);
            throw new AppError(
                `Failed to create Razorpay order: ${error?.error?.description || error.message
                }`,
                ERROR_CODES.INTERNAL_SERVER_ERROR
            );
        }
    }

    static verifyPaymentSignature(params: {
        razorpayOrderId: string;
        razorpayPaymentId: string;
        razorpaySignature: string;
    }): boolean {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = params;
        if (!razorpayConfig.keySecret) {
            throw new AppError('Razorpay key secret is not configured', ERROR_CODES.INTERNAL_SERVER_ERROR);
        }

        const crypto = require('crypto');
        const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
        const expectedSignature = crypto
            .createHmac('sha256', razorpayConfig.keySecret)
            .update(payload)
            .digest('hex');

        return expectedSignature === razorpaySignature;
    }

    /**
     * Verify Razorpay webhook signature
     * @param webhookBody - Raw webhook request body (as string)
     * @param webhookSignature - X-Razorpay-Signature header value
     * @returns boolean - true if signature is valid
     */
    static verifyWebhookSignature(webhookBody: string, webhookSignature: string): boolean {
        if (!razorpayConfig.keySecret) {
            throw new AppError('Razorpay key secret is not configured', ERROR_CODES.INTERNAL_SERVER_ERROR);
        }

        const crypto = require('crypto');
        const expectedSignature = crypto
            .createHmac('sha256', razorpayConfig.keySecret)
            .update(webhookBody)
            .digest('hex');

        return expectedSignature === webhookSignature;
    }
}


