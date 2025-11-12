import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { AppError } from './errorHandler';
import { ERROR_CODES } from '../utils/constants';
import { UserSubscriptionService } from '../services/userSubscription/userSubscription.service';
import { Employee } from '../models/employee/employee.model';
import { Visitor } from '../models/visitor/visitor.model';
import { Appointment } from '../models/appointment/appointment.model';
import mongoose from 'mongoose';

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

        // If no active subscription or not a free trial, skip limit checks
        if (!activeSubscription || !activeSubscription.isTrialing) {
            return next();
        }

        // Define trial limits
        const TRIAL_LIMITS = {
            employees: 10,
            visitors: 10,
            appointments: 10,
        };

        // Get current counts for the user's company (assuming companyId is on req.user)
        const companyId = req.user.companyId;
        if (!companyId) {
            console.warn(`User ${userId} has no associated companyId. Skipping trial limits.`);
            return next(); // Or throw an error if companyId is strictly required
        }

        const [employeeCount, visitorCount, appointmentCount] = await Promise.all([
            Employee.countDocuments({ companyId: new mongoose.Types.ObjectId(companyId), isDeleted: false }),
            Visitor.countDocuments({ companyId: new mongoose.Types.ObjectId(companyId), isDeleted: false }),
            Appointment.countDocuments({ companyId: new mongoose.Types.ObjectId(companyId), isDeleted: false }),
        ]);

        let limitExceeded = false;
        let resourceType = '';

        // Check limits based on the route being accessed
        if (req.originalUrl.includes('/employees')) {
            if (employeeCount >= TRIAL_LIMITS.employees) {
                limitExceeded = true;
                resourceType = 'employees';
            }
        } else if (req.originalUrl.includes('/visitors')) {
            if (visitorCount >= TRIAL_LIMITS.visitors) {
                limitExceeded = true;
                resourceType = 'visitors';
            }
        } else if (req.originalUrl.includes('/appointments')) {
            if (appointmentCount >= TRIAL_LIMITS.appointments) {
                limitExceeded = true;
                resourceType = 'appointments';
            }
        }

        if (limitExceeded) {
            console.warn(`Trial limit exceeded for ${resourceType} for user ${userId}`);
            throw new AppError(
                `You've reached your trial limit for ${resourceType}. Please upgrade to continue.`,
                ERROR_CODES.PAYMENT_REQUIRED // 402 status code
            );
        }

        next();
    } catch (error) {
        next(error);
    }
};



