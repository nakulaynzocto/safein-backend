import Joi from 'joi';

const idProofValidation = Joi.object({
    type: Joi.string()
        .valid('aadhaar', 'pan', 'driving_license', 'passport', 'other')
        .required()
        .messages({
            'any.only': 'ID proof type must be one of: aadhaar, pan, driving_license, passport, other',
            'any.required': 'ID proof type is required'
        }),
    number: Joi.string()
        .required()
        .trim()
        .messages({
            'any.required': 'ID proof number is required'
        }),
    image: Joi.string()
        .uri()
        .optional()
        .messages({
            'string.uri': 'ID proof image must be a valid URL'
        })
});

const accompaniedByValidation = Joi.object({
    name: Joi.string()
        .required()
        .trim()
        .max(100)
        .messages({
            'string.max': 'Accompanied by name cannot exceed 100 characters',
            'any.required': 'Accompanied by name is required'
        }),
    phone: Joi.string()
        .required()
        .pattern(/^[\+]?[1-9][\d]{0,15}$/)
        .messages({
            'string.pattern.base': 'Please provide a valid phone number',
            'any.required': 'Accompanied by phone is required'
        }),
    relation: Joi.string()
        .required()
        .trim()
        .max(50)
        .messages({
            'string.max': 'Relation cannot exceed 50 characters',
            'any.required': 'Relation is required'
        }),
    idProof: idProofValidation.optional()
});

const appointmentDetailsValidation = Joi.object({
    purpose: Joi.string()
        .required()
        .trim()
        .max(200)
        .messages({
            'string.max': 'Purpose cannot exceed 200 characters',
            'any.required': 'Appointment purpose is required'
        }),
    scheduledDate: Joi.alternatives()
        .try(
            Joi.date().custom((value, helpers) => {
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const selectedDate = new Date(value.getFullYear(), value.getMonth(), value.getDate());
                
                if (selectedDate < today) {
                    return helpers.error('date.min');
                }
                return value;
            }).messages({
                'date.min': 'Scheduled date cannot be in the past',
                'any.required': 'Scheduled date is required'
            }),
            Joi.string().custom((value, helpers) => {
                const date = new Date(value);
                if (isNaN(date.getTime())) {
                    return helpers.error('date.invalid');
                }
                
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                
                if (selectedDate < today) {
                    return helpers.error('date.min');
                }
                return date;
            }).messages({
                'date.min': 'Scheduled date cannot be in the past',
                'date.invalid': 'Invalid date format',
                'any.required': 'Scheduled date is required'
            })
        )
        .required()
        .messages({
            'any.required': 'Scheduled date is required'
        }),
    scheduledTime: Joi.string()
        .required()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .custom((value, helpers) => {
            const scheduledDate = helpers.state.ancestors[0]?.scheduledDate;
            if (scheduledDate) {
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const selectedDate = new Date(scheduledDate);
                const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
                
                // If the selected date is today, check if time is in the future
                if (selectedDateOnly.getTime() === today.getTime()) {
                    const [hours, minutes] = value.split(':').map(Number);
                    const selectedDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
                    
                    if (selectedDateTime <= now) {
                        return helpers.error('time.min');
                    }
                }
            }
            return value;
        })
        .messages({
            'string.pattern.base': 'Invalid time format (HH:MM)',
            'time.min': 'Scheduled time cannot be in the past for today\'s date',
            'any.required': 'Scheduled time is required'
        }),
    duration: Joi.number()
        .required()
        .min(15)
        .max(480)
        .messages({
            'number.min': 'Duration must be at least 15 minutes',
            'number.max': 'Duration cannot exceed 8 hours',
            'any.required': 'Duration is required'
        }),
    meetingRoom: Joi.string()
        .optional()
        .trim()
        .max(50)
        .messages({
            'string.max': 'Meeting room cannot exceed 50 characters'
        }),
    notes: Joi.string()
        .optional()
        .allow('')
        .trim()
        .max(500)
        .messages({
            'string.max': 'Notes cannot exceed 500 characters'
        })
});

const securityDetailsValidation = Joi.object({
    badgeIssued: Joi.boolean()
        .default(false),
    badgeNumber: Joi.string()
        .optional()
        .allow('')
        .trim()
        .uppercase(),
    securityClearance: Joi.boolean()
        .default(false),
    securityNotes: Joi.string()
        .optional()
        .allow('')
        .trim()
        .max(200)
        .messages({
            'string.max': 'Security notes cannot exceed 200 characters'
        })
});

const notificationsValidation = Joi.object({
    smsSent: Joi.boolean()
        .default(false),
    emailSent: Joi.boolean()
        .default(false),
    whatsappSent: Joi.boolean()
        .default(false),
    reminderSent: Joi.boolean()
        .default(false)
});

export const createAppointmentValidation = Joi.object({
    employeeId: Joi.string()
        .required()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.pattern.base': 'Invalid employee ID format',
            'any.required': 'Employee ID is required'
        }),
    visitorId: Joi.string()
        .required()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.pattern.base': 'Invalid visitor ID format',
            'any.required': 'Visitor ID is required'
        }),
    accompaniedBy: accompaniedByValidation.optional().allow(null),
    appointmentDetails: appointmentDetailsValidation.required(),
    securityDetails: securityDetailsValidation.optional(),
    notifications: notificationsValidation.optional()
});

export const updateAppointmentValidation = Joi.object({
    employeeId: Joi.string()
        .optional()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.pattern.base': 'Invalid employee ID format'
        }),
    visitorId: Joi.string()
        .optional()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.pattern.base': 'Invalid visitor ID format'
        }),
    accompaniedBy: accompaniedByValidation.optional().allow(null),
    appointmentDetails: appointmentDetailsValidation.optional(),
    status: Joi.string()
        .valid('pending', 'approved', 'rejected', 'completed')
        .optional()
        .messages({
            'any.only': 'Status must be one of: pending, approved, rejected, completed'
        }),
    checkInTime: Joi.date()
        .optional(),
    checkOutTime: Joi.date()
        .optional(),
    actualDuration: Joi.number()
        .optional()
        .min(0)
        .messages({
            'number.min': 'Actual duration cannot be negative'
        }),
    securityDetails: securityDetailsValidation.optional(),
    notifications: notificationsValidation.optional()
});

export const appointmentParamsValidation = Joi.object({
    id: Joi.string()
        .required()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.pattern.base': 'Invalid appointment ID format',
            'any.required': 'Appointment ID is required'
        })
});

export const appointmentIdParamsValidation = Joi.object({
    appointmentId: Joi.string()
        .required()
        .trim()
        .messages({
            'any.required': 'Appointment ID is required'
        })
});

export const checkInValidation = Joi.object({
    appointmentId: Joi.string()
        .required()
        .trim()
        .messages({
            'any.required': 'Appointment ID is required'
        }),
    badgeNumber: Joi.string()
        .optional()
        .trim()
        .uppercase(),
    securityNotes: Joi.string()
        .optional()
        .trim()
        .max(200)
        .messages({
            'string.max': 'Security notes cannot exceed 200 characters'
        })
});

export const checkOutValidation = Joi.object({
    appointmentId: Joi.string()
        .required()
        .trim()
        .messages({
            'any.required': 'Appointment ID is required'
        }),
    notes: Joi.string()
        .optional()
        .allow('')
        .trim()
        .max(500)
        .messages({
            'string.max': 'Notes cannot exceed 500 characters'
        })
});

export const getAppointmentsValidation = Joi.object({
    page: Joi.number()
        .integer()
        .min(1)
        .default(1),
    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(10),
    search: Joi.string()
        .optional()
        .trim(),
    employeeId: Joi.string()
        .optional()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.pattern.base': 'Invalid employee ID format'
        }),
    status: Joi.string()
        .valid('pending', 'approved', 'rejected', 'completed')
        .optional(),
    scheduledDate: Joi.date()
        .optional(),
    startDate: Joi.date()
        .optional(),
    endDate: Joi.date()
        .optional(),
    sortBy: Joi.string()
        .valid('createdAt', 'appointmentDetails.scheduledDate', 'status')
        .default('createdAt'),
    sortOrder: Joi.string()
        .valid('asc', 'desc')
        .default('desc')
});

export const bulkUpdateAppointmentsValidation = Joi.object({
    appointmentIds: Joi.array()
        .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
        .min(1)
        .required()
        .messages({
            'array.min': 'At least one appointment ID is required',
            'any.required': 'Appointment IDs are required'
        }),
    status: Joi.string()
        .valid('pending', 'approved', 'rejected', 'completed')
        .optional(),
    employeeId: Joi.string()
        .optional()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.pattern.base': 'Invalid employee ID format'
        }),
    meetingRoom: Joi.string()
        .optional()
        .trim()
        .max(50)
        .messages({
            'string.max': 'Meeting room cannot exceed 50 characters'
        })
});

export const appointmentSearchValidation = Joi.object({
    query: Joi.string()
        .required()
        .trim()
        .min(1)
        .messages({
            'any.required': 'Search query is required',
            'string.min': 'Search query cannot be empty'
        }),
    type: Joi.string()
        .valid('visitor_name', 'visitor_phone', 'visitor_email', 'appointment_id', 'employee_name')
        .required()
        .messages({
            'any.only': 'Search type must be one of: visitor_name, visitor_phone, visitor_email, appointment_id, employee_name',
            'any.required': 'Search type is required'
        }),
    page: Joi.number()
        .integer()
        .min(1)
        .default(1),
    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(10)
});

export const calendarValidation = Joi.object({
    startDate: Joi.date()
        .required()
        .messages({
            'any.required': 'Start date is required'
        }),
    endDate: Joi.date()
        .required()
        .min(Joi.ref('startDate'))
        .messages({
            'any.required': 'End date is required',
            'date.min': 'End date must be after start date'
        })
});

export const employeeIdParamsValidation = Joi.object({
    employeeId: Joi.string()
        .required()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.pattern.base': 'Invalid employee ID format',
            'any.required': 'Employee ID is required'
        })
});

export const dateRangeValidation = Joi.object({
    startDate: Joi.date()
        .required()
        .messages({
            'any.required': 'Start date is required'
        }),
    endDate: Joi.date()
        .required()
        .min(Joi.ref('startDate'))
        .messages({
            'any.required': 'End date is required',
            'date.min': 'End date must be after start date'
        })
});
