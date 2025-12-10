import { Settings } from '../../models/settings/settings.model';
import { IUpdateSettingsDTO, ISettingsResponse } from '../../types/settings/settings.types';
import mongoose from 'mongoose';

export class SettingsService {
    /**
     * Get settings for a user
     */
    static async getSettings(userId: string): Promise<ISettingsResponse> {
        let settings = await Settings.findOne({ userId });

        // Create default settings if not exists
        if (!settings) {
            settings = await Settings.create({
                userId: new mongoose.Types.ObjectId(userId),
                notifications: {
                    emailEnabled: true,
                    whatsappEnabled: true,
                    smsEnabled: false
                },
                whatsapp: {
                    senderNumber: ''
                }
            });
        }

        return settings.toObject() as unknown as ISettingsResponse;
    }

    /**
     * Update settings for a user
     */
    static async updateSettings(userId: string, updateData: IUpdateSettingsDTO): Promise<ISettingsResponse> {
        let settings = await Settings.findOne({ userId });

        if (!settings) {
            // Create new settings if not exists
            settings = await Settings.create({
                userId: new mongoose.Types.ObjectId(userId),
                notifications: {
                    emailEnabled: updateData.notifications?.emailEnabled ?? true,
                    whatsappEnabled: updateData.notifications?.whatsappEnabled ?? true,
                    smsEnabled: updateData.notifications?.smsEnabled ?? false
                },
                whatsapp: {
                    senderNumber: updateData.whatsapp?.senderNumber || ''
                }
            });
        } else {
            // Update existing settings
            if (updateData.notifications) {
                if (updateData.notifications.emailEnabled !== undefined) {
                    settings.notifications.emailEnabled = updateData.notifications.emailEnabled;
                }
                if (updateData.notifications.whatsappEnabled !== undefined) {
                    settings.notifications.whatsappEnabled = updateData.notifications.whatsappEnabled;
                }
                if (updateData.notifications.smsEnabled !== undefined) {
                    settings.notifications.smsEnabled = updateData.notifications.smsEnabled;
                }
            }

            if (updateData.whatsapp) {
                if (updateData.whatsapp.senderNumber !== undefined) {
                    settings.whatsapp.senderNumber = updateData.whatsapp.senderNumber;
                }
            }

            await settings.save();
        }

        return settings.toObject() as unknown as ISettingsResponse;
    }

    /**
     * Check if email notifications are enabled for a user
     */
    static async isEmailEnabled(userId: string): Promise<boolean> {
        const settings = await Settings.findOne({ userId });
        return settings?.notifications.emailEnabled ?? true; // Default to true
    }

    /**
     * Check if WhatsApp notifications are enabled for a user
     */
    static async isWhatsAppEnabled(userId: string): Promise<boolean> {
        const settings = await Settings.findOne({ userId });
        return settings?.notifications.whatsappEnabled ?? true; // Default to true
    }

    /**
     * Check if SMS notifications are enabled for a user
     */
    static async isSmsEnabled(userId: string): Promise<boolean> {
        const settings = await Settings.findOne({ userId });
        return settings?.notifications.smsEnabled ?? false; // Default to false
    }

}



