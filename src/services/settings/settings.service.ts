import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import { Settings } from '../../models/settings/settings.model';
import { IUpdateSettingsDTO, ISettingsResponse } from '../../types/settings/settings.types';
import { User } from '../../models/user/user.model';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { encryptToken, decryptToken } from '../../utils/tokenEncryption.util';

// ─── Constants ────────────────────────────────────────────────────────────────

const OTP_EXPIRY_MINUTES = 10;
const MASKED = '••••••••';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Masks all sensitive credential fields before sending to the client. */
function maskSettingsResponse(settings: any): ISettingsResponse {
    const response = settings as unknown as ISettingsResponse;
    if (response.whatsapp?.accessToken) response.whatsapp.accessToken = MASKED;
    if (response.smtp?.pass) response.smtp.pass = MASKED;
    return response;
}

/** Default settings document for brand new users. */
function buildDefaultSettings(userId: string, overrides: Partial<IUpdateSettingsDTO> = {}) {
    return {
        userId: new mongoose.Types.ObjectId(userId),
        notifications: {
            emailEnabled: overrides.notifications?.emailEnabled ?? true,
            whatsappEnabled: overrides.notifications?.whatsappEnabled ?? true,
            smsEnabled: overrides.notifications?.smsEnabled ?? false,
            visitor: {
                email: overrides.notifications?.visitor?.email ?? true,
                whatsapp: overrides.notifications?.visitor?.whatsapp ?? true,
            },
            employee: {
                email: overrides.notifications?.employee?.email ?? true,
                whatsapp: overrides.notifications?.employee?.whatsapp ?? true,
            },
            appointment: {
                email: overrides.notifications?.appointment?.email ?? true,
                whatsapp: overrides.notifications?.appointment?.whatsapp ?? true,
            },
        },
        whatsapp: {
            activeProvider: 'meta',
            senderNumber: overrides.whatsapp?.senderNumber || '',
            testNumber: overrides.whatsapp?.testNumber || '',
            verified: false,
        },
    };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class SettingsService {

    // ── Read ──────────────────────────────────────────────────────────────────

    static async getSettings(userId: string): Promise<ISettingsResponse> {
        let settings = await Settings.findOne({ userId });

        if (!settings) {
            settings = await Settings.create(buildDefaultSettings(userId));
            return maskSettingsResponse(settings.toObject());
        }

        const ws = settings.whatsapp;
        let needsSave = false;

        // Sync verification flags (handles legacy data)
        if (ws.verified) {
            if (!ws.metaVerified) { ws.metaVerified = true; needsSave = true; }
        } else if (ws.metaVerified) {
            ws.verified = true;
            needsSave = true;
        }

        if (needsSave) {
            settings.markModified('whatsapp');
            settings.markModified('pendingWhatsapp');
            await settings.save();
        }

        return maskSettingsResponse(settings.toObject());
    }

    static async getWhatsAppConfig(userId: string) {
        const settings = await Settings.findOne({ userId }, { whatsapp: 1 });
        return settings?.whatsapp;
    }

    // ── Notification Flag Helpers ──────────────────────────────────────────────

    static async isEmailEnabled(userId: string): Promise<boolean> {
        const settings = await Settings.findOne({ userId }, { 'notifications.emailEnabled': 1 });
        return settings?.notifications.emailEnabled ?? true;
    }

    static async isWhatsAppEnabled(userId: string): Promise<boolean> {
        const settings = await Settings.findOne({ userId }, { 'notifications.whatsappEnabled': 1 });
        return settings?.notifications.whatsappEnabled ?? true;
    }

    static async isSmsEnabled(userId: string): Promise<boolean> {
        const settings = await Settings.findOne({ userId }, { 'notifications.smsEnabled': 1 });
        return settings?.notifications.smsEnabled ?? false;
    }

    static async isCategoryEnabled(userId: string, category: 'visitor' | 'employee' | 'appointment', type: 'email' | 'whatsapp'): Promise<boolean> {
        const settings = await Settings.findOne({ userId }, { [`notifications.${category}.${type}`]: 1, [`notifications.${type}Enabled`]: 1 });
        if (!settings) return true;
        
        const masterEnabled = (settings.notifications as any)[`${type}Enabled`] ?? true;
        const categoryEnabled = ((settings.notifications as any)[category] as any)?.[type] ?? true;
        
        return masterEnabled && categoryEnabled;
    }

    static async getNotificationSettings(userId: string) {
        const settings = await Settings.findOne({ userId }, { notifications: 1, whatsapp: 1 }).lean();
        return {
            emailEnabled: settings?.notifications?.emailEnabled ?? true,
            whatsappEnabled: settings?.notifications?.whatsappEnabled ?? true,
            smsEnabled: settings?.notifications?.smsEnabled ?? false,
            visitor: settings?.notifications?.visitor || { email: true, whatsapp: true },
            employee: settings?.notifications?.employee || { email: true, whatsapp: true },
            appointment: settings?.notifications?.appointment || { email: true, whatsapp: true },
            whatsappConfig: settings?.whatsapp
        };
    }

    // ── Write / Update ─────────────────────────────────────────────────────────

    static async updateSettings(userId: string, updateData: IUpdateSettingsDTO): Promise<ISettingsResponse> {
        let settings = await Settings.findOne({ userId });

        if (!settings) {
            settings = await Settings.create(buildDefaultSettings(userId, updateData));
            return maskSettingsResponse(settings.toObject());
        }

        // Update notification flags
        if (updateData.notifications) {
            const { emailEnabled, whatsappEnabled, smsEnabled, visitor, employee, appointment } = updateData.notifications;
            
            if (emailEnabled !== undefined) settings.notifications.emailEnabled = emailEnabled;
            if (whatsappEnabled !== undefined) settings.notifications.whatsappEnabled = whatsappEnabled;
            if (smsEnabled !== undefined) settings.notifications.smsEnabled = smsEnabled;
            
            if (visitor) {
                if (visitor.email !== undefined) settings.notifications.visitor.email = visitor.email;
                if (visitor.whatsapp !== undefined) settings.notifications.visitor.whatsapp = visitor.whatsapp;
                settings.markModified('notifications.visitor');
            }
            
            if (employee) {
                if (employee.email !== undefined) settings.notifications.employee.email = employee.email;
                if (employee.whatsapp !== undefined) settings.notifications.employee.whatsapp = employee.whatsapp;
                settings.markModified('notifications.employee');
            }
            
            if (appointment) {
                if (appointment.email !== undefined) settings.notifications.appointment.email = appointment.email;
                if (appointment.whatsapp !== undefined) settings.notifications.appointment.whatsapp = appointment.whatsapp;
                settings.markModified('notifications.appointment');
            }
            
            settings.markModified('notifications');
        }

        // Update WhatsApp config (safe fields only — credentials require OTP verification)
        if (updateData.whatsapp) {
            const ws = settings.whatsapp;
            const { senderNumber, testNumber } = updateData.whatsapp;

            if (senderNumber !== undefined) ws.senderNumber = senderNumber;
            if (testNumber !== undefined) ws.testNumber = testNumber;

            // Sync the top-level verified flag
            ws.verified = !!ws.metaVerified;

            settings.markModified('whatsapp');
        }

        await settings.save();
        return maskSettingsResponse(settings.toObject());
    }

    // ── WhatsApp Verification Flow ─────────────────────────────────────────────

    /**
     * Step 1: Send a verification OTP via the provided WhatsApp config.
     * Stores the OTP + pending (unverified) config in settings.
     */
    static async sendVerificationOTP(userId: string, whatsappConfig: any): Promise<void> {
        const user = await User.findById(userId, { mobileNumber: 1 });
        const recipientNumber = whatsappConfig.testNumber || user?.mobileNumber;

        if (!recipientNumber) {
            throw new Error('Recipient number not found. Please provide a test number or update your profile.');
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
        const message = `Your WhatsApp verification code is: *${otp}*. It expires in ${OTP_EXPIRY_MINUTES} minutes.`;

        // Always force meta for verification
        const config = { ...whatsappConfig, activeProvider: 'meta' };

        const sent = await WhatsAppService.sendMessage(recipientNumber, message, config);
        if (!sent) throw new Error('Failed to send verification code. Please check your API credentials.');

        await Settings.findOneAndUpdate(
            { userId },
            {
                $set: {
                    'whatsapp.verificationOtp': otp,
                    'whatsapp.verificationOtpExpiry': expiry,
                    'whatsapp.verified': false,
                    pendingWhatsapp: config,
                },
            },
            { upsert: true }
        );
    }

    /**
     * Step 2: Confirm WhatsApp OTP and persist the verified config.
     */
    static async verifyWhatsAppOTP(userId: string, otp: string): Promise<ISettingsResponse> {
        const settings = await Settings.findOne({ userId });

        if (!settings?.whatsapp.verificationOtp) {
            throw new Error('No verification in progress. Please initiate verification first.');
        }
        if (settings.whatsapp.verificationOtp !== otp) {
            throw new Error('Invalid verification code. Please try again.');
        }
        if (settings.whatsapp.verificationOtpExpiry && settings.whatsapp.verificationOtpExpiry < new Date()) {
            throw new Error('Verification code has expired. Please request a new one.');
        }

        // Promote pending config → main config
        if (settings.pendingWhatsapp) {
            settings.whatsapp.activeProvider = 'meta';
            settings.whatsapp.senderNumber = settings.pendingWhatsapp.senderNumber || settings.whatsapp.senderNumber;
            settings.whatsapp.testNumber = settings.pendingWhatsapp.testNumber || settings.whatsapp.testNumber;

            settings.whatsapp.phoneNumberId = settings.pendingWhatsapp.phoneNumberId;
            settings.whatsapp.accessToken = encryptToken(settings.pendingWhatsapp.accessToken!);
            settings.whatsapp.metaVerified = true;
            settings.whatsapp.verified = true;
        }

        // Clear OTP state
        settings.whatsapp.verifiedAt = new Date();
        settings.whatsapp.verificationOtp = null;
        settings.whatsapp.verificationOtpExpiry = null;
        settings.pendingWhatsapp = null;

        settings.markModified('whatsapp');
        settings.markModified('pendingWhatsapp');
        await settings.save();

        return maskSettingsResponse(settings.toObject() as any);
    }

    // ── SMTP Configuration ─────────────────────────────────────────────────────

    /**
     * Save and verify custom SMTP credentials.
     * Sends a test email to the authenticated user's address.
     * Encrypts the password before persisting.
     */
    static async saveSMTPConfig(userId: string, smtpConfig: {
        host: string;
        port: number;
        secure: boolean;
        user: string;
        pass: string;
        fromName: string;
        fromEmail: string;
    }): Promise<ISettingsResponse> {
        const user = await User.findById(userId, { email: 1 });
        if (!user?.email) throw new Error('User email not found.');

        // 1. Verify the credentials by actually connecting via nodemailer
        const transporter = nodemailer.createTransport({
            host: smtpConfig.host,
            port: smtpConfig.port,
            secure: smtpConfig.secure,
            auth: { user: smtpConfig.user, pass: smtpConfig.pass },
            connectionTimeout: 15000,
            socketTimeout: 15000,
        } as any);

        try {
            await transporter.verify();
        } catch (err: any) {
            throw new Error(`SMTP connection failed: ${err.message || 'Invalid credentials or unreachable host.'}`);
        }

        // 2. Send a test email to confirm delivery works
        await transporter.sendMail({
            from: `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`,
            to: user.email,
            subject: 'SMTP Configuration Verified ✓',
            html: `
                <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
                    <h2 style="color:#10b981;">✓ SMTP Configuration Verified</h2>
                    <p>Your custom SMTP server has been successfully configured and verified.</p>
                    <p style="color:#6b7280;font-size:14px;">Host: <strong>${smtpConfig.host}:${smtpConfig.port}</strong></p>
                    <p style="color:#6b7280;font-size:14px;">Sent from: <strong>${smtpConfig.fromEmail}</strong></p>
                </div>`,
        });

        // 3. Encrypt password and persist
        const encryptedPass = encryptToken(smtpConfig.pass);

        const settings = await Settings.findOneAndUpdate(
            { userId },
            {
                $set: {
                    'smtp.host': smtpConfig.host,
                    'smtp.port': smtpConfig.port,
                    'smtp.secure': smtpConfig.secure,
                    'smtp.user': smtpConfig.user,
                    'smtp.pass': encryptedPass,
                    'smtp.fromName': smtpConfig.fromName,
                    'smtp.fromEmail': smtpConfig.fromEmail,
                    'smtp.verified': true,
                    'smtp.verifiedAt': new Date(),
                },
            },
            { upsert: true, new: true }
        );

        return maskSettingsResponse(settings!.toObject() as any);
    }

    /**
     * Remove the saved SMTP config and reset to system defaults.
     */
    static async removeSMTPConfig(userId: string): Promise<ISettingsResponse> {
        const settings = await Settings.findOneAndUpdate(
            { userId },
            {
                $set: {
                    'smtp.host': '',
                    'smtp.port': 587,
                    'smtp.secure': false,
                    'smtp.user': '',
                    'smtp.pass': '',
                    'smtp.fromName': '',
                    'smtp.fromEmail': '',
                    'smtp.verified': false,
                    'smtp.verifiedAt': null,
                },
            },
            { new: true }
        );

        if (!settings) throw new Error('Settings not found.');
        return maskSettingsResponse(settings.toObject() as any);
    }

    /**
     * Get decrypted SMTP config for internal use (e.g. EmailService).
     */
    static async getDecryptedSMTPConfig(userId: string) {
        const settings = await Settings.findOne({ userId }, { smtp: 1 });
        if (!settings?.smtp?.verified) return null;

        let pass = settings.smtp.pass || '';
        try { pass = decryptToken(pass); } catch { /* not encrypted, use as-is */ }

        return { ...settings.smtp, pass };
    }
}
