import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ResponseUtil } from '../utils';

export const validateRequest = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const { error } = schema.validate(req.body);

        if (error) {
            const errorMessage = error.details.map(detail => detail.message).join(', ');
            ResponseUtil.badRequest(res, `Validation Error: ${errorMessage}`);
            return;
        }

        next();
    };
};

export const validateParams = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const { error } = schema.validate(req.params);

        if (error) {
            const errorMessage = error.details.map(detail => detail.message).join(', ');
            ResponseUtil.badRequest(res, `Parameter Validation Error: ${errorMessage}`);
            return;
        }

        next();
    };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const { error } = schema.validate(req.query);

        if (error) {
            const errorMessage = error.details.map(detail => detail.message).join(', ');
            ResponseUtil.badRequest(res, `Query Validation Error: ${errorMessage}`);
            return;
        }

        next();
    };
};
