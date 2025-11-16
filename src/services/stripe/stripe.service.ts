import Stripe from 'stripe';
import mongoose from 'mongoose';
import { CONSTANTS, ERROR_CODES } from '../../utils/constants';
import { AppError } from '../../middlewares/errorHandler';
import { stripe } from '../../config/stripe.config'; // Import the pre-initialized Stripe instance
import {
    IStripeCheckoutSessionRequest,
    IStripeCheckoutSessionResponse,
    IStripeCustomer,
    IStripeSubscription,
    IStripePrice,
    IStripeProduct,
    ICreateStripeCustomerRequest,
    IUpdateStripeCustomerRequest
} from '../../types/userSubscription/userSubscription.types';
import { SubscriptionPlan } from '../../models/subscription/subscription.model';
import { User } from '../../models/user/user.model';
import { UserSubscriptionService } from '../userSubscription/userSubscription.service'; // Add this import
import { UserSubscription } from '../../models/userSubscription/userSubscription.model';

export class StripeService {

    /**
     * Initializes the Stripe service with the secret key.
     * This should be called once at application startup.
     */
    static initialize(): void {
        if (!stripe) {
            throw new Error('Stripe secret key is not configured.');
        }
    }

    /**
     * Returns the initialized Stripe instance.
     */
    static getStripe(): Stripe {
        return stripe;
    }

    /**
     * Create a Setup Intent for payment method verification
     */
    static async createPaymentMethodSetupIntent(customerId: string): Promise<Stripe.SetupIntent> {
        try {
            const setupIntent = await stripe.setupIntents.create({
                customer: customerId,
                usage: 'off_session', // Use off_session to enable future payments
            });
            return setupIntent;
        } catch (error) {
            throw new AppError('Failed to create Setup Intent for payment method verification', ERROR_CODES.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Handle setup_intent.succeeded webhook event
     */
    private static async handleSetupIntentSucceeded(setupIntent: Stripe.SetupIntent): Promise<void> {
        try {
            const userId = setupIntent.metadata?.userId as string;
            const stripeCustomerId = setupIntent.customer as string;

            if (!userId || !stripeCustomerId) {
                return;
            }

            // Free trial: 3 days only, planType = 'free'
            await UserSubscriptionService.createFreeTrial(userId, stripeCustomerId, 3);

        } catch (error) {
            throw error;
        }
    }

    /**
     * Create Stripe checkout session for subscription
     */
    static async createCheckoutSession(
        data: IStripeCheckoutSessionRequest,
        userId: string
    ): Promise<IStripeCheckoutSessionResponse> {
        try {

            // Find the subscription plan - handle both ObjectId string and ObjectId
            let plan;
            try {
                plan = await SubscriptionPlan.findById(data.planId).where({
                    isDeleted: false,
                    isActive: true,
                });
            } catch (error) {
                // If findById fails, try finding by _id field
                plan = await SubscriptionPlan.findOne({
                    _id: data.planId,
                    isDeleted: false,
                    isActive: true,
                });
            }
            
            if (!plan) {
                throw new AppError(
                    `Subscription plan not found for planId: ${data.planId}. Please ensure the plan exists and is active.`,
                    ERROR_CODES.NOT_FOUND
                );
            }

            // If plan is free, use free verification flow
            if (plan.planType === 'free') {
                return await this.createFreePlanVerificationSession(
                    {
                        successUrl: data.successUrl,
                        cancelUrl: data.cancelUrl,
                    },
                    userId
                );
            }

            const user = await User.findOne({ _id: userId });

            if (!user) {
                throw new AppError('User not found', ERROR_CODES.NOT_FOUND);
            }

            let customerEmail: string;
            if (user.email) {
                customerEmail = user.email;
            } else {
                throw new AppError(
                    'User must have an email for payment',
                    ERROR_CODES.BAD_REQUEST
                );
            }

            let customerId: string;
            try {
                const existingCustomers = await this.getStripe().customers.list({
                    email: customerEmail,
                    limit: 1,
                });

                if (existingCustomers.data.length > 0) {
                    customerId = existingCustomers.data[0].id;
                } else {
                    const customer = await this.getStripe().customers.create({
                        email: customerEmail,
                        metadata: {
                            userId: userId,
                        },
                    });
                    customerId = customer.id;
                }
            } catch (error) {
                throw new AppError(
                    'Failed to create Stripe customer',
                    ERROR_CODES.INTERNAL_SERVER_ERROR
                );
            }

            let priceId: string;
            try {
                const stripeInstance = this.getStripe();
                let productId: string | null = null;

                const existingStripeProductId = (plan as any).metadata?.stripeProductId as string | undefined;

                if (existingStripeProductId) {
                    try {
                        const product = await stripeInstance.products.retrieve(existingStripeProductId);
                        if (product && !product.deleted) {
                            productId = product.id;
                        }
                    } catch {
                        productId = null;
                    }
                }

                if (!productId) {
                    const product = await stripeInstance.products.create({
                        name: plan.name,
                        description: (plan as any).description || '',
                        metadata: {
                            planId: (plan._id as any).toString(),
                            planType: plan.planType,
                        },
                    });

                    productId = product.id;

                    (plan as any).metadata = {
                        ...(plan as any).metadata,
                        stripeProductId: productId,
                    };
                    await plan.save();
                }

                const prices = await stripeInstance.prices.list({
                    product: productId,
                    active: true,
                    limit: 1,
                });

                if (prices.data.length > 0) {
                    priceId = prices.data[0].id;
                } else {
                    const price = await stripeInstance.prices.create({
                        unit_amount: plan.amount,
                        currency: plan.currency,
                        recurring: {
                            interval: plan.planType === 'monthly' ? 'month' : 'year',
                            interval_count: 1,
                        },
                        product: productId,
                        metadata: {
                            planId: (plan._id as any).toString(),
                            planName: plan.name,
                        },
                    });
                    priceId = price.id;
                }
            } catch (error: any) {
                throw new AppError(
                    error?.message || 'Failed to create Stripe price',
                    ERROR_CODES.INTERNAL_SERVER_ERROR
                );
            }

            const session = await this.getStripe().checkout.sessions.create({
                mode: 'subscription',
                payment_method_types: ['card'],
                line_items: [
                    {
                        price: priceId,
                        quantity: 1,
                    },
                ],
                customer: customerId,
                client_reference_id: userId,
                success_url:
                    data.successUrl ||
                    `${CONSTANTS.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url:
                    data.cancelUrl || `${CONSTANTS.FRONTEND_URL}/subscription/cancel`,
                metadata: {
                    userId: userId,
                    planId: data.planId,
                    email: customerEmail,
                },
                subscription_data: {
                    metadata: {
                        userId: userId,
                        planId: data.planId,
                        email: customerEmail,
                    },
                },
            } as any);

            return {
                sessionId: session.id,
                url: session.url || '',
            };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(
                'Failed to create checkout session',
                ERROR_CODES.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Create Stripe checkout session for free plan card verification (₹50 charge - non-refundable)
     * Note: Stripe requires minimum 50 cents USD (₹50 INR is approximately $0.60, which meets the requirement)
     */
    static async createFreePlanVerificationSession(
        data: { successUrl?: string; cancelUrl?: string },
        userId: string
    ): Promise<IStripeCheckoutSessionResponse> {
        try {
            const user = await User.findOne({ _id: userId });

            if (!user) {
                throw new AppError('User not found', ERROR_CODES.NOT_FOUND);
            }

            if (!user.email) {
                throw new AppError(
                    'User must have an email for payment',
                    ERROR_CODES.BAD_REQUEST
                );
            }

            const stripeInstance = this.getStripe();
            
            if (!stripeInstance) {
                throw new AppError(
                    'Stripe is not initialized. Please check STRIPE_SECRET_KEY configuration.',
                    ERROR_CODES.INTERNAL_SERVER_ERROR
                );
            }

            let customerId: string;
            
            // Check if user already has a Stripe customer ID
            if (user.stripeCustomerId) {
                try {
                    // Verify the customer exists in Stripe
                    const existingCustomer = await stripeInstance.customers.retrieve(user.stripeCustomerId);
                    if (existingCustomer && !existingCustomer.deleted) {
                        customerId = user.stripeCustomerId;
                    } else {
                        // Customer was deleted in Stripe, create a new one
                        const customer = await stripeInstance.customers.create({
                            email: user.email,
                            metadata: {
                                userId: userId,
                            },
                        });
                        customerId = customer.id;
                        // Update user's stripeCustomerId
                        user.stripeCustomerId = customerId;
                        await user.save();
                    }
                } catch (error: any) {
                    // Customer doesn't exist, create a new one
                    const customer = await stripeInstance.customers.create({
                        email: user.email,
                        metadata: {
                            userId: userId,
                        },
                    });
                    customerId = customer.id;
                    // Update user's stripeCustomerId
                    user.stripeCustomerId = customerId;
                    await user.save();
                }
            } else {
                // User doesn't have a Stripe customer ID, search by email first
                const existingCustomers = await stripeInstance.customers.list({
                    email: user.email,
                    limit: 1,
                });

                if (existingCustomers.data.length > 0) {
                    customerId = existingCustomers.data[0].id;
                    // Update user's stripeCustomerId
                    user.stripeCustomerId = customerId;
                    await user.save();
                } else {
                    const customer = await stripeInstance.customers.create({
                        email: user.email,
                        metadata: {
                            userId: userId,
                        },
                    });
                    customerId = customer.id;
                    // Update user's stripeCustomerId
                    user.stripeCustomerId = customerId;
                    await user.save();
                }
            }

            // Validate URLs
            const successUrl = data.successUrl || 
                `${CONSTANTS.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
            const cancelUrl = data.cancelUrl || 
                `${CONSTANTS.FRONTEND_URL}/subscription/cancel`;

            if (!CONSTANTS.FRONTEND_URL && !data.successUrl) {
                throw new AppError(
                    'FRONTEND_URL is not configured and no successUrl provided',
                    ERROR_CODES.BAD_REQUEST
                );
            }

            const session = await stripeInstance.checkout.sessions.create({
                mode: 'payment',
                payment_method_types: ['card'],
                line_items: [
                    {
                        price_data: {
                            currency: 'inr',
                            unit_amount: 5000, // ₹50 (5000 paise = 50 rupees) - Stripe minimum requirement
                            product_data: {
                                name: 'Card Verification - 3 Day Trial',
                                description: '₹50 will be charged (non-refundable) for 3 Day Trial card verification.',
                            },
                        },
                        quantity: 1,
                    },
                ],
                customer: customerId,
                client_reference_id: userId,
                success_url: successUrl,
                cancel_url: cancelUrl,
                metadata: {
                    userId: userId,
                    type: 'free_verification',
                    email: user.email,
                },
            });

            return {
                sessionId: session.id,
                url: session.url || '',
            };
        } catch (error: any) {
            // Log the actual error for debugging
            console.error('Error creating free plan verification session:', {
                error: error.message,
                stack: error.stack,
                userId,
                stripeError: error.type || error.code || 'Unknown',
            });

            if (error instanceof AppError) {
                throw error;
            }
            
            // Provide more specific error messages
            if (error.type === 'StripeInvalidRequestError') {
                throw new AppError(
                    `Stripe error: ${error.message}`,
                    ERROR_CODES.BAD_REQUEST
                );
            }
            
            throw new AppError(
                `Failed to create free plan verification session: ${error.message || 'Unknown error'}`,
                ERROR_CODES.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Handle Stripe webhook events
     */
    static async handleWebhookEvent(
        payload: string | Buffer,
        signature: string
    ): Promise<void> {
        try {
            const event = this.verifyWebhookSignature(payload, signature);

            switch (event.type) {
                case 'checkout.session.completed':
                    await this.handleCheckoutSessionCompleted(event.data.object);
                    break;

                case 'customer.subscription.created':
                    await this.handleCustomerSubscriptionCreated(event.data.object);
                    break;

                case 'customer.subscription.updated':
                    await this.handleCustomerSubscriptionUpdated(event.data.object);
                    break;

                case 'customer.subscription.deleted':
                    await this.handleCustomerSubscriptionDeleted(event.data.object);
                    break;

                case 'invoice.payment_succeeded':
                    await this.handleInvoicePaymentSucceeded(event.data.object);
                    break;

                case 'invoice.payment_failed':
                    await this.handleInvoicePaymentFailed(event.data.object);
                    break;

                case 'setup_intent.succeeded':
                    await this.handleSetupIntentSucceeded(event.data.object);
                    break;

                default:
                    break;
            }
        } catch (error) {
            throw error;
        }
    }

    /**
     * Verify webhook signature
     */
    static verifyWebhookSignature(
        payload: string | Buffer,
        signature: string
    ): Stripe.Event {
        try {
            const stripe = this.getStripe();

            if (!CONSTANTS.STRIPE_WEBHOOK_SECRET) {
                throw new Error('STRIPE_WEBHOOK_SECRET is required');
            }

            const event = stripe.webhooks.constructEvent(
                payload,
                signature,
                CONSTANTS.STRIPE_WEBHOOK_SECRET
            );

            return event;
        } catch (error) {
            throw new Error('Invalid webhook signature');
        }
    }

    /**
     * Create or find Stripe customer
     */
    static async findOrCreateCustomer(
        request: ICreateStripeCustomerRequest
    ): Promise<IStripeCustomer> {
        try {
            const stripe = this.getStripe();

            const existingCustomers = await stripe.customers.list({
                email: request.email,
                limit: 1,
            });

            if (existingCustomers.data.length > 0) {
                return existingCustomers.data[0] as IStripeCustomer;
            }

            const customer = await stripe.customers.create({
                email: request.email,
                name: request.name,
                metadata: request.metadata || {},
            });

            return customer as IStripeCustomer;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update Stripe customer
     */
    static async updateCustomer(
        request: IUpdateStripeCustomerRequest
    ): Promise<IStripeCustomer> {
        try {
            const stripe = this.getStripe();

            const customer = await stripe.customers.update(request.customerId, {
                email: request.email,
                name: request.name,
                metadata: request.metadata,
            });

            return customer as IStripeCustomer;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Handle checkout session completed
     */
    private static async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
        try {
            if (session.mode === 'payment' && session.metadata?.type === 'free_verification') {
                const userId = session.metadata?.userId as string;
                const customerId = session.customer as string;

                if (!userId || !customerId) {
                    return;
                }

                // Free trial: 3 days only, planType = 'free'
                // Payment is non-refundable for trial verification
                await UserSubscriptionService.createFreeTrial(userId, customerId, 3);

                // No refund processing - payment is non-refundable
                return;
            }

            const subscriptionId = session.subscription as string;
            if (!subscriptionId) {
                return;
            }

            const subscription = await this.getStripe().subscriptions.retrieve(subscriptionId, {
                expand: ['items.data.price.product']
            });

            const userId = subscription.metadata?.userId || session.metadata?.userId;
            const planId = subscription.metadata?.planId || session.metadata?.planId;

            if (!userId || !planId) {
                return;
            }

            const subscriptionPlan = await SubscriptionPlan.findById(planId);
            if (!subscriptionPlan) {
                return;
            }

            const user = await User.findById(userId);
            if (!user) {
                return;
            }

            const customerId = subscription.customer as string;
            if (customerId && !user.stripeCustomerId) {
                user.stripeCustomerId = customerId;
                await user.save();
            }

            const existingSubscription = await UserSubscription.findOne({
                userId: new mongoose.Types.ObjectId(userId),
                stripeSubscriptionId: subscription.id
            });

            if (existingSubscription) {
                existingSubscription.isActive = subscription.status === 'active' || subscription.status === 'trialing';
                existingSubscription.paymentStatus = subscription.status === 'active' ? 'succeeded' : 'pending';
                existingSubscription.startDate = new Date((subscription as any).current_period_start * 1000);
                existingSubscription.endDate = new Date((subscription as any).current_period_end * 1000);
                existingSubscription.stripeCustomerId = customerId;
                await existingSubscription.save();

                user.activeSubscriptionId = existingSubscription._id as unknown as mongoose.Types.ObjectId;
                await user.save();
            } else {
                const newSubscription = await UserSubscriptionService.createUserSubscription({
                    userId: userId,
                    planType: subscriptionPlan.planType,
                    startDate: new Date((subscription as any).current_period_start * 1000),
                    endDate: new Date((subscription as any).current_period_end * 1000),
                    isActive: subscription.status === 'active' || subscription.status === 'trialing',
                    paymentStatus: subscription.status === 'active' ? 'succeeded' : 'pending',
                    stripeCustomerId: customerId,
                    stripeSubscriptionId: subscription.id,
                });

                user.activeSubscriptionId = (newSubscription as any)._id as unknown as mongoose.Types.ObjectId;
                await user.save();
            }

        } catch (error) {
            throw error;
        }
    }

    private static async handleCustomerSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
        const customerId = subscription.customer as string;
        const userId = subscription.metadata?.userId;
        const planId = subscription.items.data[0].price.product as string;

        if (!userId || !customerId || !planId) {
            return;
        }

        const user = await User.findById(userId);
        const subscriptionPlan = await SubscriptionPlan.findOne({ 'metadata.stripeProductId': planId });

        if (!user || !subscriptionPlan) {
            return;
        }

        await UserSubscriptionService.createUserSubscription({
            userId: userId,
            planType: subscriptionPlan.planType,
            startDate: new Date(((subscription as any).current_period_start) * 1000),
            endDate: new Date(((subscription as any).current_period_end) * 1000),
            isActive: subscription.status === 'active',
            paymentStatus: 'succeeded',
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
        });
    }

    /**
     * Handle subscription updated
     */
    private static async handleCustomerSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
        const userSubscription = await UserSubscription.findOne({ stripeSubscriptionId: subscription.id });

        if (!userSubscription) {
            console.warn(`User subscription not found for Stripe subscription ID: ${subscription.id}`);
            return;
        }

        userSubscription.isActive = subscription.status === 'active' || subscription.status === 'trialing';
        userSubscription.paymentStatus = subscription.status === 'active' ? 'succeeded' : 'failed';
        userSubscription.endDate = new Date(((subscription as any).current_period_end) * 1000);
        if (subscription.trial_end) {
            userSubscription.trialDays = Math.ceil(((new Date((subscription.trial_end as number) * 1000)).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        }
        await userSubscription.save();
    }

    /**
     * Handle subscription deleted
     */
    private static async handleCustomerSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
        const userSubscription = await UserSubscription.findOne({ stripeSubscriptionId: subscription.id });

        if (!userSubscription) {
            return;
        }

        userSubscription.isDeleted = true;
        userSubscription.deletedAt = new Date();
        userSubscription.isActive = false;
        userSubscription.paymentStatus = 'cancelled';
        await userSubscription.save();
    }

    /**
     * Handle payment succeeded
     */
    private static async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
        const customerId = invoice.customer as string;
        const subscriptionId = (invoice as any).subscription;

        if (!customerId || !subscriptionId) {
            return;
        }

        const userSubscription = await UserSubscription.findOne({ stripeSubscriptionId: subscriptionId });

        if (userSubscription) {
            userSubscription.isActive = true;
            userSubscription.paymentStatus = 'succeeded';
            userSubscription.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            await userSubscription.save();
        }
    }

    /**
     * Handle payment failed
     */
    private static async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
        const customerId = invoice.customer as string;
        const subscriptionId = (invoice as any).subscription;

        if (!customerId || !subscriptionId) {
            return;
        }

        const userSubscription = await UserSubscription.findOne({ stripeSubscriptionId: subscriptionId });

        if (userSubscription) {
            userSubscription.isActive = false;
            userSubscription.paymentStatus = 'failed';
            await userSubscription.save();
        }
    }

    /**
     * Cancel Stripe subscription
     */
    static async cancelSubscription(subscriptionId: string): Promise<void> {
        try {
            const stripe = this.getStripe();

            await stripe.subscriptions.cancel(subscriptionId);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get Stripe subscription
     */
    static async getSubscription(subscriptionId: string): Promise<IStripeSubscription> {
        try {
            const stripe = this.getStripe();

            const subscription = await stripe.subscriptions.retrieve(subscriptionId);

            return subscription as unknown as IStripeSubscription;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get Stripe customer
     */
    static async getCustomer(customerId: string): Promise<IStripeCustomer> {
        try {
            const stripe = this.getStripe();

            const customer = await stripe.customers.retrieve(customerId);

            return customer as IStripeCustomer;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get Stripe price
     */
    static async getPrice(priceId: string): Promise<IStripePrice> {
        try {
            const stripe = this.getStripe();

            const price = await stripe.prices.retrieve(priceId);

            return price as IStripePrice;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get Stripe product
     */
    static async getProduct(productId: string): Promise<IStripeProduct> {
        try {
            const stripe = this.getStripe();

            const product = await stripe.products.retrieve(productId);

            return product as IStripeProduct;
        } catch (error) {
            throw error;
        }
    }
}
