import { Response, NextFunction } from 'express';
import { VisitorService } from '../../services/visitor/visitor.service';
import { Visitor } from '../../models/visitor/visitor.model';
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
     * Get all visitors with pagination and filtering (user-specific)
     * GET /api/visitors
     */
    @TryCatch('Failed to get visitors')
    static async getAllVisitors(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }
        
        const query: IGetVisitorsQuery = req.query;
        const userId = req.user._id.toString();
        const result = await VisitorService.getAllVisitors(query, userId);
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
        
        // Get visitor and verify it belongs to the current user
        const visitor = await VisitorService.getVisitorById(id);
        
        // Additional check: verify the visitor was created by the current user
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
        
        // Verify the visitor belongs to the current user before updating
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
     * Get trashed visitors (user-specific)
     * GET /api/visitors/trashed
     */
    @TryCatch('Failed to get trashed visitors')
    static async getTrashedVisitors(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }
        
        const query: IGetVisitorsQuery = req.query;
        const userId = req.user._id.toString();
        const result = await VisitorService.getTrashedVisitors(query, userId);
        ResponseUtil.success(res, 'Trashed visitors retrieved successfully', result);
    }

    /**
     * Restore visitor from trash (user-specific)
     * PUT /api/visitors/:id/restore
     */
    @TryCatch('Failed to restore visitor')
    static async restoreVisitor(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }
        
        const { id } = req.params;
        const userId = req.user._id.toString();
        
        // Verify the visitor belongs to the current user before restoring
        const visitorRecord = await Visitor.findById(id);
        if (!visitorRecord || visitorRecord.createdBy.toString() !== userId) {
            throw new AppError('Visitor not found or access denied', ERROR_CODES.NOT_FOUND);
        }
        
        const visitor = await VisitorService.restoreVisitor(id);
        ResponseUtil.success(res, 'Visitor restored successfully', visitor);
    }

    /**
     * Bulk update visitors (user-specific)
     * PUT /api/visitors/bulk-update
     */
    @TryCatch('Failed to bulk update visitors')
    static async bulkUpdateVisitors(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }
        
        const bulkData: IBulkUpdateVisitorsDTO = req.body;
        const userId = req.user._id.toString();
        
        // Verify all visitors belong to the current user before bulk updating
        const visitors = await Visitor.find({ 
            _id: { $in: bulkData.visitorIds },
            createdBy: userId 
        });
        
        if (visitors.length !== bulkData.visitorIds.length) {
            throw new AppError('Some visitors not found or access denied', ERROR_CODES.NOT_FOUND);
        }
        
        const result = await VisitorService.bulkUpdateVisitors(bulkData);
        ResponseUtil.success(res, 'Visitors updated successfully', result);
    }

    /**
     * Search visitors by phone or email (user-specific)
     * POST /api/visitors/search
     */
    @TryCatch('Failed to search visitors')
    static async searchVisitors(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }
        
        const searchQuery: IVisitorSearchQuery = req.body;
        const userId = req.user._id.toString();
        const result = await VisitorService.searchVisitors(searchQuery, userId);
        ResponseUtil.success(res, result.message, result);
    }

    /**
     * Get visitor statistics (user-specific)
     * GET /api/visitors/stats
     */
    @TryCatch('Failed to get visitor statistics')
    static async getVisitorStats(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }
        
        const userId = req.user._id.toString();
        const stats = await VisitorService.getVisitorStats(userId);
        ResponseUtil.success(res, 'Visitor statistics retrieved successfully', stats);
    }
}
