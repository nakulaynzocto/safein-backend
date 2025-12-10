import Joi from 'joi';

export const updateSettingsValidation = Joi.object({
    notifications: Joi.object({
        emailEnabled: Joi.boolean().optional(),
        whatsappEnabled: Joi.boolean().optional(),
        smsEnabled: Joi.boolean().optional()
    }).optional(),
    whatsapp: Joi.object({
        senderNumber: Joi.string()
            .trim()
            .pattern(/^[\+]?[1-9][\d]{0,15}$/)
            .allow('')
            .optional()
            .messages({
                'string.pattern.base': 'Please enter a valid phone number'
            })
    }).optional()
}).min(1).messages({
    'object.min': 'At least one field must be provided for update'
});



