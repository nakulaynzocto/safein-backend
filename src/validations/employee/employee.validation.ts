import Joi from 'joi';

// Validation for creating employee
export const createEmployeeValidation = Joi.object({
    name: Joi.string()
        .required()
        .trim()
        .min(2)
        .max(100)
        .messages({
            'string.empty': 'Employee name is required',
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
    department: Joi.string()
        .required()
        .trim()
        .min(2)
        .max(50)
        .messages({
            'string.empty': 'Department is required',
            'string.min': 'Department must be at least 2 characters long',
            'string.max': 'Department cannot exceed 50 characters'
        }),
    status: Joi.string()
        .optional()
        .valid('Active', 'Inactive')
        .default('Active')
        .messages({
            'any.only': 'Status must be either Active or Inactive'
        })
});

// Validation for updating employee
export const updateEmployeeValidation = Joi.object({
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
    department: Joi.string()
        .optional()
        .trim()
        .min(2)
        .max(50)
        .messages({
            'string.min': 'Department must be at least 2 characters long',
            'string.max': 'Department cannot exceed 50 characters'
        }),
    status: Joi.string()
        .optional()
        .valid('Active', 'Inactive')
        .messages({
            'any.only': 'Status must be either Active or Inactive'
        })
});

// Validation for employee ID parameter
export const employeeParamsValidation = Joi.object({
    id: Joi.string()
        .required()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.empty': 'Employee ID is required',
            'string.pattern.base': 'Invalid employee ID format'
        })
});

// Validation for query parameters
export const getEmployeesValidation = Joi.object({
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
    department: Joi.string()
        .optional()
        .trim()
        .max(50)
        .messages({
            'string.max': 'Department filter cannot exceed 50 characters'
        }),
    status: Joi.string()
        .optional()
        .valid('Active', 'Inactive')
        .messages({
            'any.only': 'Status filter must be either Active or Inactive'
        }),
    sortBy: Joi.string()
        .optional()
        .valid('name', 'email', 'department', 'status', 'createdAt', 'updatedAt')
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

// Validation for status update
export const updateEmployeeStatusValidation = Joi.object({
    status: Joi.string()
        .required()
        .valid('Active', 'Inactive')
        .messages({
            'string.empty': 'Status is required',
            'any.only': 'Status must be either Active or Inactive'
        })
});

// Validation for bulk operations
export const bulkUpdateEmployeesValidation = Joi.object({
    employeeIds: Joi.array()
        .required()
        .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
        .min(1)
        .max(50)
        .messages({
            'array.min': 'At least one employee ID is required',
            'array.max': 'Cannot update more than 50 employees at once',
            'string.pattern.base': 'Invalid employee ID format'
        }),
    status: Joi.string()
        .optional()
        .valid('Active', 'Inactive')
        .messages({
            'any.only': 'Status must be either Active or Inactive'
        }),
    department: Joi.string()
        .optional()
        .trim()
        .min(2)
        .max(50)
        .messages({
            'string.min': 'Department must be at least 2 characters long',
            'string.max': 'Department cannot exceed 50 characters'
        })
});
