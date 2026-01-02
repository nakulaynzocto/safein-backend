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
    static async updateAppointment(req: Request, res: Response, _next: NextFunction): Promise<void> {
        const { id } = req.params;
        const updateData: IUpdateAppointmentDTO = req.body;
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
    static async checkOutAppointment(req: Request, res: Response, _next: NextFunction): Promise<void> {
        const request: ICheckOutRequest = req.body;
        const appointment = await AppointmentService.checkOutAppointment(request);
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
    static async approveAppointment(req: Request, res: Response, _next: NextFunction): Promise<void> {
        const { id } = req.params;
        const result = await AppointmentService.approveAppointment(id);
        ResponseUtil.success(res, 'Appointment approved successfully. The visitor has been notified.', result);
    }

    /**
     * Reject appointment
     * PUT /api/appointments/:id/reject
     */
    @TryCatch('Failed to reject appointment')
    static async rejectAppointment(req: Request, res: Response, _next: NextFunction): Promise<void> {
        const { id } = req.params;
        const result = await AppointmentService.rejectAppointment(id);
        ResponseUtil.success(res, 'Appointment rejected. The visitor has been informed.', result);
    }
}
