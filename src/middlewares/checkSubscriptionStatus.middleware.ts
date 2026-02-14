import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth.middleware";
import { AppError } from "./errorHandler";
import { ERROR_CODES } from "../utils/constants";
import { UserSubscriptionService } from "../services/userSubscription/userSubscription.service";
import { EmployeeUtil } from "../utils/employee.util";

export const checkSubscriptionStatus = async (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        if (req.method !== "POST") {
            return next();
        }

        if (!req.user || !req.user._id) {
            throw new AppError("User not authenticated", ERROR_CODES.UNAUTHORIZED);
        }

        const url = req.originalUrl;

        // Determine resource type first
        let resourceType: "employees" | "visitors" | "appointments" | null = null;
        if (url.includes("/employees")) {
            resourceType = "employees";
        } else if (url.includes("/visitors")) {
            resourceType = "visitors";
        } else if (url.includes("/appointments") || url.includes("/appointment-links")) {
            resourceType = "appointments";
        }

        // If no resource type, skip subscription check
        if (!resourceType) {
            return next();
        }

        // For employee creation route, only admins can create employees
        // So we should use the admin's own subscription (req.user is the admin)
        if (resourceType === "employees") {
            // Admin creating employee - use admin's own subscription
            // Skip employee check for employee creation route
            const userId = req.user._id.toString();
            await UserSubscriptionService.checkPlanLimits(userId, resourceType, false);
            return next();
        }

        // For other resources (visitors, appointments), check if user is employee
        // If employee, use admin's subscription (employee's createdBy)
        // If admin, use their own subscription
        const isEmployee = await EmployeeUtil.isEmployee(req.user);
        let userId = req.user._id.toString();

        if (isEmployee) {
            // Employee uses admin's subscription
            const adminUserId = await EmployeeUtil.getAdminUserIdForEmployee(req.user);
            if (adminUserId) {
                userId = adminUserId;
            } else {
                // If admin not found, employee cannot create resources
                // But provide more helpful error message
                throw new AppError(
                    "Employee account is not properly linked to an admin. Please contact your administrator.",
                    ERROR_CODES.FORBIDDEN
                );
            }
        }

        // Check subscription limits using admin's userId (for employees) or user's own userId (for admins)
        // Pass isEmployeeContext flag for better error messages
        await UserSubscriptionService.checkPlanLimits(userId, resourceType, isEmployee);

        next();
    } catch (error) {
        next(error);
    }
};
