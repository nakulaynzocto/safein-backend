import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { EmployeeDashboardService } from '../../services/employee/employeeDashboard.service';
import { EmployeeUtil } from '../../utils/employee.util';
import { ResponseUtil } from '../../utils/response.util';
import { AppError } from '../../middlewares/errorHandler';
import { ERROR_CODES } from '../../utils/constants';
import { TryCatch } from '../../decorators';
import { AppointmentService } from '../../services/appointment/appointment.service';

export class EmployeeDashboardController {
  /**
   * Get employee dashboard stats
   * GET /api/v1/employee/dashboard/stats
   */
  @TryCatch('Failed to get dashboard stats')
  static async getDashboardStats(
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    if (!req.user) {
      throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
    }

    // Get employee ID from user
    const employeeId = await EmployeeUtil.getEmployeeIdFromUser(req.user);
    
    if (!employeeId) {
      throw new AppError(
        'Employee not found. Please ensure your email matches an active employee.',
        ERROR_CODES.NOT_FOUND
      );
    }

    const stats = await EmployeeDashboardService.getDashboardStats(employeeId);
    ResponseUtil.success(res, 'Dashboard stats retrieved successfully', stats);
  }

  /**
   * Get employee appointments
   * GET /api/v1/employee/appointments
   */
  @TryCatch('Failed to get employee appointments')
  static async getEmployeeAppointments(
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    if (!req.user) {
      throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
    }

    const employeeId = await EmployeeUtil.getEmployeeIdFromUser(req.user);
    
    if (!employeeId) {
      throw new AppError(
        'Employee not found. Please ensure your email matches an active employee.',
        ERROR_CODES.NOT_FOUND
      );
    }

    // Get appointments with employeeId filter
    const query = {
      ...req.query,
      employeeId,
    };

    const result = await EmployeeDashboardService.getEmployeeAppointments(employeeId, query);
    ResponseUtil.success(res, 'Appointments retrieved successfully', result);
  }

  /**
   * Approve appointment (employee can only approve their own)
   * PUT /api/v1/employee/appointments/:id/approve
   */
  @TryCatch('Failed to approve appointment')
  static async approveAppointment(
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    if (!req.user) {
      throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
    }

    const { id } = req.params;
    const employeeId = await EmployeeUtil.getEmployeeIdFromUser(req.user);
    
    if (!employeeId) {
      throw new AppError('Employee not found', ERROR_CODES.NOT_FOUND);
    }

    // Verify appointment belongs to this employee
    const appointment = await AppointmentService.getAppointmentById(id);
    if (!appointment) {
      throw new AppError('Appointment not found', ERROR_CODES.NOT_FOUND);
    }
    
    // Check if appointment belongs to this employee
    const appointmentEmployeeId = (appointment as any).employeeId?._id?.toString() || 
                                   (appointment as any).employeeId?.toString();
    if (appointmentEmployeeId !== employeeId) {
      throw new AppError(
        'You do not have permission to perform this action',
        ERROR_CODES.FORBIDDEN
      );
    }

    const result = await AppointmentService.approveAppointment(id, {
      sendNotifications: true,
      actionBy: 'employee' // Employee is performing the action, so notification should only go to admin
    });

    ResponseUtil.success(res, 'Appointment approved successfully', result);
  }

  /**
   * Reject appointment (employee can only reject their own)
   * PUT /api/v1/employee/appointments/:id/reject
   */
  @TryCatch('Failed to reject appointment')
  static async rejectAppointment(
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    if (!req.user) {
      throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
    }

    const { id } = req.params;
    const employeeId = await EmployeeUtil.getEmployeeIdFromUser(req.user);
    
    if (!employeeId) {
      throw new AppError('Employee not found', ERROR_CODES.NOT_FOUND);
    }

    // Verify appointment belongs to this employee
    const appointment = await AppointmentService.getAppointmentById(id);
    if (!appointment) {
      throw new AppError('Appointment not found', ERROR_CODES.NOT_FOUND);
    }
    
    // Check if appointment belongs to this employee
    const appointmentEmployeeId = (appointment as any).employeeId?._id?.toString() || 
                                   (appointment as any).employeeId?.toString();
    if (appointmentEmployeeId !== employeeId) {
      throw new AppError(
        'You do not have permission to perform this action',
        ERROR_CODES.FORBIDDEN
      );
    }

    const result = await AppointmentService.rejectAppointment(id, {
      sendNotifications: true,
      actionBy: 'employee' // Employee is performing the action, so notification should only go to admin
    });

    ResponseUtil.success(res, 'Appointment rejected successfully', result);
  }
}

