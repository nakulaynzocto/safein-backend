import { Request, Response, NextFunction } from 'express';
import { AppointmentService } from '../../services/appointment/appointment.service';
import { Appointment } from '../../models/appointment/appointment.model';
import { ResponseUtil } from '../../utils';
import {
    ICreateAppointmentDTO,
    IUpdateAppointmentDTO,
    IGetAppointmentsQuery,
    ICheckInRequest,
    ICheckOutRequest
} from '../../types/appointment/appointment.types';
import { ERROR_CODES } from '../../utils/constants';
import { TryCatch } from '../../decorators';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/errorHandler';
import { EmployeeUtil } from '../../utils/employee.util';

export class AppointmentController {
    /**
     * Common helper: Determine if user is employee performing action on their own appointment
     * Returns 'employee' if user is employee acting on their appointment, otherwise 'admin'
     */
    private static async determineActionBy(
        user: any,
        appointmentId: string
    ): Promise<'admin' | 'employee'> {
        try {
            const employeeId = await EmployeeUtil.getEmployeeIdFromUser(user);
            if (employeeId) {
                // Check if appointment belongs to this employee
                const appointment = await AppointmentService.getAppointmentById(appointmentId);
                if (appointment) {
                    const appointmentEmployeeId = (appointment as any).employeeId?._id?.toString() ||
                        (appointment as any).employeeId?.toString();
                    if (appointmentEmployeeId === employeeId) {
                        return 'employee';
                    }
                }
            }
        } catch (error) {
            // If error determining employee, default to admin
        }
        return 'admin';
    }

    /**
     * Create a new appointment
     * POST /api/appointments
     */
    @TryCatch('Failed to create appointment')
    static async createAppointment(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }
        const appointmentData: ICreateAppointmentDTO = req.body;
        const createdBy = req.user._id.toString();
        // Pass sendNotifications: true to enable socket notifications and real-time updates
        const appointment = await AppointmentService.createAppointment(appointmentData, createdBy, { sendNotifications: true });
        ResponseUtil.success(res, 'Appointment created successfully', appointment, ERROR_CODES.CREATED);
    }

    /**
     * Get all appointments with pagination and filtering (user-specific)
     * GET /api/appointments
     * - Admin: sees only THEIR OWN appointments (with their employees)
     * - Employee: sees only their own appointments
     */
    @TryCatch('Failed to get appointments')
    static async getAllAppointments(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }

        const query: IGetAppointmentsQuery = req.query;
        const userId = req.user._id.toString();

        // Check if user is an employee
        const isEmployee = await EmployeeUtil.isEmployee(req.user);

        // If employee, automatically filter by their employeeId (so they only see their own appointments)
        if (isEmployee) {
            const employeeId = await EmployeeUtil.getEmployeeIdFromUser(req.user);
            if (employeeId) {
                // Add employeeId to query to filter appointments for this employee only
                query.employeeId = employeeId;
            } else {
                // If employeeId not found, return empty result
                ResponseUtil.success(res, 'Appointments retrieved successfully', {
                    appointments: [],
                    pagination: {
                        currentPage: query.page || 1,
                        totalPages: 0,
                        totalAppointments: 0,
                        hasNextPage: false,
                        hasPrevPage: false
                    }
                });
                return;
            }
        }

        // SECURITY FIX: Pass adminUserId to filter appointments by admin's employees
        // - For admin: shows appointments with employees created by this admin (their own data)
        // - For employee: employeeId is already in query, adminUserId won't be used
        const result = await AppointmentService.getAllAppointments(query, isEmployee ? undefined : userId);
        ResponseUtil.success(res, 'Appointments retrieved successfully', result);
    }

    /**
     * Get appointment by ID (user-specific)
     * GET /api/appointments/:id
     */
    @TryCatch('Failed to get appointment')
    static async getAppointmentById(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }

        const { id } = req.params;
        const userId = req.user._id.toString();

        // Get appointment and verify it belongs to the current user
        const appointment = await AppointmentService.getAppointmentById(id);

        // Check if user is an employee
        const isEmployee = await EmployeeUtil.isEmployee(req.user);
        const employeeId = isEmployee ? await EmployeeUtil.getEmployeeIdFromUser(req.user) : null;

        // Additional check: verify access
        // - Admin: must have created the appointment (or belongs to their employee)
        // - Employee: must be the assigned employee for this appointment
        const appointmentRecord = await Appointment.findById(id);

        if (!appointmentRecord) {
            throw new AppError('Appointment not found', ERROR_CODES.NOT_FOUND);
        }

        const isCreator = appointmentRecord.createdBy.toString() === userId;
        const isAssignedEmployee = employeeId && appointmentRecord.employeeId.toString() === employeeId;

        if (!isCreator && !isAssignedEmployee) {
            throw new AppError('Access denied', ERROR_CODES.FORBIDDEN);
        }

        ResponseUtil.success(res, 'Appointment retrieved successfully', appointment);
    }

    /**
     * Get appointment by appointment ID
     * GET /api/appointments/appointment/:appointmentId
     */
    @TryCatch('Failed to get appointment')
    static async getAppointmentByAppointmentId(req: Request, res: Response, _next: NextFunction): Promise<void> {
        const { appointmentId } = req.params;
        const appointment = await AppointmentService.getAppointmentByAppointmentId(appointmentId);
        ResponseUtil.success(res, 'Appointment retrieved successfully', appointment);
    }

    /**
     * Update appointment
     * PUT /api/appointments/:id
     */
    @TryCatch('Failed to update appointment')
    static async updateAppointment(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }

        const { id } = req.params;
        const updateData: IUpdateAppointmentDTO = req.body;

        // Check if status is being changed to approved/rejected
        const isStatusChange = updateData.status === 'approved' || updateData.status === 'rejected';

        // Determine if user is an employee
        let actionBy: 'admin' | 'employee' = 'admin';
        if (isStatusChange) {
            try {
                const employeeId = await EmployeeUtil.getEmployeeIdFromUser(req.user);
                if (employeeId) {
                    // Check if appointment belongs to this employee
                    const appointment = await AppointmentService.getAppointmentById(id);
                    if (appointment) {
                        const appointmentEmployeeId = (appointment as any).employeeId?._id?.toString() ||
                            (appointment as any).employeeId?.toString();
                        if (appointmentEmployeeId === employeeId) {
                            actionBy = 'employee';
                        }
                    }
                }
            } catch (error) {
                // If error determining employee, default to admin
            }
        }

        const appointment = await AppointmentService.updateAppointment(id, updateData, {
            actionBy,
            sendNotifications: isStatusChange // Send notifications only for status changes
        });
        ResponseUtil.success(res, 'Appointment updated successfully', appointment);
    }

    /**
     * Soft delete appointment
     * DELETE /api/appointments/:id
     */
    @TryCatch('Failed to delete appointment')
    static async deleteAppointment(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }
        const { id } = req.params;
        const deletedBy = req.user._id.toString();
        await AppointmentService.deleteAppointment(id, deletedBy);
        ResponseUtil.success(res, 'Appointment deleted successfully');
    }

    /**
     * Check in appointment
     * POST /api/appointments/check-in
     */
    @TryCatch('Failed to check in appointment')
    static async checkInAppointment(req: Request, res: Response, _next: NextFunction): Promise<void> {
        const request: ICheckInRequest = req.body;
        const appointment = await AppointmentService.checkInAppointment(request);
        ResponseUtil.success(res, 'Appointment checked in successfully', appointment);
    }

    /**
     * Check out appointment
     * POST /api/appointments/check-out
     */
    @TryCatch('Failed to check out appointment')
    static async checkOutAppointment(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        const request: ICheckOutRequest = req.body;

        // Use common helper to determine actionBy
        const actionBy = req.user
            ? await this.determineActionBy(req.user, request.appointmentId)
            : 'admin';

        // Notify admin when employee completes
        const sendNotifications = actionBy === 'employee';

        const appointment = await AppointmentService.checkOutAppointment(request, {
            actionBy,
            sendNotifications
        });
        ResponseUtil.success(res, 'Appointment checked out successfully', appointment);
    }







    /**
     * Cancel appointment
     * PUT /api/appointments/:id/cancel
     */
    @TryCatch('Failed to cancel appointment')
    static async cancelAppointment(req: Request, res: Response, _next: NextFunction): Promise<void> {
        const { id } = req.params;
        const appointment = await AppointmentService.cancelAppointment(id);
        ResponseUtil.success(res, 'Appointment cancelled successfully', appointment);
    }

    /**
     * Approve appointment
     * PUT /api/appointments/:id/approve
     */
    @TryCatch('Failed to approve appointment')
    static async approveAppointment(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }

        const { id } = req.params;

        // Use common helper to determine actionBy
        const actionBy = await this.determineActionBy(req.user, id);

        const result = await AppointmentService.approveAppointment(id, {
            sendNotifications: true, // Enable socket notifications
            actionBy
        });
        ResponseUtil.success(res, 'Appointment approved successfully. The visitor has been notified.', result);
    }

    /**
     * Reject appointment
     * PUT /api/appointments/:id/reject
     */
    @TryCatch('Failed to reject appointment')
    static async rejectAppointment(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }

        const { id } = req.params;

        // Use common helper to determine actionBy
        const actionBy = await this.determineActionBy(req.user, id);

        const result = await AppointmentService.rejectAppointment(id, {
            sendNotifications: true, // Enable socket notifications
            actionBy
        });
        ResponseUtil.success(res, 'Appointment rejected. The visitor has been informed.', result);
    }

    /**
     * Get dashboard statistics (unified for admin and employee)
     * GET /api/appointments/dashboard/stats
     * - Admin: sees only THEIR OWN appointments stats (with their employees)
     * - Employee: sees only their own appointments stats
     */
    @TryCatch('Failed to get dashboard stats')
    static async getDashboardStats(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }

        const userId = req.user._id.toString();

        // Check if user is an employee
        const isEmployee = await EmployeeUtil.isEmployee(req.user);

        let employeeId: string | undefined;
        let adminUserId: string | undefined;

        // If employee, get their employeeId to filter stats
        if (isEmployee) {
            const fetchedEmployeeId = await EmployeeUtil.getEmployeeIdFromUser(req.user);
            if (!fetchedEmployeeId) {
                throw new AppError(
                    'Employee not found. Please ensure your email matches an active employee.',
                    ERROR_CODES.NOT_FOUND
                );
            }
            employeeId = fetchedEmployeeId;
        } else {
            // For admin, pass adminUserId to filter by their employees
            adminUserId = userId;
        }

        // SECURITY FIX: Pass adminUserId to filter stats by admin's employees
        // - For admin: shows stats for appointments with employees created by this admin
        // - For employee: shows stats for only their own appointments
        const stats = await AppointmentService.getDashboardStats(employeeId, adminUserId);
        ResponseUtil.success(res, 'Dashboard stats retrieved successfully', stats);
    }
}
