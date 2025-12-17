import Joi from 'joi';

const addressValidation = Joi.object({
    street: Joi.string()
        .optional()
        .allow('')
        .trim()
        .min(2)
        .max(200)
        .messages({
            'string.min': 'Street address must be at least 2 characters long',
            'string.max': 'Street address cannot exceed 200 characters'
        }),
    city: Joi.string()
        .required()
        .trim()
        .min(2)
        .max(100)
        .messages({
            'string.empty': 'City is required',
            'string.min': 'City must be at least 2 characters long',
            'string.max': 'City cannot exceed 100 characters'
        }),
    state: Joi.string()
        .required()
        .trim()
        .min(2)
        .max(100)
        .messages({
            'string.empty': 'State is required',
            'string.min': 'State must be at least 2 characters long',
            'string.max': 'State cannot exceed 100 characters'
        }),
    country: Joi.string()
        .required()
        .trim()
        .min(2)
        .max(100)
        .messages({
            'string.empty': 'Country is required',
            'string.min': 'Country must be at least 2 characters long',
            'string.max': 'Country cannot exceed 100 characters'
        })
});

const idProofValidation = Joi.object({
    type: Joi.string()
        .optional()
        .allow('')
        .trim()
        .min(2)
        .max(50)
        .messages({
            'string.min': 'ID proof type must be at least 2 characters long',
            'string.max': 'ID proof type cannot exceed 50 characters'
        }),
    number: Joi.string()
        .optional()
        .allow('')
        .trim()
        .min(2)
        .max(50)
        .messages({
            'string.min': 'ID proof number must be at least 2 characters long',
            'string.max': 'ID proof number cannot exceed 50 characters'
        }),
    image: Joi.string()
        .optional()
        .trim()
        .max(500)
        .allow('')
        .messages({
            'string.max': 'ID proof image URL cannot exceed 500 characters'
        })
});

export const createVisitorValidation = Joi.object({
    name: Joi.string()
        .required()
        .trim()
        .min(2)
        .max(100)
        .messages({
            'string.empty': 'Visitor name is required',
            'string.min': 'Name must be at least 2 characters long',
            'string.max': 'Name cannot exceed 100 characters'
        }),
    email: Joi.string()
        .required()
        .email()
        .lowercase()
        .trim()
        .messages({
            'string.empty': 'Email is required',
            'string.email': 'Please enter a valid email address'
        }),
    phone: Joi.string()
        .required()
        .trim()
        .pattern(/^[\+]?[1-9][\d]{0,15}$/)
        .messages({
            'string.empty': 'Phone number is required',
            'string.pattern.base': 'Please enter a valid phone number'
        }),
    address: addressValidation.required().messages({
        'any.required': 'Address is required'
    }),
    idProof: idProofValidation.optional(),
    photo: Joi.string()
        .optional()
        .trim()
        .max(500)
        .allow('')
        .messages({
            'string.max': 'Photo URL cannot exceed 500 characters'
        })
});

export const updateVisitorValidation = Joi.object({
    name: Joi.string()
        .optional()
        .trim()
        .min(2)
        .max(100)
        .messages({
            'string.min': 'Name must be at least 2 characters long',
            'string.max': 'Name cannot exceed 100 characters'
        }),
    email: Joi.string()
        .optional()
        .email()
        .lowercase()
        .trim()
        .messages({
            'string.email': 'Please enter a valid email address'
        }),
    phone: Joi.string()
        .optional()
        .trim()
        .pattern(/^[\+]?[1-9][\d]{0,15}$/)
        .messages({
            'string.pattern.base': 'Please enter a valid phone number'
        }),
    address: addressValidation.optional(),
    idProof: idProofValidation.optional(),
    photo: Joi.string()
        .optional()
        .trim()
        .max(500)
        .allow('')
        .messages({
            'string.max': 'Photo URL cannot exceed 500 characters'
        })
});

export const visitorParamsValidation = Joi.object({
    id: Joi.string()
        .required()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.empty': 'Visitor ID is required',
            'string.pattern.base': 'Invalid visitor ID format'
        })
});

export const getVisitorsValidation = Joi.object({
    page: Joi.number()
        .optional()
        .min(1)
        .default(1)
        .messages({
            'number.min': 'Page number must be at least 1'
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
    search: Joi.string()
        .optional()
        .trim()
        .max(100)
        .messages({
            'string.max': 'Search term cannot exceed 100 characters'
        }),
    company: Joi.string()
        .optional()
        .trim()
        .max(100)
        .messages({
            'string.max': 'Company filter cannot exceed 100 characters'
        }),
    designation: Joi.string()
        .optional()
        .trim()
        .max(100)
        .messages({
            'string.max': 'Designation filter cannot exceed 100 characters'
        }),
    city: Joi.string()
        .optional()
        .trim()
        .max(100)
        .messages({
            'string.max': 'City filter cannot exceed 100 characters'
        }),
    state: Joi.string()
        .optional()
        .trim()
        .max(100)
        .messages({
            'string.max': 'State filter cannot exceed 100 characters'
        }),
    country: Joi.string()
        .optional()
        .trim()
        .max(100)
        .messages({
            'string.max': 'Country filter cannot exceed 100 characters'
        }),
    idProofType: Joi.string()
        .optional()
        .trim()
        .max(50)
        .messages({
            'string.max': 'ID proof type filter cannot exceed 50 characters'
        }),
    sortBy: Joi.string()
        .optional()
        .valid('name', 'email', 'company', 'designation', 'createdAt', 'updatedAt')
        .default('createdAt')
        .messages({
            'any.only': 'Invalid sort field'
        }),
    sortOrder: Joi.string()
        .optional()
        .valid('asc', 'desc')
        .default('desc')
        .messages({
            'any.only': 'Sort order must be either asc or desc'
        })
});

export const bulkUpdateVisitorsValidation = Joi.object({
    visitorIds: Joi.array()
        .required()
        .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
        .min(1)
        .max(50)
        .messages({
            'array.min': 'At least one visitor ID is required',
            'array.max': 'Cannot update more than 50 visitors at once',
            'string.pattern.base': 'Invalid visitor ID format'
        }),
    company: Joi.string()
        .optional()
        .trim()
        .min(2)
        .max(100)
        .messages({
            'string.min': 'Company must be at least 2 characters long',
            'string.max': 'Company cannot exceed 100 characters'
        }),
    designation: Joi.string()
        .optional()
        .trim()
        .min(2)
        .max(100)
        .messages({
            'string.min': 'Designation must be at least 2 characters long',
            'string.max': 'Designation cannot exceed 100 characters'
        })
});

export const visitorSearchValidation = Joi.object({
    phone: Joi.string()
        .optional()
        .pattern(/^[\+]?[1-9][\d]{0,15}$/)
        .messages({
            'string.pattern.base': 'Please provide a valid phone number'
        }),
    email: Joi.string()
        .optional()
        .email()
        .messages({
            'string.email': 'Please provide a valid email address'
        })
}).custom((value, helpers) => {
    if (!value.phone && !value.email) {
        return helpers.error('custom.atLeastOne');
    }
    return value;
}).messages({
    'custom.atLeastOne': 'Either phone or email must be provided for search'
});
