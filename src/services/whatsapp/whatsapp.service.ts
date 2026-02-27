export interface IWhatsAppConfig {
    activeProvider?: 'meta';
    senderNumber?: string;
    testNumber?: string;
    phoneNumberId?: string;
    accessToken?: string;
}

import { decryptToken } from '../../utils/tokenEncryption.util';

/**
 * WhatsApp Service
 * Handles sending WhatsApp messages for appointment notifications via Meta WhatsApp Cloud API
 */
import { SettingsService } from '../settings/settings.service';

export class WhatsAppService {
    private static readonly WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    private static readonly WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';

    private static getCredentials(config?: IWhatsAppConfig) {
        const phoneNumberId = config?.phoneNumberId || this.WHATSAPP_PHONE_NUMBER_ID;
        let accessToken = config?.accessToken || this.WHATSAPP_ACCESS_TOKEN;

        try {
            if (accessToken && accessToken.length > 50) accessToken = decryptToken(accessToken);
        } catch (e) { /* Likely not encrypted */ }

        return { phoneNumberId, accessToken };
    }

    private static formatDate(date: Date | string): string {
        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    /**
     * Send WhatsApp message
     * @param to - Recipient phone number (with country code, e.g., +919876543210)
     * @param message - Message text
     * @param config - Optional configuration (overrides process.env)
     * @returns Promise<boolean> - Success status
     */
    static async sendMessage(to: string, message: string, config?: IWhatsAppConfig): Promise<boolean> {
        try {
            // Format phone number (remove spaces, ensure + prefix)
            const formattedPhone = this.formatPhoneNumber(to);

            if (!formattedPhone) {
                return false;
            }

            const { accessToken, phoneNumberId } = this.getCredentials(config);

            // Use WhatsApp Business API (Meta/Facebook)
            if (accessToken && phoneNumberId) {
                return await this.sendViaWhatsAppBusinessAPI(formattedPhone, message, phoneNumberId, accessToken);
            }

            console.warn('Meta Cloud API not properly configured');
            return false;
        } catch (error: any) {
            console.error('Failed to send WhatsApp message:', error.message);
            throw error;
        }
    }

    /**
     * Send message via WhatsApp Business API (Meta/Facebook) - WhatsApp Cloud API
     */
    private static async sendViaWhatsAppBusinessAPI(to: string, message: string, phoneNumberId: string, accessToken: string): Promise<boolean> {
        try {
            // Remove + from phone number for WhatsApp Cloud API
            const phoneNumber = to.replace('+', '');
            const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: phoneNumber,
                    type: 'text',
                    text: {
                        preview_url: true,
                        body: message
                    }
                })
            });

            if (!response.ok) {
                const errorData: any = await response.json().catch(() => ({}));
                const errorMessage = errorData.error?.message || errorData.message || `HTTP ${response.status}`;
                throw new Error(`WhatsApp Cloud API error: ${errorMessage}`);
            }

            return true;
        } catch (error: any) {
            console.error('WhatsApp Cloud API error:', error.message);
            throw error;
        }
    }

    /**
     * Send a template message via Meta Cloud API
     */
    static async sendTemplateMessage(
        to: string,
        templateName: string,
        parameters: string[],
        config?: IWhatsAppConfig
    ): Promise<boolean> {
        try {
            const formattedPhone = this.formatPhoneNumber(to);
            if (!formattedPhone) return false;

            const { accessToken, phoneNumberId } = this.getCredentials(config);

            if (!accessToken || !phoneNumberId) {
                console.warn('Meta Cloud API not properly configured for template message');
                return false;
            }

            const phoneNumber = formattedPhone.replace('+', '');
            const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to: phoneNumber,
                    type: 'template',
                    template: {
                        name: templateName,
                        language: { code: 'en' },
                        components: [{
                            type: 'body',
                            parameters: parameters.map(p => ({ type: 'text', text: p }))
                        }]
                    }
                })
            });

            if (!response.ok) {
                return false;
            }

            return true;
        } catch (error: any) {
            console.error('Failed to send WhatsApp template message:', error.message);
            return false;
        }
    }

    /**
     * Format phone number to WhatsApp format
     * @param phone - Phone number in any format
     * @returns Formatted phone number with country code (e.g., +919876543210)
     */
    private static formatPhoneNumber(phone: string): string | null {
        if (!phone) return null;

        // Remove all spaces, dashes, and parentheses
        let cleaned = phone.replace(/[\s\-\(\)]/g, '');

        // If doesn't start with +, assume it's Indian number and add +91
        if (!cleaned.startsWith('+')) {
            // If starts with 0, remove it
            if (cleaned.startsWith('0')) {
                cleaned = cleaned.substring(1);
            }
            // If starts with 91 and has 10 more digits, add +
            if (cleaned.startsWith('91') && cleaned.length === 12) {
                cleaned = '+' + cleaned;
            } else if (cleaned.length === 10) {
                // Assume Indian number
                cleaned = '+91' + cleaned;
            } else {
                // Try to add + if it's a valid number
                cleaned = '+' + cleaned;
            }
        }

        // Validate: should start with + and have 10-15 digits after country code
        const phoneRegex = /^\+[1-9]\d{9,14}$/;
        if (!phoneRegex.test(cleaned)) {
            return null;
        }

        return cleaned;
    }

    /**
     * Format 24-hour time string (HH:mm) to 12-hour format with AM/PM
     */
    private static formatTo12Hour(time: string): string {
        if (!time) return '';
        try {
            const [hours, minutes] = time.split(':').map(Number);
            if (isNaN(hours) || isNaN(minutes)) return time;
            const period = hours >= 12 ? 'PM' : 'AM';
            const hours12 = hours % 12 || 12;
            return `${hours12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
        } catch (e) {
            return time;
        }
    }

    /**
     * Send appointment notification with approval links (using visit_notification template)
     */
    static async sendAppointmentNotification(
        employeePhone: string,
        employeeName: string,
        visitorDetails: {
            name: string;
            email: string;
            phone: string;
            _id?: string;
        },
        scheduledDate: Date,
        scheduledTime: string,
        _purpose: string,
        approvalLink: string,
        companyName: string = 'SafeIn',
        config?: IWhatsAppConfig,
        adminId?: string
    ): Promise<boolean> {
        try {
            if (adminId) {
                const enabled = await SettingsService.isCategoryEnabled(adminId, 'appointment', 'whatsapp');
                if (!enabled) return false;
            }
            const formattedDate = this.formatDate(scheduledDate);
            const formattedTime = this.formatTo12Hour(scheduledTime);

            // Template: new_appointment_request
            // Body: Service Alert: Hello {{1}}, an appointment is scheduled with {{2}} for {{3}} at {{4}}. Please use this link to check details: {{5}}. Platform: {{6}} Support.
            return await this.sendTemplateMessage(
                employeePhone,
                'new_appointment_request',
                [employeeName, visitorDetails.name, formattedDate, formattedTime, approvalLink, companyName],
                config
            );
        } catch (error: any) {
            console.error('Failed to send appointment notification via WhatsApp:', error.message);
            return false;
        }
    }

    /**
     * Send appointment status update to visitor
     */
    static async sendAppointmentStatusUpdate(
        visitorPhone: string,
        _visitorName: string,
        employeeName: string,
        scheduledDate: Date,
        scheduledTime: string,
        status: 'approved' | 'rejected',
        companyName: string = 'SafeIn',
        config?: IWhatsAppConfig,
        adminId?: string
    ): Promise<boolean> {
        try {
            if (adminId) {
                const enabled = await SettingsService.isCategoryEnabled(adminId, 'appointment', 'whatsapp');
                if (!enabled) return false;
            }
            const formattedDate = this.formatDate(scheduledDate);
            const formattedTime = this.formatTo12Hour(scheduledTime);

            if (status === 'approved') {
                // Template: booking_confirmation
                // Body: Appointment Confirmed: Your visit at {{1}} with {{2}} is confirmed. Date: {{3}}, Time: {{4}}. Please arrive on time for seamless entry. Regards, Team {{5}} Office.
                return await this.sendTemplateMessage(
                    visitorPhone,
                    'booking_confirmation',
                    [companyName, employeeName, formattedDate, formattedTime, companyName],
                    config
                );
            } else {
                // Template: visit_status_update
                // Body: Visit Update: Your request for {{1}} at {{2}} has been updated as unavailable. Please contact the host for any further coordination. Thank you.
                return await this.sendTemplateMessage(
                    visitorPhone,
                    'visit_status_update',
                    [formattedDate, companyName],
                    config
                );
            }
        } catch (error: any) {
            console.error('Failed to send appointment status update via WhatsApp:', error.message);
            return false;
        }
    }

    /**
     * Send special visitor entry code via WhatsApp
     */
    static async sendSpecialVisitorEntryCode(
        visitorPhone: string,
        _visitorName: string,
        otp: string,
        companyName: string = 'SafeIn',
        config?: IWhatsAppConfig,
        adminId?: string
    ): Promise<boolean> {
        try {
            if (adminId) {
                const enabled = await SettingsService.isCategoryEnabled(adminId, 'visitor', 'whatsapp');
                if (!enabled) return false;
            }
            const today = this.formatDate(new Date());

            // Template: entry_reference
            // Body: Welcome to {{1}}. Your visit reference ID is {{2}}. Please present this at the reception on {{3}}. Thank you.
            return await this.sendTemplateMessage(
                visitorPhone,
                'entry_reference',
                [companyName, otp, today],
                config
            );
        } catch (error: any) {
            console.error('Failed to send special visitor entry code via WhatsApp:', error.message);
            return false;
        }
    }

    /**
     * Send appointment booking link via WhatsApp
     */
    static async sendAppointmentLinkWhatsApp(
        visitorPhone: string,
        employeeName: string,
        bookingUrl: string,
        expiresAt: Date,
        companyName: string = 'SafeIn',
        config?: IWhatsAppConfig,
        adminId?: string
    ): Promise<boolean> {
        try {
            if (adminId) {
                const enabled = await SettingsService.isCategoryEnabled(adminId, 'appointment', 'whatsapp');
                if (!enabled) return false;
            }
            const formattedExpiry = this.formatDate(expiresAt);

            // Template: invitation_update
            // Body: Registration Invite: {{1}} from {{2}} has invited you to complete your registration. Link: {{3}}. This invitation expires on {{4}} precisely.
            return await this.sendTemplateMessage(
                visitorPhone,
                'invitation_update',
                [employeeName, companyName, bookingUrl, formattedExpiry],
                config
            );
        } catch (error: any) {
            console.error('Failed to send appointment link via WhatsApp:', error.message);
            return false;
        }
    }

    /**
     * Send appointment confirmation via WhatsApp (Unified Template call)
     */
    static async sendAppointmentConfirmationWhatsApp(
        recipientPhone: string,
        recipientName: string,
        otherPartyName: string,
        scheduledDate: Date,
        scheduledTime: string,
        _purpose: string,
        isEmployee: boolean = false,
        companyName: string = 'SafeIn',
        config?: IWhatsAppConfig,
        adminId?: string
    ): Promise<boolean> {
        try {
            if (adminId) {
                const enabled = await SettingsService.isCategoryEnabled(adminId, 'appointment', 'whatsapp');
                if (!enabled) return false;
            }
            const formattedDate = this.formatDate(scheduledDate);
            const formattedTime = this.formatTo12Hour(scheduledTime);

            if (isEmployee) {
                // Use new_appointment_request for employee (as a summary)
                return await this.sendTemplateMessage(
                    recipientPhone,
                    'new_appointment_request',
                    [recipientName, otherPartyName, formattedDate, formattedTime, 'N/A', companyName],
                    config
                );
            } else {
                // Use booking_confirmation for visitor
                return await this.sendTemplateMessage(
                    recipientPhone,
                    'booking_confirmation',
                    [companyName, otherPartyName, formattedDate, formattedTime, companyName],
                    config
                );
            }
        } catch (error: any) {
            console.error('Failed to send appointment confirmation via WhatsApp:', error.message);
            return false;
        }
    }

    /**
     * Send OTP/Verification code via template (Utility)
     */
    static async sendOTPVerificationTemplate(
        to: string,
        otp: string,
        companyName: string = 'SafeIn',
        config?: IWhatsAppConfig,
        adminId?: string
    ): Promise<boolean> {
        try {
            if (adminId) {
                const enabled = await SettingsService.isCategoryEnabled(adminId, 'employee', 'whatsapp');
                if (!enabled) return false;
            }
            // Template: system_config_update
            // Body: Account Update: Your registration reference for the setup is {{1}}. Please refer to this ID to complete your profile settings. Regards, Team {{2}} Office.
            return await this.sendTemplateMessage(
                to,
                'system_config_update',
                [otp, companyName],
                config
            );
        } catch (error: any) {
            console.error('Failed to send OTP template:', error.message);
            return false;
        }
    }
}
