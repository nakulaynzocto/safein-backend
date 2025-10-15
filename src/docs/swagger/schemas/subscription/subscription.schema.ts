export const subscriptionSchemas = {
  SubscriptionPlan: {
    type: 'object',
    required: ['name', 'planType', 'amount', 'features'],
    properties: {
      _id: {
        type: 'string',
        description: 'Unique identifier for the subscription plan',
        example: '507f1f77bcf86cd799439011'
      },
      name: {
        type: 'string',
        description: 'Name of the subscription plan',
        example: 'Professional Plan',
        maxLength: 100
      },
      description: {
        type: 'string',
        description: 'Description of the subscription plan',
        example: 'Best for established businesses with high visitor traffic',
        maxLength: 500
      },
      planType: {
        type: 'string',
        enum: ['free', 'weekly', 'monthly', 'quarterly', 'yearly'],
        description: 'Type of subscription plan',
        example: 'monthly'
      },
      amount: {
        type: 'number',
        description: 'Price in cents',
        example: 5900,
        minimum: 0
      },
      currency: {
        type: 'string',
        description: 'Currency code',
        example: 'usd',
        minLength: 3,
        maxLength: 3
      },
      features: {
        type: 'array',
        items: {
          type: 'string',
          maxLength: 200
        },
        description: 'List of features included in the plan',
        example: ['Up to 500 visitors per month', 'Advanced reporting & analytics']
      },
      isActive: {
        type: 'boolean',
        description: 'Whether the plan is active',
        example: true
      },
      isPopular: {
        type: 'boolean',
        description: 'Whether the plan is marked as popular',
        example: true
      },
      trialDays: {
        type: 'number',
        description: 'Number of trial days',
        example: 14,
        minimum: 0,
        maximum: 365
      },
      sortOrder: {
        type: 'number',
        description: 'Order for sorting plans',
        example: 3,
        minimum: 0
      },
      metadata: {
        type: 'object',
        properties: {
          stripePriceId: {
            type: 'string',
            description: 'Stripe price ID',
            example: 'price_professional_monthly'
          },
          stripeProductId: {
            type: 'string',
            description: 'Stripe product ID',
            example: 'prod_professional'
          }
        }
      },
      formattedPrice: {
        type: 'string',
        description: 'Formatted price string',
        example: '$59.00'
      },
      monthlyEquivalent: {
        type: 'number',
        description: 'Monthly equivalent price for yearly/quarterly plans',
        example: 5900
      },
      savingsPercentage: {
        type: 'number',
        description: 'Savings percentage for yearly/quarterly plans',
        example: 20
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
      }
    }
  },
  CreateSubscriptionPlan: {
    type: 'object',
    required: ['name', 'planType', 'amount', 'features'],
    properties: {
      name: {
        type: 'string',
        description: 'Name of the subscription plan',
        example: 'Professional Plan',
        maxLength: 100
      },
      description: {
        type: 'string',
        description: 'Description of the subscription plan',
        example: 'Best for established businesses with high visitor traffic',
        maxLength: 500
      },
      planType: {
        type: 'string',
        enum: ['free', 'weekly', 'monthly', 'quarterly', 'yearly'],
        description: 'Type of subscription plan',
        example: 'monthly'
      },
      amount: {
        type: 'number',
        description: 'Price in cents',
        example: 5900,
        minimum: 0
      },
      currency: {
        type: 'string',
        description: 'Currency code',
        example: 'usd',
        default: 'usd'
      },
      features: {
        type: 'array',
        items: {
          type: 'string',
          maxLength: 200
        },
        description: 'List of features included in the plan',
        example: ['Up to 500 visitors per month', 'Advanced reporting & analytics'],
        minItems: 1
      },
      isActive: {
        type: 'boolean',
        description: 'Whether the plan is active',
        example: true,
        default: true
      },
      isPopular: {
        type: 'boolean',
        description: 'Whether the plan is marked as popular',
        example: true,
        default: false
      },
      trialDays: {
        type: 'number',
        description: 'Number of trial days',
        example: 14,
        minimum: 0,
        maximum: 365,
        default: 0
      },
      sortOrder: {
        type: 'number',
        description: 'Order for sorting plans',
        example: 3,
        minimum: 0,
        default: 0
      },
      metadata: {
        type: 'object',
        properties: {
          stripePriceId: {
            type: 'string',
            description: 'Stripe price ID',
            example: 'price_professional_monthly'
          },
          stripeProductId: {
            type: 'string',
            description: 'Stripe product ID',
            example: 'prod_professional'
          }
        }
      }
    }
  },
  UpdateSubscriptionPlan: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name of the subscription plan',
        example: 'Professional Plan',
        maxLength: 100
      },
      description: {
        type: 'string',
        description: 'Description of the subscription plan',
        example: 'Best for established businesses with high visitor traffic',
        maxLength: 500
      },
      planType: {
        type: 'string',
        enum: ['free', 'weekly', 'monthly', 'quarterly', 'yearly'],
        description: 'Type of subscription plan',
        example: 'monthly'
      },
      amount: {
        type: 'number',
        description: 'Price in cents',
        example: 5900,
        minimum: 0
      },
      currency: {
        type: 'string',
        description: 'Currency code',
        example: 'usd'
      },
      features: {
        type: 'array',
        items: {
          type: 'string',
          maxLength: 200
        },
        description: 'List of features included in the plan',
        example: ['Up to 500 visitors per month', 'Advanced reporting & analytics']
      },
      isActive: {
        type: 'boolean',
        description: 'Whether the plan is active',
        example: true
      },
      isPopular: {
        type: 'boolean',
        description: 'Whether the plan is marked as popular',
        example: true
      },
      trialDays: {
        type: 'number',
        description: 'Number of trial days',
        example: 14,
        minimum: 0,
        maximum: 365
      },
      sortOrder: {
        type: 'number',
        description: 'Order for sorting plans',
        example: 3,
        minimum: 0
      },
      metadata: {
        type: 'object',
        properties: {
          stripePriceId: {
            type: 'string',
            description: 'Stripe price ID',
            example: 'price_professional_monthly'
          },
          stripeProductId: {
            type: 'string',
            description: 'Stripe product ID',
            example: 'prod_professional'
          }
        }
      }
    }
  },
  SubscriptionPlanList: {
    type: 'object',
    properties: {
      plans: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/SubscriptionPlan'
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
          totalPlans: {
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
  SubscriptionPlanStats: {
    type: 'object',
    properties: {
      totalPlans: {
        type: 'number',
        description: 'Total number of subscription plans',
        example: 8
      },
      activePlans: {
        type: 'number',
        description: 'Number of active subscription plans',
        example: 6
      },
      popularPlans: {
        type: 'number',
        description: 'Number of popular subscription plans',
        example: 1
      },
      plansByType: {
        type: 'object',
        properties: {
          free: {
            type: 'number',
            example: 1
          },
          weekly: {
            type: 'number',
            example: 0
          },
          monthly: {
            type: 'number',
            example: 3
          },
          quarterly: {
            type: 'number',
            example: 2
          },
          yearly: {
            type: 'number',
            example: 2
          }
        }
      },
      averagePrice: {
        type: 'number',
        description: 'Average price of paid plans',
        example: 5500
      },
      totalRevenue: {
        type: 'number',
        description: 'Total revenue from subscriptions',
        example: 0
      }
    }
  }
};
