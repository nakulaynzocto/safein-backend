export const userSubscriptionSchemas = {
    UserSubscription: {
        type: 'object',
        required: ['userId', 'planId', 'status', 'startDate', 'endDate', 'amount', 'currency'],
        properties: {
            _id: {
                type: 'string',
                description: 'Unique identifier for the user subscription',
                example: '507f1f77bcf86cd799439011'
            },
            userId: {
                type: 'string',
                description: 'Reference to the user',
                example: '507f1f77bcf86cd799439012'
            },
            planId: {
                type: 'string',
                description: 'Reference to the subscription plan',
                example: '507f1f77bcf86cd799439013'
            },
            status: {
                type: 'string',
                enum: ['active', 'inactive', 'cancelled', 'expired', 'trial'],
                description: 'Current status of the subscription',
                example: 'active'
            },
            startDate: {
                type: 'string',
                format: 'date-time',
                description: 'Start date of the subscription',
                example: '2023-01-01T00:00:00.000Z'
            },
            endDate: {
                type: 'string',
                format: 'date-time',
                description: 'End date of the subscription',
                example: '2023-02-01T00:00:00.000Z'
            },
            isAutoRenew: {
                type: 'boolean',
                description: 'Whether the subscription auto-renews',
                example: true,
                default: false
            },
            amount: {
                type: 'number',
                description: 'Subscription amount in cents',
                example: 2999,
                minimum: 0
            },
            currency: {
                type: 'string',
                description: 'Currency code',
                example: 'usd',
                minLength: 3,
                maxLength: 3
            },
            stripeCustomerId: {
                type: 'string',
                description: 'Stripe customer ID',
                example: 'cus_1234567890'
            },
            stripeSubscriptionId: {
                type: 'string',
                description: 'Stripe subscription ID',
                example: 'sub_1234567890'
            },
            stripePriceId: {
                type: 'string',
                description: 'Stripe price ID',
                example: 'price_1234567890'
            },
            stripePaymentIntentId: {
                type: 'string',
                description: 'Stripe payment intent ID',
                example: 'pi_1234567890'
            },
            stripeInvoiceId: {
                type: 'string',
                description: 'Stripe invoice ID',
                example: 'in_1234567890'
            },
            metadata: {
                type: 'object',
                description: 'Additional metadata',
                example: { source: 'web', campaign: 'summer2023' }
            },
            isDeleted: {
                type: 'boolean',
                description: 'Soft delete flag',
                example: false
            },
            createdAt: {
                type: 'string',
                format: 'date-time',
                description: 'Creation timestamp'
            },
            updatedAt: {
                type: 'string',
                format: 'date-time',
                description: 'Last update timestamp'
            },
            deletedAt: {
                type: 'string',
                format: 'date-time',
                description: 'Deletion timestamp',
                example: null
            },
            deletedBy: {
                type: 'string',
                description: 'User who deleted the subscription',
                example: null
            },
            createdBy: {
                type: 'string',
                description: 'User who created the subscription',
                example: '507f1f77bcf86cd799439012'
            },
            updatedBy: {
                type: 'string',
                description: 'User who last updated the subscription',
                example: '507f1f77bcf86cd799439012'
            }
        }
    },
    CreateUserSubscription: {
        type: 'object',
        required: ['userId', 'planId', 'status', 'startDate', 'endDate', 'amount', 'currency'],
        properties: {
            userId: {
                type: 'string',
                description: 'Reference to the user',
                example: '507f1f77bcf86cd799439012'
            },
            planId: {
                type: 'string',
                description: 'Reference to the subscription plan',
                example: '507f1f77bcf86cd799439013'
            },
            status: {
                type: 'string',
                enum: ['active', 'inactive', 'cancelled', 'expired', 'trial'],
                description: 'Status of the subscription',
                example: 'active'
            },
            startDate: {
                type: 'string',
                format: 'date-time',
                description: 'Start date of the subscription',
                example: '2023-01-01T00:00:00.000Z'
            },
            endDate: {
                type: 'string',
                format: 'date-time',
                description: 'End date of the subscription',
                example: '2023-02-01T00:00:00.000Z'
            },
            isAutoRenew: {
                type: 'boolean',
                description: 'Whether the subscription auto-renews',
                example: true,
                default: false
            },
            amount: {
                type: 'number',
                description: 'Subscription amount in cents',
                example: 2999,
                minimum: 0
            },
            currency: {
                type: 'string',
                description: 'Currency code',
                example: 'usd',
                default: 'usd'
            },
            stripeCustomerId: {
                type: 'string',
                description: 'Stripe customer ID',
                example: 'cus_1234567890'
            },
            stripeSubscriptionId: {
                type: 'string',
                description: 'Stripe subscription ID',
                example: 'sub_1234567890'
            },
            stripePriceId: {
                type: 'string',
                description: 'Stripe price ID',
                example: 'price_1234567890'
            },
            stripePaymentIntentId: {
                type: 'string',
                description: 'Stripe payment intent ID',
                example: 'pi_1234567890'
            },
            stripeInvoiceId: {
                type: 'string',
                description: 'Stripe invoice ID',
                example: 'in_1234567890'
            },
            metadata: {
                type: 'object',
                description: 'Additional metadata',
                example: { source: 'web', campaign: 'summer2023' }
            }
        }
    },
    UpdateUserSubscription: {
        type: 'object',
        properties: {
            status: {
                type: 'string',
                enum: ['active', 'inactive', 'cancelled', 'expired', 'trial'],
                description: 'Status of the subscription',
                example: 'active'
            },
            endDate: {
                type: 'string',
                format: 'date-time',
                description: 'End date of the subscription',
                example: '2023-02-01T00:00:00.000Z'
            },
            isAutoRenew: {
                type: 'boolean',
                description: 'Whether the subscription auto-renews',
                example: true
            },
            amount: {
                type: 'number',
                description: 'Subscription amount in cents',
                example: 2999,
                minimum: 0
            },
            currency: {
                type: 'string',
                description: 'Currency code',
                example: 'usd'
            },
            stripeCustomerId: {
                type: 'string',
                description: 'Stripe customer ID',
                example: 'cus_1234567890'
            },
            stripeSubscriptionId: {
                type: 'string',
                description: 'Stripe subscription ID',
                example: 'sub_1234567890'
            },
            stripePriceId: {
                type: 'string',
                description: 'Stripe price ID',
                example: 'price_1234567890'
            },
            stripePaymentIntentId: {
                type: 'string',
                description: 'Stripe payment intent ID',
                example: 'pi_1234567890'
            },
            stripeInvoiceId: {
                type: 'string',
                description: 'Stripe invoice ID',
                example: 'in_1234567890'
            },
            metadata: {
                type: 'object',
                description: 'Additional metadata',
                example: { source: 'web', campaign: 'summer2023' }
            }
        }
    },
    UserSubscriptionList: {
        type: 'object',
        properties: {
            subscriptions: {
                type: 'array',
                items: {
                    $ref: '#/components/schemas/UserSubscription'
                }
            },
            pagination: {
                type: 'object',
                properties: {
                    currentPage: {
                        type: 'number',
                        example: 1
                    },
                    totalPages: {
                        type: 'number',
                        example: 5
                    },
                    totalSubscriptions: {
                        type: 'number',
                        example: 50
                    },
                    hasNextPage: {
                        type: 'boolean',
                        example: true
                    },
                    hasPrevPage: {
                        type: 'boolean',
                        example: false
                    }
                }
            }
        }
    },
    UserSubscriptionStats: {
        type: 'object',
        properties: {
            totalSubscriptions: {
                type: 'number',
                description: 'Total number of user subscriptions',
                example: 150
            },
            activeSubscriptions: {
                type: 'number',
                description: 'Number of active subscriptions',
                example: 120
            },
            cancelledSubscriptions: {
                type: 'number',
                description: 'Number of cancelled subscriptions',
                example: 20
            },
            expiredSubscriptions: {
                type: 'number',
                description: 'Number of expired subscriptions',
                example: 10
            },
            trialSubscriptions: {
                type: 'number',
                description: 'Number of trial subscriptions',
                example: 5
            },
            totalRevenue: {
                type: 'number',
                description: 'Total revenue from subscriptions',
                example: 450000
            },
            averageRevenuePerUser: {
                type: 'number',
                description: 'Average revenue per user',
                example: 3000
            },
            subscriptionGrowthRate: {
                type: 'number',
                description: 'Subscription growth rate percentage',
                example: 15.5
            },
            churnRate: {
                type: 'number',
                description: 'Churn rate percentage',
                example: 5.2
            },
            planDistribution: {
                type: 'object',
                properties: {
                    free: {
                        type: 'number',
                        example: 50
                    },
                    starter: {
                        type: 'number',
                        example: 40
                    },
                    professional: {
                        type: 'number',
                        example: 35
                    },
                    enterprise: {
                        type: 'number',
                        example: 25
                    }
                }
            }
        }
    },
    AssignFreePlanRequest: {
        type: 'object',
        required: ['userId'],
        properties: {
            userId: {
                type: 'string',
                description: 'User ID to assign free plan to',
                example: '507f1f77bcf86cd799439012'
            }
        }
    },
    StripeCheckoutRequest: {
        type: 'object',
        required: ['planId', 'userId'],
        properties: {
            planId: {
                type: 'string',
                description: 'Subscription plan ID',
                example: '507f1f77bcf86cd799439013'
            },
            userId: {
                type: 'string',
                description: 'User ID',
                example: '507f1f77bcf86cd799439012'
            },
            successUrl: {
                type: 'string',
                description: 'Success redirect URL',
                example: 'https://yourapp.com/success'
            },
            cancelUrl: {
                type: 'string',
                description: 'Cancel redirect URL',
                example: 'https://yourapp.com/cancel'
            }
        }
    },
    StripeCheckoutResponse: {
        type: 'object',
        properties: {
            sessionId: {
                type: 'string',
                description: 'Stripe checkout session ID',
                example: 'cs_1234567890'
            },
            url: {
                type: 'string',
                description: 'Checkout URL',
                example: 'https://checkout.stripe.com/c/pay/cs_1234567890'
            }
        }
    },
    PremiumStatusResponse: {
        type: 'object',
        properties: {
            isPremium: {
                type: 'boolean',
                description: 'Whether user has premium subscription',
                example: true
            },
            subscription: {
                $ref: '#/components/schemas/UserSubscription'
            }
        }
    }
};
