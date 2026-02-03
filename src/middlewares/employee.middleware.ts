import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { EmployeeUtil } from '../utils/employee.util';
import { AppError } from './errorHandler';
import { ERROR_CODES } from '../utils/constants';

/**
 * Middleware to verify user is an employee
 */
export const verifyEmployee = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
    }

    const isEmployee = await EmployeeUtil.isEmployee(req.user);
    
    if (!isEmployee) {
      throw new AppError(
        'Access denied. Employee access required.',
        ERROR_CODES.FORBIDDEN
      );
    }

    // Add employee ID to request for easy access
    const employeeId = await EmployeeUtil.getEmployeeIdFromUser(req.user);
    (req as any).employeeId = employeeId;

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Failed to verify employee', ERROR_CODES.INTERNAL_SERVER_ERROR));
    }
  }
};

/**
 * Middleware to get employee ID (optional - doesn't throw error)
 */
export const getEmployeeId = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user) {
      const employeeId = await EmployeeUtil.getEmployeeIdFromUser(req.user);
      (req as any).employeeId = employeeId;
    }
    next();
  } catch (error) {
    // Continue even if employee not found
    next();
  }
};

