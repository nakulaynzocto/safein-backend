import Joi from 'joi';

export const inquiryValidation = {
    create: Joi.object({
        name: Joi.string().required().min(2).max(100),
        email: Joi.string().required().email(),
        phone: Joi.string().required().pattern(/^[0-9+-\s]{10,20}$/),
        message: Joi.string().required().min(10).max(1000),
        source: Joi.string().optional()
    })
};
