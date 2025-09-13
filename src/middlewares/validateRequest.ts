import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ResponseUtil } from '../utils';

export const validateRequest = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const dataToValidate = { ...req.body, ...req.params, ...req.query };
        const { error } = schema.validate(dataToValidate);

        if (error) {
            const errorMessage = error.details.map(detail => detail.message).join(', ');
            ResponseUtil.badRequest(res, `Validation Error: ${errorMessage}`);
            return;
        }

        next();
    };
};


