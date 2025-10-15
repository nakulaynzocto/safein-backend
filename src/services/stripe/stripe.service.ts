import Stripe from 'stripe';
import { CONSTANTS, ERROR_CODES } from '../../utils/constants';
import { AppError } from '../../middlewares/errorHandler';
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

export class StripeService {
    private static stripe: Stripe;

    /**
     * Initialize Stripe with API key
     */
    static initialize(): void {
        if (!CONSTANTS.STRIPE_SECRET_KEY) {
            throw new Error('STRIPE_SECRET_KEY is required');
        }

        this.stripe = new Stripe(CONSTANTS.STRIPE_SECRET_KEY, {
            typescript: true
        });

        console.log('Stripe service initialized successfully');
    }

    /**
     * Get Stripe instance
     */
    static getStripe(): Stripe {
        if (!this.stripe) {
            this.initialize();
        }
        return this.stripe;
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
                const existingCustomers = await this.stripe.customers.list({
                    email: customerEmail,
                    limit: 1,
                });

                if (existingCustomers.data.length > 0) {
                    customerId = existingCustomers.data[0].id;
                } else {
                    const customer = await this.stripe.customers.create({
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
                    const existingProducts = await this.stripe.products.list({
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
                const prices = await this.stripe.prices.list({
                    product: productId,
                    active: true,
                    limit: 1,
                });

                if (prices.data.length > 0) {
                    priceId = prices.data[0].id;
                } else {
                    // Create a new price
                    const price = await this.stripe.prices.create({
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
            const session = await this.stripe.checkout.sessions.create({
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
                    await this.handleSubscriptionCreated(event.data.object);
                    break;

                case 'customer.subscription.updated':
                    await this.handleSubscriptionUpdated(event.data.object);
                    break;

                case 'customer.subscription.deleted':
                    await this.handleSubscriptionDeleted(event.data.object);
                    break;

                case 'invoice.payment_succeeded':
                    await this.handlePaymentSucceeded(event.data.object);
                    break;

                case 'invoice.payment_failed':
                    await this.handlePaymentFailed(event.data.object);
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
    private static async handleSubscriptionCreated(subscription: any): Promise<void> {
        try {
            console.log(`Subscription created: ${subscription.id}`);

            // Update user subscription status to active
            // This will be implemented in the SubscriptionService
        } catch (error) {
            console.error('Error handling subscription created:', error);
            throw error;
        }
    }

    /**
     * Handle subscription updated
     */
    private static async handleSubscriptionUpdated(subscription: any): Promise<void> {
        try {
            console.log(`Subscription updated: ${subscription.id}`);

            // Update user subscription based on new status
            // This will be implemented in the SubscriptionService
        } catch (error) {
            console.error('Error handling subscription updated:', error);
            throw error;
        }
    }

    /**
     * Handle subscription deleted
     */
    private static async handleSubscriptionDeleted(subscription: any): Promise<void> {
        try {
            console.log(`Subscription deleted: ${subscription.id}`);

            // Cancel user subscription
            // This will be implemented in the SubscriptionService
        } catch (error) {
            console.error('Error handling subscription deleted:', error);
            throw error;
        }
    }

    /**
     * Handle payment succeeded
     */
    private static async handlePaymentSucceeded(invoice: any): Promise<void> {
        try {
            console.log(`Payment succeeded for invoice: ${invoice.id}`);

            // Update subscription status and extend end date
            // This will be implemented in the SubscriptionService
        } catch (error) {
            console.error('Error handling payment succeeded:', error);
            throw error;
        }
    }

    /**
     * Handle payment failed
     */
    private static async handlePaymentFailed(invoice: any): Promise<void> {
        try {
            console.log(`Payment failed for invoice: ${invoice.id}`);

            // Update subscription status to past_due
            // Send notification to user
            // This will be implemented in the SubscriptionService
        } catch (error) {
            console.error('Error handling payment failed:', error);
            throw error;
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
