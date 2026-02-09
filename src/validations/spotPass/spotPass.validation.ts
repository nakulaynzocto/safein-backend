import Joi from 'joi';

export const createSpotPassValidation = Joi.object().keys({
    name: Joi.string().required().min(2).max(100),
    phone: Joi.string().required().pattern(/^[\+]?[1-9][\d]{0,15}$/),
    gender: Joi.string().required().valid('male', 'female', 'other'),
    address: Joi.string().required().max(500),
    photo: Joi.string().optional().allow(''),
    vehicleNumber: Joi.string().optional().allow('').max(20),
    notes: Joi.string().optional().allow(''),
});

export const getSpotPassesValidation = Joi.object().keys({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
    search: Joi.string().optional().allow(''),
    status: Joi.string().optional().valid('checked-in', 'checked-out'),
    startDate: Joi.string().isoDate().optional(),
    endDate: Joi.string().isoDate().optional(),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().optional().valid('asc', 'desc'),
});

export const spotPassParamsValidation = Joi.object().keys({
    id: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/),
});
