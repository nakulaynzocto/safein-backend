import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { AppError } from './errorHandler';
import { ERROR_CODES } from '../utils/constants';
import { UserSubscriptionService } from '../services/userSubscription/userSubscription.service';

export const checkSubscriptionStatus = async (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (req.method !== 'POST') {
            return next();
        }

        if (!req.user || !req.user._id) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }

        const userId = req.user._id.toString();
        const url = req.originalUrl;

        let resourceType: 'employees' | 'visitors' | 'appointments' | null = null;
        if (url.includes('/employees')) {
            resourceType = 'employees';
        } else if (url.includes('/visitors')) {
            resourceType = 'visitors';
        } else if (url.includes('/appointments') || url.includes('/appointment-links')) {
            resourceType = 'appointments';
        }

        if (resourceType) {
            await UserSubscriptionService.checkPlanLimits(userId, resourceType);
        }

        next();
    } catch (error) {
        next(error);
    }
};



