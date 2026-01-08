import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { sendErrorResponse } from "../utils/errorResponse.util";
import { ERROR_CODES } from "../utils/constants";

export const validateRequest = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const dataToValidate = { ...req.body, ...req.params, ...req.query };

        const { error } = schema.validate(dataToValidate, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            const errorMessages = error.details.map((detail) => ({
                field: detail.path.join("."),
                message: detail.message,
                value: detail.context?.value,
            }));

            const formattedErrors = errorMessages.map((err) => `${err.field}: ${err.message}`).join("; ");

            sendErrorResponse(
                res,
                `Validation Error: ${formattedErrors}`,
                ERROR_CODES.BAD_REQUEST,
                JSON.stringify(errorMessages),
            );
            return;
        }

        next();
    };
};
