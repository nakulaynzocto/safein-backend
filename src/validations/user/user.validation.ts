import Joi from 'joi';

export const createUserValidation = Joi.object({
  companyName: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Company name must be at least 2 characters',
      'string.max': 'Company name cannot exceed 100 characters',
      'any.required': 'Company name is required'
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters',
      'any.required': 'Password is required'
    })
});

export const loginValidation = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

export const updateUserValidation = Joi.object({
  companyName: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Company name must be at least 2 characters',
      'string.max': 'Company name cannot exceed 100 characters'
    }),
  profilePicture: Joi.string()
    .uri()
    .optional()
    .messages({
      'string.uri': 'Profile picture must be a valid URL'
    }),
  companyId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Invalid company ID format'
    }),
  roles: Joi.array()
    .items(Joi.string().valid('admin', 'visitor', 'employee', 'superadmin'))
    .optional()
    .messages({
      'any.only': 'Roles must be one of: admin, visitor, employee, superadmin'
    }),
  department: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Department cannot exceed 100 characters'
    }),
  designation: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Designation cannot exceed 100 characters'
    }),
  employeeId: Joi.string()
    .max(50)
    .optional()
    .messages({
      'string.max': 'Employee ID cannot exceed 50 characters'
    })
});

export const verifyOtpValidation = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  otp: Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      'string.length': 'OTP must be exactly 6 digits',
      'string.pattern.base': 'OTP must contain only numbers',
      'any.required': 'OTP is required'
    })
});

export const resendOtpValidation = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    })
});

export const forgotPasswordValidation = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    })
});

export const resetPasswordValidation = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'any.required': 'Reset token is required'
    }),
  newPassword: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'New password must be at least 6 characters',
      'any.required': 'New password is required'
    })
});

export const changePasswordValidation = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required'
    }),
  newPassword: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'New password must be at least 6 characters',
      'any.required': 'New password is required'
    })
});

export const getUserByIdValidation = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid user ID format',
      'any.required': 'User ID is required'
    })
});

export const getUsersValidation = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .optional(),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .optional()
});
