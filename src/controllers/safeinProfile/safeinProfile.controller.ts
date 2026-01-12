import { Request, Response } from 'express';
import { SafeinProfileService } from '../../services/safeinProfile/safeinProfile.service';

export class SafeinProfileController {
    /**
     * Get SafeIn profile
     */
    static async getSafeinProfile(_req: Request, res: Response) {
        try {
            const profile = await SafeinProfileService.getSafeinProfile();

            res.status(200).json({
                success: true,
                data: profile,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get SafeIn profile',
            });
        }
    }

    /**
     * Update SafeIn profile
     */
    static async updateSafeinProfile(req: Request, res: Response) {
        try {
            const updateData = req.body;
            const profile = await SafeinProfileService.updateSafeinProfile(updateData);

            res.status(200).json({
                success: true,
                message: 'SafeIn profile updated successfully',
                data: profile,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to update SafeIn profile',
            });
        }
    }
}
