import { Request, Response, NextFunction } from 'express';
import { ApprovalLinkService } from '../../services/approvalLink/approvalLink.service';
import { ResponseUtil } from '../../utils';
import { ERROR_CODES } from '../../utils/constants';
import { TryCatch } from '../../decorators';
import { AppError } from '../../middlewares/errorHandler';

export class ApprovalLinkController {
    /**
     * Verify token and get appointment details
     * GET /api/v1/verify/:token
     */
    @TryCatch('Failed to verify token')
    static async verifyToken(req: Request, res: Response, _next: NextFunction): Promise<void> {
        const { token } = req.params;

        if (!token) {
            throw new AppError('Token is required', ERROR_CODES.BAD_REQUEST);
        }

        const result = await ApprovalLinkService.verifyToken(token);

        if (!result.isValid) {
            ResponseUtil.error(res, 'Invalid or expired link', ERROR_CODES.NOT_FOUND);
            return;
        }

        if (result.isUsed) {
            ResponseUtil.error(res, 'Link expired or already used', ERROR_CODES.BAD_REQUEST);
            return;
        }

        ResponseUtil.success(res, 'Token verified successfully', {
            isValid: true,
            appointment: result.appointment
        });
    }

    /**
     * Update appointment status via token
     * POST /api/v1/update-status
     */
    @TryCatch('Failed to update appointment status')
    static async updateStatus(req: Request, res: Response, _next: NextFunction): Promise<void> {
        const { token, status } = req.body;

        if (!token) {
            throw new AppError('Token is required', ERROR_CODES.BAD_REQUEST);
        }

        if (!status || (status !== 'approved' && status !== 'rejected')) {
            throw new AppError('Status must be either "approved" or "rejected"', ERROR_CODES.BAD_REQUEST);
        }

        const result = await ApprovalLinkService.updateStatusViaToken(token, status);

        ResponseUtil.success(
            res,
            `Appointment ${status} successfully`,
            result.appointment,
            ERROR_CODES.OK
        );
    }
}




