import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { AppError } from './errorHandler';
import { ERROR_CODES, TRIAL_LIMITS } from '../utils/constants';
import { UserSubscriptionService } from '../services/userSubscription/userSubscription.service';

export const checkTrialLimits = async (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user || !req.user._id) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }

        const userId = req.user._id.toString();
        const activeSubscription = await UserSubscriptionService.getUserActiveSubscription(userId);

        if (!activeSubscription || !activeSubscription.isTrialing) {
            return next();
        }

        const companyId = req.user.companyId;
        if (!companyId) {
            return next();
        }

        const counts = await UserSubscriptionService.getTrialLimitsCounts(companyId.toString());

        let limitExceeded = false;
        let resourceType = '';

        if (req.originalUrl.includes('/employees')) {
            if (counts.employees >= TRIAL_LIMITS.employees) {
                limitExceeded = true;
                resourceType = 'employees';
            }
        } else if (req.originalUrl.includes('/visitors')) {
            if (counts.visitors >= TRIAL_LIMITS.visitors) {
                limitExceeded = true;
                resourceType = 'visitors';
            }
        } else if (req.originalUrl.includes('/appointments')) {
            if (counts.appointments >= TRIAL_LIMITS.appointments) {
                limitExceeded = true;
                resourceType = 'appointments';
            }
        }

        if (limitExceeded) {
            throw new AppError(
                `You've reached your trial limit for ${resourceType}. Please upgrade to continue.`,
                ERROR_CODES.PAYMENT_REQUIRED
            );
        }

        next();
    } catch (error) {
        next(error);
    }
};



