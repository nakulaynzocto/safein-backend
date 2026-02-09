import { Response, NextFunction } from 'express';
import { SpotPassService } from '../../services/spotPass/spotPass.service';
import { ResponseUtil } from '../../utils';
import {
    ICreateSpotPassDTO,
    IGetSpotPassesQuery
} from '../../types/spotPass/spotPass.types';
import { ERROR_CODES } from '../../utils/constants';
import { TryCatch } from '../../decorators';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/errorHandler';
import { EmployeeUtil } from '../../utils/employee.util';
import { SpotPass } from '../../models/spotPass/spotPass.model';

export class SpotPassController {
    /**
     * Create a new spot pass
     * POST /api/spot-passes
     */
    @TryCatch('Failed to create spot pass')
    static async createSpotPass(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }
        const data: ICreateSpotPassDTO = req.body;
        const createdBy = req.user._id.toString();

        const spotPass = await SpotPassService.createSpotPass(data, createdBy);
        ResponseUtil.success(res, 'Spot pass created successfully', spotPass, ERROR_CODES.CREATED);
    }

    /**
     * Get all spot passes
     * GET /api/spot-passes
     */
    @TryCatch('Failed to get spot passes')
    static async getAllSpotPasses(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }

        const query: IGetSpotPassesQuery = req.query;
        const userId = req.user._id.toString();

        const result = await SpotPassService.getAllSpotPasses(query, userId);
        ResponseUtil.success(res, 'Spot passes retrieved successfully', result);
    }

    /**
     * Check out a spot pass
     * PATCH /api/spot-passes/:id/checkout
     */
    @TryCatch('Failed to check out spot pass')
    static async checkOutPass(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }

        const { id } = req.params;
        const userId = req.user._id.toString();
        const adminId = await EmployeeUtil.getAdminId(userId);

        const pass = await SpotPass.findById(id);
        if (!pass || pass.businessId.toString() !== adminId) {
            throw new AppError('Spot pass not found or access denied', ERROR_CODES.NOT_FOUND);
        }

        const updatedPass = await SpotPassService.checkOutPass(id);
        ResponseUtil.success(res, 'Visitor checked out successfully', updatedPass);
    }

    /**
     * Delete a spot pass
     * DELETE /api/spot-passes/:id
     */
    @TryCatch('Failed to delete spot pass')
    static async deletePass(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }

        const { id } = req.params;
        const userId = req.user._id.toString();
        const adminId = await EmployeeUtil.getAdminId(userId);

        const pass = await SpotPass.findById(id);
        if (!pass || pass.businessId.toString() !== adminId) {
            throw new AppError('Spot pass not found or access denied', ERROR_CODES.NOT_FOUND);
        }

        await SpotPassService.deletePass(id, userId);
        ResponseUtil.success(res, 'Spot pass deleted successfully');
    }
}
