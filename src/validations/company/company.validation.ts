import Joi from 'joi';

export const createCompanyValidation = Joi.object({
    companyName: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages({
            'string.min': 'Company name must be at least 2 characters',
            'string.max': 'Company name cannot exceed 100 characters',
            'any.required': 'Company name is required'
        }),

    companyCode: Joi.string()
        .min(3)
        .max(10)
        .pattern(/^[A-Z0-9]+$/)
        .optional()
        .messages({
            'string.min': 'Company code must be at least 3 characters',
            'string.max': 'Company code cannot exceed 10 characters',
            'string.pattern.base': 'Company code can only contain uppercase letters and numbers'
        }),

    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Company email is required'
        }),

    phone: Joi.string()
        .pattern(/^[\+]?[1-9][\d]{0,15}$/)
        .required()
        .messages({
            'string.pattern.base': 'Please provide a valid phone number',
            'any.required': 'Company phone is required'
        }),

    address: Joi.object({
        street: Joi.string().required().messages({
            'any.required': 'Street address is required'
        }),
        city: Joi.string().required().messages({
            'any.required': 'City is required'
        }),
        state: Joi.string().required().messages({
            'any.required': 'State is required'
        }),
        country: Joi.string().default('India'),
        zipCode: Joi.string().required().messages({
            'any.required': 'ZIP code is required'
        })
    }).required(),

    contactPerson: Joi.object({
        name: Joi.string().required().messages({
            'any.required': 'Contact person name is required'
        }),
        email: Joi.string().email().required().messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Contact person email is required'
        }),
        phone: Joi.string()
            .pattern(/^[\+]?[1-9][\d]{0,15}$/)
            .required()
            .messages({
                'string.pattern.base': 'Please provide a valid phone number',
                'any.required': 'Contact person phone is required'
            }),
        designation: Joi.string().required().messages({
            'any.required': 'Contact person designation is required'
        })
    }).required(),

    subscription: Joi.object({
        plan: Joi.string()
            .valid('basic', 'premium', 'enterprise')
            .default('basic')
            .messages({
                'any.only': 'Plan must be basic, premium, or enterprise'
            }),
        maxEmployees: Joi.number()
            .min(1)
            .required()
            .messages({
                'number.min': 'Maximum employees must be at least 1',
                'any.required': 'Maximum employees limit is required'
            }),
        maxVisitorsPerMonth: Joi.number()
            .min(1)
            .required()
            .messages({
                'number.min': 'Maximum visitors per month must be at least 1',
                'any.required': 'Maximum visitors per month limit is required'
            }),
        endDate: Joi.date()
            .greater('now')
            .required()
            .messages({
                'date.greater': 'Subscription end date must be in the future',
                'any.required': 'Subscription end date is required'
            })
    }).required()
});

export const updateCompanyValidation = Joi.object({
    id: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
            'string.pattern.base': 'Invalid company ID format',
            'any.required': 'Company ID is required'
        }),
    companyName: Joi.string()
        .min(2)
        .max(100)
        .optional()
        .messages({
            'string.min': 'Company name must be at least 2 characters',
            'string.max': 'Company name cannot exceed 100 characters'
        }),

    email: Joi.string()
        .email()
        .optional()
        .messages({
            'string.email': 'Please provide a valid email address'
        }),

    phone: Joi.string()
        .pattern(/^[\+]?[1-9][\d]{0,15}$/)
        .optional()
        .messages({
            'string.pattern.base': 'Please provide a valid phone number'
        }),

    address: Joi.object({
        street: Joi.string().optional(),
        city: Joi.string().optional(),
        state: Joi.string().optional(),
        country: Joi.string().optional(),
        zipCode: Joi.string().optional()
    }).optional(),

    contactPerson: Joi.object({
        name: Joi.string().optional(),
        email: Joi.string().email().optional().messages({
            'string.email': 'Please provide a valid email address'
        }),
        phone: Joi.string()
            .pattern(/^[\+]?[1-9][\d]{0,15}$/)
            .optional()
            .messages({
                'string.pattern.base': 'Please provide a valid phone number'
            }),
        designation: Joi.string().optional()
    }).optional(),

    subscription: Joi.object({
        plan: Joi.string()
            .valid('basic', 'premium', 'enterprise')
            .optional()
            .messages({
                'any.only': 'Plan must be basic, premium, or enterprise'
            }),
        status: Joi.string()
            .valid('active', 'inactive', 'suspended', 'trial')
            .optional()
            .messages({
                'any.only': 'Status must be active, inactive, suspended, or trial'
            }),
        maxEmployees: Joi.number()
            .min(1)
            .optional()
            .messages({
                'number.min': 'Maximum employees must be at least 1'
            }),
        maxVisitorsPerMonth: Joi.number()
            .min(1)
            .optional()
            .messages({
                'number.min': 'Maximum visitors per month must be at least 1'
            }),
        endDate: Joi.date()
            .greater('now')
            .optional()
            .messages({
                'date.greater': 'Subscription end date must be in the future'
            })
    }).optional(),

    isActive: Joi.boolean().optional()
});

export const companyParamsValidation = Joi.object({
    id: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
            'string.pattern.base': 'Invalid company ID format',
            'any.required': 'Company ID is required'
        })
});