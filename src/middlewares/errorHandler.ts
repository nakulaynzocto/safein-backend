import { Request, Response, NextFunction } from "express";
import { ERROR_CODES } from "../utils/constants";
import { sendErrorResponse } from "../utils/errorResponse.util";

export class AppError extends Error {
    public statusCode: number;
    public isOperational: boolean;

    constructor(message: string, statusCode: number = ERROR_CODES.INTERNAL_SERVER_ERROR) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

export const errorHandler = (error: Error | AppError, _req: Request, res: Response, _next: NextFunction): void => {
    let statusCode = ERROR_CODES.INTERNAL_SERVER_ERROR;
    let message = "Internal Server Error";

    if (error instanceof AppError) {
        statusCode = error.statusCode;
        message = error.message;
    } else if (error.name === "ValidationError") {
        statusCode = ERROR_CODES.BAD_REQUEST;
        message = "Validation Error";
    } else if (error.name === "CastError") {
        statusCode = ERROR_CODES.BAD_REQUEST;
        message = "Invalid ID format";
    } else if (error.name === "MongoError" && (error as any).code === 11000) {
        statusCode = ERROR_CODES.CONFLICT;
        message = "Duplicate field value";
    } else if (error.name === "JsonWebTokenError") {
        statusCode = ERROR_CODES.UNAUTHORIZED;
        message = "Invalid token";
    } else if (error.name === "TokenExpiredError") {
        statusCode = ERROR_CODES.UNAUTHORIZED;
        message = "Token expired";
    }

    if (process.env.NODE_ENV === "development") {
        console.error("Error:", error);
    }

    sendErrorResponse(res, message, statusCode, process.env.NODE_ENV === "development" ? error.message : undefined);
};
