import { Response, NextFunction } from 'express';
import { SubscriptionService } from '../services/userSubscription/userSubscription.service';
import { AuthenticatedRequest } from './auth.middleware';
import { AppError } from './errorHandler';
import { ERROR_CODES } from '../utils/constants';

/**
 * Middleware to check if user has premium subscription
 * This middleware should be used on routes that require premium access
 */
export const checkPremiumSubscription = async (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }

        const hasPremium = await SubscriptionService.hasActivePremiumSubscription({
            userId: req.user._id.toString()
        });

        if (!hasPremium) {
            console.warn(`Premium subscription required for user ${req.user._id}`);
            throw new AppError(
                'Premium subscription required to access this feature',
                ERROR_CODES.FORBIDDEN
            );
        }

        // Add premium status to request object for use in controllers
        req.isPremiumUser = true;
        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Middleware to check if user has any active subscription (free or premium)
 * This middleware should be used on routes that require any subscription
 */
export const checkActiveSubscription = async (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }

        const activeSubscription = await SubscriptionService.getUserActiveSubscription({
            userId: req.user._id.toString()
        });

        if (!activeSubscription) {
            console.warn(`Active subscription required for user ${req.user._id}`);
            throw new AppError(
                'Active subscription required to access this feature',
                ERROR_CODES.FORBIDDEN
            );
        }

        // Add subscription info to request object
        req.activeSubscription = activeSubscription;
        req.isPremiumUser = activeSubscription.amount > 0;
        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Middleware to check if user has specific subscription plan
 * This middleware should be used on routes that require a specific plan
 */
export const checkSpecificPlan = (requiredPlanId: string) => {
    return async (
        req: AuthenticatedRequest,
        _res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            if (!req.user) {
                throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
            }

            const activeSubscription = await SubscriptionService.getUserActiveSubscription({
                userId: req.user._id.toString()
            });

            if (!activeSubscription) {
                console.warn(`Active subscription required for user ${req.user._id}`);
                throw new AppError(
                    'Active subscription required to access this feature',
                    ERROR_CODES.FORBIDDEN
                );
            }

            if (activeSubscription.planId !== requiredPlanId) {
                console.warn(`Specific plan ${requiredPlanId} required for user ${req.user._id}`);
                throw new AppError(
                    'Specific subscription plan required to access this feature',
                    ERROR_CODES.FORBIDDEN
                );
            }

            // Add subscription info to request object
            req.activeSubscription = activeSubscription;
            req.isPremiumUser = activeSubscription.amount > 0;
            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Middleware to check if user has trial subscription
 * This middleware should be used on routes that require trial access
 */
export const checkTrialSubscription = async (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }

        const activeSubscription = await SubscriptionService.getUserActiveSubscription({
            userId: req.user._id.toString()
        });

        if (!activeSubscription) {
            console.warn(`Active subscription required for user ${req.user._id}`);
            throw new AppError(
                'Active subscription required to access this feature',
                ERROR_CODES.FORBIDDEN
            );
        }

        if (!activeSubscription.isTrialing) {
            console.warn(`Trial subscription required for user ${req.user._id}`);
            throw new AppError(
                'Trial subscription required to access this feature',
                ERROR_CODES.FORBIDDEN
            );
        }

        // Add subscription info to request object
        req.activeSubscription = activeSubscription;
        req.isPremiumUser = activeSubscription.amount > 0;
        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Optional middleware to add subscription info to request without blocking
 * This middleware adds subscription info to request object but doesn't block access
 */
export const addSubscriptionInfo = async (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) {
            return next();
        }

        const activeSubscription = await SubscriptionService.getUserActiveSubscription({
            userId: req.user._id.toString()
        });

        if (activeSubscription) {
            req.activeSubscription = activeSubscription;
            req.isPremiumUser = activeSubscription.amount > 0;
        } else {
            req.isPremiumUser = false;
        }

        next();
    } catch (error) {
        // Don't block request if subscription check fails
        console.error('Error adding subscription info:', error);
        req.isPremiumUser = false;
        next();
    }
};

// Extend the AuthenticatedRequest interface to include subscription info
declare global {
    namespace Express {
        interface Request {
            isPremiumUser?: boolean;
            activeSubscription?: any;
        }
    }
}
