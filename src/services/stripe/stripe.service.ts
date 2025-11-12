import Stripe from 'stripe';
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
            console.error('Error creating Setup Intent:', error);
            throw new AppError('Failed to create Setup Intent for payment method verification', ERROR_CODES.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Handle setup_intent.succeeded webhook event
     */
    private static async handleSetupIntentSucceeded(setupIntent: Stripe.SetupIntent): Promise<void> {
        try {
            console.log(`Setup Intent succeeded: ${setupIntent.id}`);
            const userId = setupIntent.metadata?.userId as string;
            const stripeCustomerId = setupIntent.customer as string;

            if (!userId || !stripeCustomerId) {
                console.error('Missing userId or stripeCustomerId in Setup Intent metadata');
                return;
            }

            // Activate a free trial for the user
            await UserSubscriptionService.createFreeTrial(userId, stripeCustomerId);
            console.log(`Free trial activated for user ${userId}`);

        } catch (error) {
            console.error('Error handling setup_intent.succeeded:', error);
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

            console.log(data, userId, "datadatadatadata>>>>>");
            // Get the subscription plan
            const plan = await SubscriptionPlan.findById(data.planId).where({
                isDeleted: false,
                isActive: true,
            });
            if (!plan) {
                throw new AppError(
                    'Subscription plan not found',
                    ERROR_CODES.NOT_FOUND
                );
            }

            const user = await User.findOne({ _id: userId });

            console.log(user, "useruseruser");
            if (!user) {
                throw new AppError('User not found', ERROR_CODES.NOT_FOUND);
            }

            // Handle email for Stripe customer
            let customerEmail: string;
            if (user.email) {
                customerEmail = user.email;
            } else {
                throw new AppError(
                    'User must have an email for payment',
                    ERROR_CODES.BAD_REQUEST
                );
            }

            // Create or get Stripe customer
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
                console.log(error);
                throw new AppError(
                    'Failed to create Stripe customer',
                    ERROR_CODES.INTERNAL_SERVER_ERROR
                );
            }

            // Create Stripe product and price if they don't exist
            let priceId: string;
            try {
                // First, create or get Stripe product
                let productId: string;
                try {
                    const existingProducts = await this.getStripe().products.list({
                        active: true,
                        limit: 100,
                    });

                    console.log(existingProducts.data);

                    const existingProduct = existingProducts.data.find(
                        (p) => p.id === (plan.metadata?.stripeProductId as any).toString()
                    );

                    if (existingProduct) {
                        productId = existingProduct.id;
                    } else {
                        throw new AppError('Stripe plan not found', ERROR_CODES.NOT_FOUND);
                    }
                } catch (error) {
                    throw new AppError(
                        'Failed to create Stripe product',
                        ERROR_CODES.INTERNAL_SERVER_ERROR
                    );
                }

                // Then, create or get Stripe price
                const prices = await this.getStripe().prices.list({
                    product: productId,
                    active: true,
                    limit: 1,
                });

                if (prices.data.length > 0) {
                    priceId = prices.data[0].id;
                } else {
                    // Create a new price
                    const price = await this.getStripe().prices.create({
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
            } catch (error) {
                console.log(error);
                throw new AppError(
                    'Failed to create Stripe price',
                    ERROR_CODES.INTERNAL_SERVER_ERROR
                );
            }

            // Create checkout session
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
     * Handle Stripe webhook events
     */
    static async handleWebhookEvent(
        payload: string | Buffer,
        signature: string
    ): Promise<void> {
        try {
            // Verify webhook signature
            const event = this.verifyWebhookSignature(payload, signature);

            console.log(`Processing webhook event: ${event.type}`);

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
                    console.log(`Unhandled event type: ${event.type}`);
            }
        } catch (error) {
            console.error('Error handling webhook event:', error);
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
            console.error('Webhook signature verification failed:', error);
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

            // First, try to find existing customer
            const existingCustomers = await stripe.customers.list({
                email: request.email,
                limit: 1,
            });

            if (existingCustomers.data.length > 0) {
                return existingCustomers.data[0] as IStripeCustomer;
            }

            // Create new customer
            const customer = await stripe.customers.create({
                email: request.email,
                name: request.name,
                metadata: request.metadata || {},
            });

            console.log(`Customer created: ${customer.id}`);
            return customer as IStripeCustomer;
        } catch (error) {
            console.error('Error creating/finding customer:', error);
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

            console.log(`Customer updated: ${customer.id}`);
            return customer as IStripeCustomer;
        } catch (error) {
            console.error('Error updating customer:', error);
            throw error;
        }
    }

    /**
     * Handle checkout session completed
     */
    private static async handleCheckoutSessionCompleted(session: any): Promise<void> {
        try {
            console.log(`Checkout session completed: ${session.id}`);

            // Here you would typically:
            // 1. Get the subscription from Stripe
            // 2. Create/update user subscription in your database
            // 3. Send confirmation email

            // This will be implemented in the SubscriptionService
        } catch (error) {
            console.error('Error handling checkout session completed:', error);
            throw error;
        }
    }

    /**
     * Handle subscription created
     */
    private static async handleCustomerSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
        const customerId = subscription.customer as string;
        const userId = subscription.metadata?.userId; // Assuming userId is in metadata
        const planId = subscription.items.data[0].price.product as string; // Stripe product ID

        if (!userId || !customerId || !planId) {
            console.error('Missing userId, customerId, or planId in Stripe subscription created event.');
            return;
        }

        const user = await User.findById(userId);
        const subscriptionPlan = await SubscriptionPlan.findOne({ 'metadata.stripeProductId': planId });

        if (!user || !subscriptionPlan) {
            console.error(`User or SubscriptionPlan not found for userId: ${userId}, planId: ${planId}`);
            return;
        }

        // Create or update our internal UserSubscription record
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
        console.log(`Internal user subscription created/updated for user ${userId} and Stripe subscription ${subscription.id}`);
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

        // Update relevant fields based on Stripe subscription status
        userSubscription.isActive = subscription.status === 'active' || subscription.status === 'trialing';
        userSubscription.paymentStatus = subscription.status === 'active' ? 'succeeded' : 'failed';
        userSubscription.endDate = new Date(((subscription as any).current_period_end) * 1000);
        if (subscription.trial_end) {
            userSubscription.trialDays = Math.ceil(((new Date((subscription.trial_end as number) * 1000)).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        }
        await userSubscription.save();
        console.log(`Internal user subscription updated for Stripe subscription ${subscription.id}`);
    }

    /**
     * Handle subscription deleted
     */
    private static async handleCustomerSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
        const userSubscription = await UserSubscription.findOne({ stripeSubscriptionId: subscription.id });

        if (!userSubscription) {
            console.warn(`User subscription not found for Stripe subscription ID: ${subscription.id}`);
            return;
        }

        // Mark as deleted/inactive in our system
        userSubscription.isDeleted = true;
        userSubscription.deletedAt = new Date();
        userSubscription.isActive = false;
        userSubscription.paymentStatus = 'cancelled';
        await userSubscription.save();
        console.log(`Internal user subscription marked as deleted for Stripe subscription ${subscription.id}`);
    }

    /**
     * Handle payment succeeded
     */
    private static async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
        const customerId = invoice.customer as string;
        const subscriptionId = (invoice as any).subscription;

        if (!customerId || !subscriptionId) {
            console.error('Missing customerId or subscriptionId in invoice.');
            return;
        }

        const userSubscription = await UserSubscription.findOne({ stripeSubscriptionId: subscriptionId });

        if (userSubscription) {
            userSubscription.isActive = true;
            userSubscription.paymentStatus = 'succeeded';
            userSubscription.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            await userSubscription.save();
            console.log(`Subscription ${subscriptionId} for customer ${customerId} renewed successfully.`);
        } else {
            console.warn(`User subscription not found for Stripe subscription ID: ${subscriptionId}`);
        }
    }

    /**
     * Handle payment failed
     */
    private static async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
        const customerId = invoice.customer as string;
        const subscriptionId = (invoice as any).subscription;

        if (!customerId || !subscriptionId) {
            console.error('Missing customerId or subscriptionId in invoice.');
            return;
        }

        const userSubscription = await UserSubscription.findOne({ stripeSubscriptionId: subscriptionId });

        if (userSubscription) {
            userSubscription.isActive = false;
            userSubscription.paymentStatus = 'failed';
            await userSubscription.save();
            console.warn(`Subscription ${subscriptionId} for customer ${customerId} payment failed. Set to inactive.`);
        } else {
            console.warn(`User subscription not found for Stripe subscription ID: ${subscriptionId}`);
        }
    }

    /**
     * Cancel Stripe subscription
     */
    static async cancelSubscription(subscriptionId: string): Promise<void> {
        try {
            const stripe = this.getStripe();

            await stripe.subscriptions.cancel(subscriptionId);

            console.log(`Subscription canceled: ${subscriptionId}`);
        } catch (error) {
            console.error('Error canceling subscription:', error);
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
            console.error('Error getting subscription:', error);
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
            console.error('Error getting customer:', error);
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
            console.error('Error getting price:', error);
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
            console.error('Error getting product:', error);
            throw error;
        }
    }
}
