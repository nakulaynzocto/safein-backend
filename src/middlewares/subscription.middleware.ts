import { Response, NextFunction } from "express";
import { UserSubscriptionService } from "../services/userSubscription/userSubscription.service";
import { AuthenticatedRequest } from "./auth.middleware";
import { AppError } from "./errorHandler";
import { ERROR_CODES } from "../utils/constants";
import { IUserSubscriptionResponse } from "../types/userSubscription/userSubscription.types";

/**
 * Middleware to check if user has premium subscription
 * This middleware should be used on routes that require premium access
 */
export const checkPremiumSubscription = async (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        if (!req.user) {
            throw new AppError("User not authenticated", ERROR_CODES.UNAUTHORIZED);
        }

        const activeSubscription = await UserSubscriptionService.getUserActiveSubscription(req.user._id.toString());
        const hasPremium = activeSubscription && activeSubscription.planType !== "free";

        if (!hasPremium) {
            throw new AppError("Premium subscription required to access this feature", ERROR_CODES.FORBIDDEN);
        }

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
    next: NextFunction,
): Promise<void> => {
    try {
        if (!req.user) {
            throw new AppError("User not authenticated", ERROR_CODES.UNAUTHORIZED);
        }

        const activeSubscription = await UserSubscriptionService.getUserActiveSubscription(req.user._id.toString());

        if (!activeSubscription) {
            throw new AppError("Active subscription required to access this feature", ERROR_CODES.FORBIDDEN);
        }

        req.activeSubscription = activeSubscription;
        req.isPremiumUser = activeSubscription.planType !== "free";
        next();
    } catch (error) {
        next(error);
    }
};

export const checkSpecificPlan = (requiredPlanType: string) => {
    return async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) {
                throw new AppError("User not authenticated", ERROR_CODES.UNAUTHORIZED);
            }

            const activeSubscription = await UserSubscriptionService.getUserActiveSubscription(req.user._id.toString());

            if (!activeSubscription) {
                throw new AppError("Active subscription required to access this feature", ERROR_CODES.FORBIDDEN);
            }

            if (activeSubscription.planType !== requiredPlanType) {
                throw new AppError("Specific subscription plan required to access this feature", ERROR_CODES.FORBIDDEN);
            }

            req.activeSubscription = activeSubscription;
            req.isPremiumUser = activeSubscription.planType !== "free";
            next();
        } catch (error) {
            next(error);
        }
    };
};

export const checkTrialSubscription = async (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        if (!req.user) {
            throw new AppError("User not authenticated", ERROR_CODES.UNAUTHORIZED);
        }

        const activeSubscription = await UserSubscriptionService.getUserActiveSubscription(req.user._id.toString());

        if (!activeSubscription) {
            throw new AppError("Active subscription required to access this feature", ERROR_CODES.FORBIDDEN);
        }

        if (!activeSubscription.isTrialing) {
            throw new AppError("Trial subscription required to access this feature", ERROR_CODES.FORBIDDEN);
        }

        req.activeSubscription = activeSubscription;
        req.isPremiumUser = activeSubscription.planType !== "free";
        next();
    } catch (error) {
        next(error);
    }
};

export const addSubscriptionInfo = async (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        if (!req.user) {
            return next();
        }

        const activeSubscription = await UserSubscriptionService.getUserActiveSubscription(req.user._id.toString());

        if (activeSubscription) {
            req.activeSubscription = activeSubscription;
            req.isPremiumUser = activeSubscription.planType !== "free";
        } else {
            req.isPremiumUser = false;
        }

        next();
    } catch (error) {
        req.isPremiumUser = false;
        next();
    }
};
declare global {
    namespace Express {
        interface Request {
            isPremiumUser?: boolean;
            activeSubscription?: IUserSubscriptionResponse;
        }
    }
}
