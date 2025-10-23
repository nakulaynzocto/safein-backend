import { Response, NextFunction } from 'express';
import { AppointmentService } from '../../services/appointment/appointment.service';
import { Appointment } from '../../models/appointment/appointment.model';
import { ResponseUtil } from '../../utils';
import {
    ICreateAppointmentDTO,
    IUpdateAppointmentDTO,
    IGetAppointmentsQuery,
    ICheckInRequest,
    ICheckOutRequest,
    IBulkUpdateAppointmentsDTO
} from '../../types/appointment/appointment.types';
import { ERROR_CODES } from '../../utils/constants';
import { TryCatch } from '../../decorators';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/errorHandler';

export class AppointmentController {
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
        const appointment = await AppointmentService.createAppointment(appointmentData, createdBy);
        ResponseUtil.success(res, 'Appointment created successfully', appointment, ERROR_CODES.CREATED);
    }

    /**
     * Get all appointments with pagination and filtering (user-specific)
     * GET /api/appointments
     */
    @TryCatch('Failed to get appointments')
    static async getAllAppointments(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }
        
        const query: IGetAppointmentsQuery = req.query;
        const userId = req.user._id.toString();
        const result = await AppointmentService.getAllAppointments(query, userId);
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
        
        // Additional check: verify the appointment was created by the current user
        const appointmentRecord = await Appointment.findById(id);
        if (!appointmentRecord || appointmentRecord.createdBy.toString() !== userId) {
            throw new AppError('Appointment not found or access denied', ERROR_CODES.NOT_FOUND);
        }
        
        ResponseUtil.success(res, 'Appointment retrieved successfully', appointment);
    }

    /**
     * Get appointment by appointment ID (user-specific)
     * GET /api/appointments/appointment/:appointmentId
     */
    @TryCatch('Failed to get appointment')
    static async getAppointmentByAppointmentId(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }
        
        const { appointmentId } = req.params;
        const userId = req.user._id.toString();
        
        // Get appointment and verify it belongs to the current user
        const appointment = await AppointmentService.getAppointmentByAppointmentId(appointmentId);
        
        // Additional check: verify the appointment was created by the current user
        const appointmentRecord = await Appointment.findById(appointment._id);
        if (!appointmentRecord || appointmentRecord.createdBy.toString() !== userId) {
            throw new AppError('Appointment not found or access denied', ERROR_CODES.NOT_FOUND);
        }
        
        ResponseUtil.success(res, 'Appointment retrieved successfully', appointment);
    }

    /**
     * Update appointment (user-specific)
     * PUT /api/appointments/:id
     */
    @TryCatch('Failed to update appointment')
    static async updateAppointment(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }
        
        const { id } = req.params;
        const updateData: IUpdateAppointmentDTO = req.body;
        const userId = req.user._id.toString();
        
        // Verify the appointment belongs to the current user before updating
        const appointmentRecord = await Appointment.findById(id);
        if (!appointmentRecord || appointmentRecord.createdBy.toString() !== userId) {
            throw new AppError('Appointment not found or access denied', ERROR_CODES.NOT_FOUND);
        }
        
        const appointment = await AppointmentService.updateAppointment(id, updateData);
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
     * Check in appointment (user-specific)
     * POST /api/appointments/check-in
     */
    @TryCatch('Failed to check in appointment')
    static async checkInAppointment(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }
        
        const request: ICheckInRequest = req.body;
        const userId = req.user._id.toString();
        
        // Verify the appointment belongs to the current user before checking in
        const appointmentRecord = await Appointment.findById(request.appointmentId);
        if (!appointmentRecord || appointmentRecord.createdBy.toString() !== userId) {
            throw new AppError('Appointment not found or access denied', ERROR_CODES.NOT_FOUND);
        }
        
        const appointment = await AppointmentService.checkInAppointment(request);
        ResponseUtil.success(res, 'Appointment checked in successfully', appointment);
    }

    /**
     * Check out appointment (user-specific)
     * POST /api/appointments/check-out
     */
    @TryCatch('Failed to check out appointment')
    static async checkOutAppointment(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }
        
        const request: ICheckOutRequest = req.body;
        const userId = req.user._id.toString();
        
        // Verify the appointment belongs to the current user before checking out
        const appointmentRecord = await Appointment.findById(request.appointmentId);
        if (!appointmentRecord || appointmentRecord.createdBy.toString() !== userId) {
            throw new AppError('Appointment not found or access denied', ERROR_CODES.NOT_FOUND);
        }
        
        const appointment = await AppointmentService.checkOutAppointment(request);
        ResponseUtil.success(res, 'Appointment checked out successfully', appointment);
    }

    /**
     * Get appointment statistics (user-specific)
     * GET /api/appointments/stats
     */
    @TryCatch('Failed to get appointment statistics')
    static async getAppointmentStats(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }
        
        const userId = req.user._id.toString();
        const stats = await AppointmentService.getAppointmentStats(userId);
        ResponseUtil.success(res, 'Appointment statistics retrieved successfully', stats);
    }



    /**
     * Bulk update appointments (user-specific)
     * PUT /api/appointments/bulk-update
     */
    @TryCatch('Failed to bulk update appointments')
    static async bulkUpdateAppointments(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }
        
        const bulkData: IBulkUpdateAppointmentsDTO = req.body;
        const userId = req.user._id.toString();
        
        // Verify all appointments belong to the current user before bulk updating
        const appointments = await Appointment.find({ 
            _id: { $in: bulkData.appointmentIds },
            createdBy: userId 
        });
        
        if (appointments.length !== bulkData.appointmentIds.length) {
            throw new AppError('Some appointments not found or access denied', ERROR_CODES.NOT_FOUND);
        }
        
        const result = await AppointmentService.bulkUpdateAppointments(bulkData);
        ResponseUtil.success(res, 'Appointments updated successfully', result);
    }

    /**
     * Restore appointment from trash (user-specific)
     * PUT /api/appointments/:id/restore
     */
    @TryCatch('Failed to restore appointment')
    static async restoreAppointment(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }
        
        const { id } = req.params;
        const userId = req.user._id.toString();
        
        // Verify the appointment belongs to the current user before restoring
        const appointmentRecord = await Appointment.findById(id);
        if (!appointmentRecord || appointmentRecord.createdBy.toString() !== userId) {
            throw new AppError('Appointment not found or access denied', ERROR_CODES.NOT_FOUND);
        }
        
        const appointment = await AppointmentService.restoreAppointment(id);
        ResponseUtil.success(res, 'Appointment restored successfully', appointment);
    }

    /**
     * Get appointments by employee (user-specific)
     * GET /api/appointments/employee/:employeeId
     */
    @TryCatch('Failed to get appointments by employee')
    static async getAppointmentsByEmployee(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }
        
        const { employeeId } = req.params;
        const userId = req.user._id.toString();
        const query: IGetAppointmentsQuery = { ...req.query, employeeId };
        const result = await AppointmentService.getAllAppointments(query, userId);
        ResponseUtil.success(res, 'Employee appointments retrieved successfully', result);
    }

    /**
     * Get appointments by date range (user-specific)
     * GET /api/appointments/date-range
     */
    @TryCatch('Failed to get appointments by date range')
    static async getAppointmentsByDateRange(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }
        
        const { startDate, endDate } = req.query;
        const userId = req.user._id.toString();

        if (!startDate || !endDate) {
            throw new AppError('Start date and end date are required', ERROR_CODES.BAD_REQUEST);
        }

        const query: IGetAppointmentsQuery = {
            ...req.query,
            startDate: startDate as string,
            endDate: endDate as string
        };
        const result = await AppointmentService.getAllAppointments(query, userId);
        ResponseUtil.success(res, 'Appointments by date range retrieved successfully', result);
    }

    /**
     * Cancel appointment (user-specific)
     * PUT /api/appointments/:id/cancel
     */
    @TryCatch('Failed to cancel appointment')
    static async cancelAppointment(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }
        
        const { id } = req.params;
        const userId = req.user._id.toString();
        
        // Verify the appointment belongs to the current user before cancelling
        const appointmentRecord = await Appointment.findById(id);
        if (!appointmentRecord || appointmentRecord.createdBy.toString() !== userId) {
            throw new AppError('Appointment not found or access denied', ERROR_CODES.NOT_FOUND);
        }
        
        const appointment = await AppointmentService.cancelAppointment(id);
        ResponseUtil.success(res, 'Appointment cancelled successfully', appointment);
    }

    /**
     * Approve appointment (user-specific)
     * PUT /api/appointments/:id/approve
     */
    @TryCatch('Failed to approve appointment')
    static async approveAppointment(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }
        
        const { id } = req.params;
        const userId = req.user._id.toString();
        
        // Verify the appointment belongs to the current user before approving
        const appointmentRecord = await Appointment.findById(id);
        if (!appointmentRecord || appointmentRecord.createdBy.toString() !== userId) {
            throw new AppError('Appointment not found or access denied', ERROR_CODES.NOT_FOUND);
        }
        
        const result = await AppointmentService.approveAppointment(id);
        ResponseUtil.success(res, 'Appointment approved successfully. The visitor has been notified.', result);
    }

    /**
     * Reject appointment (user-specific)
     * PUT /api/appointments/:id/reject
     */
    @TryCatch('Failed to reject appointment')
    static async rejectAppointment(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }
        
        const { id } = req.params;
        const userId = req.user._id.toString();
        
        // Verify the appointment belongs to the current user before rejecting
        const appointmentRecord = await Appointment.findById(id);
        if (!appointmentRecord || appointmentRecord.createdBy.toString() !== userId) {
            throw new AppError('Appointment not found or access denied', ERROR_CODES.NOT_FOUND);
        }
        
        const result = await AppointmentService.rejectAppointment(id);
        ResponseUtil.success(res, 'Appointment rejected. The visitor has been informed.', result);
    }
}
