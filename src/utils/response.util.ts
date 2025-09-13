import { Response } from 'express';
import { ERROR_CODES } from './constants';

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
    statusCode: number;
}

export class ResponseUtil {
    /**
     * Send success response
     */
    static success<T>(
        res: Response,
        message: string,
        data?: T,
        statusCode: number = ERROR_CODES.OK
    ): Response<ApiResponse<T>> {
        return res.status(statusCode).json({
            success: true,
            message,
            data,
            statusCode,
        });
    }

    /**
     * Send error response
     */
    static error(
        res: Response,
        message: string,
        statusCode: number = ERROR_CODES.INTERNAL_SERVER_ERROR,
        error?: string
    ): Response<ApiResponse> {
        return res.status(statusCode).json({
            success: false,
            message,
            error,
            statusCode,
        });
    }

    /**
     * Send created response
     */
    static created<T>(
        res: Response,
        message: string,
        data?: T
    ): Response<ApiResponse<T>> {
        return res.status(ERROR_CODES.CREATED).json({
            success: true,
            message,
            data,
            statusCode: ERROR_CODES.CREATED,
        });
    }

    /**
     * Send not found response
     */
    static notFound(
        res: Response,
        message: string = 'Resource not found'
    ): Response<ApiResponse> {
        return res.status(ERROR_CODES.NOT_FOUND).json({
            success: false,
            message,
            statusCode: ERROR_CODES.NOT_FOUND,
        });
    }

    /**
     * Send unauthorized response
     */
    static unauthorized(
        res: Response,
        message: string = 'Unauthorized access'
    ): Response<ApiResponse> {
        return res.status(ERROR_CODES.UNAUTHORIZED).json({
            success: false,
            message,
            statusCode: ERROR_CODES.UNAUTHORIZED,
        });
    }

    /**
     * Send forbidden response
     */
    static forbidden(
        res: Response,
        message: string = 'Forbidden access'
    ): Response<ApiResponse> {
        return res.status(ERROR_CODES.FORBIDDEN).json({
            success: false,
            message,
            statusCode: ERROR_CODES.FORBIDDEN,
        });
    }

    /**
     * Send bad request response
     */
    static badRequest(
        res: Response,
        message: string = 'Bad request'
    ): Response<ApiResponse> {
        return res.status(ERROR_CODES.BAD_REQUEST).json({
            success: false,
            message,
            statusCode: ERROR_CODES.BAD_REQUEST,
        });
    }

    /**
     * Send conflict response
     */
    static conflict(
        res: Response,
        message: string = 'Resource conflict'
    ): Response<ApiResponse> {
        return res.status(ERROR_CODES.CONFLICT).json({
            success: false,
            message,
            statusCode: ERROR_CODES.CONFLICT,
        });
    }
}
