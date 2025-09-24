import { Request, Response, NextFunction } from 'express';
import { VisitorService } from '../../services/visitor/visitor.service';
import { ResponseUtil } from '../../utils';
import {
    ICreateVisitorDTO,
    IUpdateVisitorDTO,
    IGetVisitorsQuery,
    IBulkUpdateVisitorsDTO,
    IVisitorSearchQuery
} from '../../types/visitor/visitor.types';
import { ERROR_CODES } from '../../utils/constants';
import { TryCatch } from '../../decorators';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/errorHandler';

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
     * Get all visitors with pagination and filtering
     * GET /api/visitors
     */
    @TryCatch('Failed to get visitors')
    static async getAllVisitors(req: Request, res: Response, _next: NextFunction): Promise<void> {
        const query: IGetVisitorsQuery = req.query;
        const result = await VisitorService.getAllVisitors(query);
        ResponseUtil.success(res, 'Visitors retrieved successfully', result);
    }

    /**
     * Get visitor by ID
     * GET /api/visitors/:id
     */
    @TryCatch('Failed to get visitor')
    static async getVisitorById(req: Request, res: Response, _next: NextFunction): Promise<void> {
        const { id } = req.params;
        const visitor = await VisitorService.getVisitorById(id);
        ResponseUtil.success(res, 'Visitor retrieved successfully', visitor);
    }

    /**
     * Update visitor
     * PUT /api/visitors/:id
     */
    @TryCatch('Failed to update visitor')
    static async updateVisitor(req: Request, res: Response, _next: NextFunction): Promise<void> {
        const { id } = req.params;
        const updateData: IUpdateVisitorDTO = req.body;
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
     * Get trashed visitors
     * GET /api/visitors/trashed
     */
    @TryCatch('Failed to get trashed visitors')
    static async getTrashedVisitors(req: Request, res: Response, _next: NextFunction): Promise<void> {
        const query: IGetVisitorsQuery = req.query;
        const result = await VisitorService.getTrashedVisitors(query);
        ResponseUtil.success(res, 'Trashed visitors retrieved successfully', result);
    }

    /**
     * Restore visitor from trash
     * PUT /api/visitors/:id/restore
     */
    @TryCatch('Failed to restore visitor')
    static async restoreVisitor(req: Request, res: Response, _next: NextFunction): Promise<void> {
        const { id } = req.params;
        const visitor = await VisitorService.restoreVisitor(id);
        ResponseUtil.success(res, 'Visitor restored successfully', visitor);
    }

    /**
     * Bulk update visitors
     * PUT /api/visitors/bulk-update
     */
    @TryCatch('Failed to bulk update visitors')
    static async bulkUpdateVisitors(req: Request, res: Response, _next: NextFunction): Promise<void> {
        const bulkData: IBulkUpdateVisitorsDTO = req.body;
        const result = await VisitorService.bulkUpdateVisitors(bulkData);
        ResponseUtil.success(res, 'Visitors updated successfully', result);
    }

    /**
     * Search visitors by phone or email
     * POST /api/visitors/search
     */
    @TryCatch('Failed to search visitors')
    static async searchVisitors(req: Request, res: Response, _next: NextFunction): Promise<void> {
        const searchQuery: IVisitorSearchQuery = req.body;
        const result = await VisitorService.searchVisitors(searchQuery);
        ResponseUtil.success(res, result.message, result);
    }

    /**
     * Get visitor statistics
     * GET /api/visitors/stats
     */
    @TryCatch('Failed to get visitor statistics')
    static async getVisitorStats(_req: Request, res: Response, _next: NextFunction): Promise<void> {
        const stats = await VisitorService.getVisitorStats();
        ResponseUtil.success(res, 'Visitor statistics retrieved successfully', stats);
    }
}
