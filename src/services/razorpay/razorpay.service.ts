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
        const amountInSubUnits = Math.round((plan.amount || 0) * 100);
        const planId = (plan as any)._id ? (plan as any)._id.toString() : String(data.planId);

        try {
            const order = await this.getClient().orders.create({
                amount: amountInSubUnits,
                currency: plan.currency || 'INR',
                receipt: `plan_${planId}_${Date.now()}`,
                notes: {
                    planId,
                    userId,
                    email: user.email,
                },
            });

            return {
                orderId: order.id,
                amount: Number(order.amount ?? 0),
                currency: order.currency,
                keyId: razorpayConfig.keyId,
                planId,
                userEmail: user.email,
            };
        } catch (error) {
            throw new AppError('Failed to create Razorpay order', ERROR_CODES.INTERNAL_SERVER_ERROR);
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
}


