import Joi from 'joi';

export const createUserSubscriptionValidation = Joi.object({
    userId: Joi.string()
        .optional()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.pattern.base': 'Invalid user ID format'
        }),
    planId: Joi.string()
        .required()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.empty': 'Plan ID is required',
            'string.pattern.base': 'Invalid plan ID format'
        }),
    status: Joi.string()
        .optional()
        .valid('active', 'canceled', 'expired', 'pending', 'past_due', 'trialing')
        .messages({
            'any.only': 'Status must be one of: active, canceled, expired, pending, past_due, trialing'
        }),
    startDate: Joi.date()
        .optional()
        .messages({
            'date.base': 'Start date must be a valid date'
        }),
    endDate: Joi.date()
        .optional()
        .messages({
            'date.base': 'End date must be a valid date'
        }),
    trialEndDate: Joi.date()
        .optional()
        .messages({
            'date.base': 'Trial end date must be a valid date'
        }),
    isAutoRenew: Joi.boolean()
        .optional()
        .default(true),
    amount: Joi.number()
        .required()
        .min(0)
        .messages({
            'number.base': 'Amount must be a number',
            'number.min': 'Amount cannot be negative'
        }),
    currency: Joi.string()
        .optional()
        .default('usd')
        .length(3)
        .uppercase()
        .messages({
            'string.length': 'Currency must be a 3-letter code'
        }),
    billingCycle: Joi.string()
        .required()
        .valid('monthly', 'quarterly', 'yearly')
        .messages({
            'string.empty': 'Billing cycle is required',
            'any.only': 'Billing cycle must be one of: monthly, quarterly, yearly'
        }),
    stripeSubscriptionId: Joi.string()
        .optional()
        .trim(),
    stripeCustomerId: Joi.string()
        .optional()
        .trim(),
    stripePriceId: Joi.string()
        .optional()
        .trim(),
    stripePaymentMethodId: Joi.string()
        .optional()
        .trim(),
    stripeInvoiceId: Joi.string()
        .optional()
        .trim(),
    metadata: Joi.object()
        .optional()
        .pattern(Joi.string(), Joi.any())
});

export const updateUserSubscriptionValidation = Joi.object({
    status: Joi.string()
        .optional()
        .valid('active', 'canceled', 'expired', 'pending', 'past_due', 'trialing')
        .messages({
            'any.only': 'Status must be one of: active, canceled, expired, pending, past_due, trialing'
        }),
    endDate: Joi.date()
        .optional()
        .messages({
            'date.base': 'End date must be a valid date'
        }),
    trialEndDate: Joi.date()
        .optional()
        .messages({
            'date.base': 'Trial end date must be a valid date'
        }),
    isAutoRenew: Joi.boolean()
        .optional(),
    amount: Joi.number()
        .optional()
        .min(0)
        .messages({
            'number.base': 'Amount must be a number',
            'number.min': 'Amount cannot be negative'
        }),
    currency: Joi.string()
        .optional()
        .length(3)
        .uppercase()
        .messages({
            'string.length': 'Currency must be a 3-letter code'
        }),
    billingCycle: Joi.string()
        .optional()
        .valid('monthly', 'quarterly', 'yearly')
        .messages({
            'any.only': 'Billing cycle must be one of: monthly, quarterly, yearly'
        }),
    stripeSubscriptionId: Joi.string()
        .optional()
        .trim(),
    stripeCustomerId: Joi.string()
        .optional()
        .trim(),
    stripePriceId: Joi.string()
        .optional()
        .trim(),
    stripePaymentMethodId: Joi.string()
        .optional()
        .trim(),
    stripeInvoiceId: Joi.string()
        .optional()
        .trim(),
    metadata: Joi.object()
        .optional()
        .pattern(Joi.string(), Joi.any())
}).min(1).messages({
    'object.min': 'At least one field must be provided for update'
});

export const userSubscriptionParamsValidation = Joi.object({
    id: Joi.string()
        .required()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.empty': 'User subscription ID is required',
            'string.pattern.base': 'Invalid user subscription ID format'
        })
});

export const getUserSubscriptionsValidation = Joi.object({
    page: Joi.number()
        .optional()
        .min(1)
        .default(1)
        .messages({
            'number.min': 'Page must be at least 1'
        }),
    limit: Joi.number()
        .optional()
        .min(1)
        .max(100)
        .default(10)
        .messages({
            'number.min': 'Limit must be at least 1',
            'number.max': 'Limit cannot exceed 100'
        }),
    status: Joi.string()
        .optional()
        .valid('active', 'canceled', 'expired', 'pending', 'past_due', 'trialing')
        .messages({
            'any.only': 'Status must be one of: active, canceled, expired, pending, past_due, trialing'
        }),
    userId: Joi.string()
        .optional()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.pattern.base': 'Invalid user ID format'
        }),
    planId: Joi.string()
        .optional()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.pattern.base': 'Invalid plan ID format'
        }),
    sortBy: Joi.string()
        .optional()
        .valid('createdAt', 'updatedAt', 'startDate', 'endDate', 'amount', 'status')
        .default('createdAt')
        .messages({
            'any.only': 'Sort by must be one of: createdAt, updatedAt, startDate, endDate, amount, status'
        }),
    sortOrder: Joi.string()
        .optional()
        .valid('asc', 'desc')
        .default('desc')
        .messages({
            'any.only': 'Sort order must be either asc or desc'
        })
});

export const stripeCheckoutSessionValidation = Joi.object({
    planId: Joi.string()
        .required()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.empty': 'Plan ID is required',
            'string.pattern.base': 'Invalid plan ID format'
        }),
    successUrl: Joi.string()
        .optional()
        .uri()
        .messages({
            'string.uri': 'Success URL must be a valid URI'
        }),
    cancelUrl: Joi.string()
        .optional()
        .uri()
        .messages({
            'string.uri': 'Cancel URL must be a valid URI'
        })
});

export const assignFreePlanValidation = Joi.object({
    userId: Joi.string()
        .optional()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.pattern.base': 'Invalid user ID format'
        })
});

export const getUserActiveSubscriptionValidation = Joi.object({
    userId: Joi.string()
        .optional()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.pattern.base': 'Invalid user ID format'
        })
});

export const checkPremiumSubscriptionValidation = Joi.object({
    userId: Joi.string()
        .optional()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.pattern.base': 'Invalid user ID format'
        })
});

