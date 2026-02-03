import { Response, NextFunction } from 'express';
import { VisitorService } from '../../services/visitor/visitor.service';
import { Visitor } from '../../models/visitor/visitor.model';
import { ResponseUtil } from '../../utils';
import {
    ICreateVisitorDTO,
    IUpdateVisitorDTO,
    IGetVisitorsQuery
} from '../../types/visitor/visitor.types';
import { ERROR_CODES } from '../../utils/constants';
import { TryCatch } from '../../decorators';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/errorHandler';
import { EmployeeUtil } from '../../utils/employee.util';

export class VisitorController {
    /**
     * Create a new visitor
     * POST /api/visitors
     */
    @TryCatch('Failed to create visitor')
    static async createVisitor(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }
        const visitorData: ICreateVisitorDTO = req.body;
        const createdBy = req.user._id.toString();
        const visitor = await VisitorService.createVisitor(visitorData, createdBy);
        ResponseUtil.success(res, 'Visitor created successfully', visitor, ERROR_CODES.CREATED);
    }

    /**
     * Get all visitors with pagination and filtering (user-specific)
     * GET /api/visitors
     * - Admin: sees ALL visitors
     * - Employee: sees only visitors they created (if any)
     */
    @TryCatch('Failed to get visitors')
    static async getAllVisitors(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }

        const query: IGetVisitorsQuery = req.query;
        const userId = req.user._id.toString();
        
        // Check if user is an employee
        const isEmployee = await EmployeeUtil.isEmployee(req.user);
        
        // For admin: pass undefined userId to show all visitors
        // For employee: pass userId to show only visitors they created
        const result = await VisitorService.getAllVisitors(query, isEmployee ? userId : undefined);
        ResponseUtil.success(res, 'Visitors retrieved successfully', result);
    }

    /**
     * Get visitor by ID (user-specific)
     * GET /api/visitors/:id
     */
    @TryCatch('Failed to get visitor')
    static async getVisitorById(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }

        const { id } = req.params;
        const userId = req.user._id.toString();

        const visitor = await VisitorService.getVisitorById(id);

        const visitorRecord = await Visitor.findById(id);
        if (!visitorRecord || visitorRecord.createdBy.toString() !== userId) {
            throw new AppError('Visitor not found or access denied', ERROR_CODES.NOT_FOUND);
        }

        ResponseUtil.success(res, 'Visitor retrieved successfully', visitor);
    }

    /**
     * Update visitor (user-specific)
     * PUT /api/visitors/:id
     */
    @TryCatch('Failed to update visitor')
    static async updateVisitor(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }

        const { id } = req.params;
        const updateData: IUpdateVisitorDTO = req.body;
        const userId = req.user._id.toString();

        const visitorRecord = await Visitor.findById(id);
        if (!visitorRecord || visitorRecord.createdBy.toString() !== userId) {
            throw new AppError('Visitor not found or access denied', ERROR_CODES.NOT_FOUND);
        }

        const visitor = await VisitorService.updateVisitor(id, updateData);
        ResponseUtil.success(res, 'Visitor updated successfully', visitor);
    }

    /**
     * Soft delete visitor
     * DELETE /api/visitors/:id
     */
    @TryCatch('Failed to delete visitor')
    static async deleteVisitor(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }
        const { id } = req.params;
        const deletedBy = req.user._id.toString();
        await VisitorService.deleteVisitor(id, deletedBy);
        ResponseUtil.success(res, 'Visitor deleted successfully');
    }

    /**
     * Check if visitor has appointments
     * GET /api/visitors/:id/has-appointments
     */
    @TryCatch('Failed to check visitor appointments')
    static async hasAppointments(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }

        const { id } = req.params;
        const result = await VisitorService.hasAppointments(id);
        ResponseUtil.success(res, 'Appointment check completed', result);
    }






}
