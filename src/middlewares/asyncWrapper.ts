import { Request, Response, NextFunction } from 'express';

/**
 * Wrapper for async route handlers
 * Automatically catches async errors and passes them to the error handler
 */
export const asyncWrapper = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
