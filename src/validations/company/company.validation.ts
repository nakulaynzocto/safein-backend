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
        country: Joi.string().default('IN'), // India country code
        zipCode: Joi.string().required().messages({
            'any.required': 'ZIP code is required'
        })
    }).required(),


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


    address: Joi.object({
        street: Joi.string().optional(),
        city: Joi.string().optional(),
        state: Joi.string().optional(),
        country: Joi.string().optional(),
        zipCode: Joi.string().optional()
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