import Joi from 'joi';

export const createSubscriptionPlanValidation = Joi.object({
    name: Joi.string()
        .required()
        .trim()
        .min(2)
        .max(100)
        .messages({
            'string.empty': 'Plan name is required',
            'string.min': 'Plan name must be at least 2 characters',
            'string.max': 'Plan name cannot exceed 100 characters'
        }),
    description: Joi.string()
        .optional()
        .trim()
        .max(500)
        .messages({
            'string.max': 'Description cannot exceed 500 characters'
        }),
    planType: Joi.string()
        .required()
        .valid('free', 'weekly', 'monthly', 'quarterly', 'yearly')
        .messages({
            'string.empty': 'Plan type is required',
            'any.only': 'Plan type must be one of: free, weekly, monthly, quarterly, yearly'
        }),
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
        .lowercase()
        .messages({
            'string.length': 'Currency must be a 3-letter code'
        }),
    features: Joi.array()
        .items(
            Joi.string()
                .trim()
                .max(200)
                .messages({
                    'string.max': 'Feature description cannot exceed 200 characters'
                })
        )
        .required()
        .min(1)
        .messages({
            'array.min': 'At least one feature is required'
        }),
    isActive: Joi.boolean()
        .optional()
        .default(true),
    isPopular: Joi.boolean()
        .optional()
        .default(false),
    trialDays: Joi.number()
        .optional()
        .min(0)
        .max(365)
        .default(0)
        .messages({
            'number.min': 'Trial days cannot be negative',
            'number.max': 'Trial days cannot exceed 365'
        }),
    sortOrder: Joi.number()
        .optional()
        .min(0)
        .default(0)
        .messages({
            'number.min': 'Sort order cannot be negative'
        }),
    metadata: Joi.object({
        stripePriceId: Joi.string()
            .optional()
            .trim(),
        stripeProductId: Joi.string()
            .optional()
            .trim()
    })
    .optional()
});

export const updateSubscriptionPlanValidation = Joi.object({
    name: Joi.string()
        .optional()
        .trim()
        .min(2)
        .max(100)
        .messages({
            'string.min': 'Plan name must be at least 2 characters',
            'string.max': 'Plan name cannot exceed 100 characters'
        }),
    description: Joi.string()
        .optional()
        .trim()
        .max(500)
        .messages({
            'string.max': 'Description cannot exceed 500 characters'
        }),
    planType: Joi.string()
        .optional()
        .valid('free', 'weekly', 'monthly', 'quarterly', 'yearly')
        .messages({
            'any.only': 'Plan type must be one of: free, weekly, monthly, quarterly, yearly'
        }),
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
        .lowercase()
        .messages({
            'string.length': 'Currency must be a 3-letter code'
        }),
    features: Joi.array()
        .items(
            Joi.string()
                .trim()
                .max(200)
                .messages({
                    'string.max': 'Feature description cannot exceed 200 characters'
                })
        )
        .optional()
        .min(1)
        .messages({
            'array.min': 'At least one feature is required'
        }),
    isActive: Joi.boolean()
        .optional(),
    isPopular: Joi.boolean()
        .optional(),
    trialDays: Joi.number()
        .optional()
        .min(0)
        .max(365)
        .messages({
            'number.min': 'Trial days cannot be negative',
            'number.max': 'Trial days cannot exceed 365'
        }),
    sortOrder: Joi.number()
        .optional()
        .min(0)
        .messages({
            'number.min': 'Sort order cannot be negative'
        }),
    metadata: Joi.object({
        stripePriceId: Joi.string()
            .optional()
            .trim(),
        stripeProductId: Joi.string()
            .optional()
            .trim()
    })
    .optional()
}).min(1).messages({
    'object.min': 'At least one field must be provided for update'
});

export const subscriptionPlanParamsValidation = Joi.object({
    id: Joi.string()
        .required()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.empty': 'Subscription plan ID is required',
            'string.pattern.base': 'Invalid subscription plan ID format'
        })
});

export const subscriptionPlanTypeParamsValidation = Joi.object({
    planType: Joi.string()
        .required()
        .valid('free', 'weekly', 'monthly', 'quarterly', 'yearly')
        .messages({
            'string.empty': 'Plan type is required',
            'any.only': 'Plan type must be one of: free, weekly, monthly, quarterly, yearly'
        })
});

export const getSubscriptionPlansValidation = Joi.object({
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
    planType: Joi.string()
        .optional()
        .valid('free', 'weekly', 'monthly', 'quarterly', 'yearly')
        .messages({
            'any.only': 'Plan type must be one of: free, weekly, monthly, quarterly, yearly'
        }),
    isActive: Joi.boolean()
        .optional(),
    isPopular: Joi.boolean()
        .optional(),
    sortBy: Joi.string()
        .optional()
        .valid('name', 'amount', 'sortOrder', 'createdAt', 'updatedAt')
        .default('sortOrder')
        .messages({
            'any.only': 'Sort by must be one of: name, amount, sortOrder, createdAt, updatedAt'
        }),
    sortOrder: Joi.string()
        .optional()
        .valid('asc', 'desc')
        .default('asc')
        .messages({
            'any.only': 'Sort order must be either asc or desc'
        })
});
