import { Request, Response, NextFunction } from 'express';
// @ts-ignore
import { CONSTANTS } from '../../utils/constants';
import { authenticateWithMasterToken } from './auth.utils';
import { AppError } from '../errorHandler';

export const verifyMasterToken = async (req: Request, res: Response, next: NextFunction) => {
    // Check if token exists first to provide specific error message if missing
    if (!req.headers['x-master-token']) {
        res.status(403).json({ error: 'Forsaken: Master Token Required' });
        return;
    }
    try {
        const user = authenticateWithMasterToken(req);
        if (user) {
            // @ts-ignore
            req.user = user;
            next();
        } else {
            // Should not happen if check above passes, but for safety
            res.status(403).json({ error: 'Forsaken: Master Token Required' });
        }
    } catch (error: any) {
        // Handle AppErrors thrown by helper (Invalid token or Missing Context)
        if (error instanceof AppError) {
            res.status(401).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};
