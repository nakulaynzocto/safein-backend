import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

declare global {
    namespace Express {
        interface Request {
            requestId?: string;
            startTime?: number;
        }
    }
}

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
    req.requestId = logger.generateRequestId();
    req.startTime = Date.now();

    const requestPayload = {
        body: req.body,
        query: req.query,
        params: req.params,
        headers: {
            'user-agent': req.get('User-Agent'),
            'content-type': req.get('Content-Type'),
            'authorization': req.get('Authorization') ? '[REDACTED]' : undefined,
            'x-forwarded-for': req.get('X-Forwarded-For'),
            'x-real-ip': req.get('X-Real-IP')
        }
    };

    logger.logRequest({
        type: 'REQUEST',
        method: req.method,
        url: req.originalUrl,
        requestId: req.requestId || 'unknown',
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        requestPayload: logger.sanitizePayload(requestPayload)
    });

    const originalJson = res.json;
    res.json = function (body: any) {
        const responseTime = req.startTime ? Date.now() - req.startTime : undefined;

        logger.logResponse({
            type: 'RESPONSE',
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            requestId: req.requestId || 'unknown',
            userAgent: req.get('User-Agent'),
            ip: req.ip || req.connection.remoteAddress,
            responsePayload: logger.sanitizePayload(body),
            responseTime: responseTime
        });

        return originalJson.call(this, body);
    };

    const originalSend = res.send;
    res.send = function (body: any) {
        const responseTime = req.startTime ? Date.now() - req.startTime : undefined;

        logger.logResponse({
            type: 'RESPONSE',
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            requestId: req.requestId || 'unknown',
            userAgent: req.get('User-Agent'),
            ip: req.ip || req.connection.remoteAddress,
            responsePayload: logger.sanitizePayload(body),
            responseTime: responseTime
        });

        return originalSend.call(this, body);
    };

    next();
};

export const errorLogger = (error: Error, req: Request, res: Response, next: NextFunction): void => {
    const responseTime = req.startTime ? Date.now() - req.startTime : undefined;

    logger.logError({
        type: 'ERROR',
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode || 500,
        requestId: req.requestId || 'unknown',
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        requestPayload: logger.sanitizePayload({
            body: req.body,
            query: req.query,
            params: req.params
        }),
        error: error.message,
        message: error.message,
        stack: error.stack,
        responseTime: responseTime
    });

    next(error);
};
