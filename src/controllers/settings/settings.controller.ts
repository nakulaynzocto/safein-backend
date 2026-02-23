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

    /**
     * Initiate WhatsApp verification
     */
    @TryCatch('Failed to initiate verification')
    static async initiateWhatsAppVerification(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        const userId = req.user!._id.toString();
        const whatsappConfig = req.body;
        await SettingsService.sendVerificationOTP(userId, whatsappConfig);
        ResponseUtil.success(res, 'Verification code sent to your WhatsApp number');
    }

    /**
     * Verify WhatsApp OTP
     */
    @TryCatch('Verification failed')
    static async verifyWhatsAppOTP(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        const userId = req.user!._id.toString();
        const { otp } = req.body;
        const settings = await SettingsService.verifyWhatsAppOTP(userId, otp);
        ResponseUtil.success(res, 'WhatsApp configuration verified and saved successfully', settings);
    }

    /**
     * Save & verify custom SMTP configuration
     */
    @TryCatch('Failed to save SMTP configuration')
    static async saveSMTPConfig(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        const userId = req.user!._id.toString();
        const settings = await SettingsService.saveSMTPConfig(userId, req.body);
        ResponseUtil.success(res, 'SMTP configuration verified and saved successfully', settings);
    }

    /**
     * Remove custom SMTP configuration (revert to system defaults)
     */
    @TryCatch('Failed to remove SMTP configuration')
    static async removeSMTPConfig(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        const userId = req.user!._id.toString();
        const settings = await SettingsService.removeSMTPConfig(userId);
        ResponseUtil.success(res, 'SMTP configuration removed. System defaults will be used.', settings);
    }
}



