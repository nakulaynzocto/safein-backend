import { Response, NextFunction } from 'express';
import { SettingsService } from '../../services/settings/settings.service';
import { ResponseUtil } from '../../utils';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { TryCatch } from '../../decorators';

export class SettingsController {
    /**
     * Get user settings
     */
    @TryCatch('Failed to get settings')
    static async getSettings(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        const userId = req.user!._id.toString();
        const settings = await SettingsService.getSettings(userId);
        ResponseUtil.success(res, 'Settings retrieved successfully', settings);
    }

    /**
     * Update user settings
     */
    @TryCatch('Failed to update settings')
    static async updateSettings(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        const userId = req.user!._id.toString();
        const updateData = req.body;
        const settings = await SettingsService.updateSettings(userId, updateData);
        ResponseUtil.success(res, 'Settings updated successfully', settings);
    }
}



