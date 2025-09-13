import { Response } from 'express';

export interface ErrorResponse {
    success: false;
    message: string;
    statusCode: number;
    error?: string;
}

/**
 * Send error response
 */
export const sendErrorResponse = (
    res: Response,
    message: string,
    statusCode: number,
    error?: string
): Response<ErrorResponse> => {
    return res.status(statusCode).json({
        success: false,
        message,
        statusCode,
        ...(error && { error })
    });
};
