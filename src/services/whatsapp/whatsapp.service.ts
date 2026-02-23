export interface IWhatsAppConfig {
    activeProvider?: 'meta' | 'custom';
    senderNumber?: string;
    testNumber?: string;
    apiUrl?: string;
    apiKey?: string;
    phoneNumberId?: string;
    accessToken?: string;
}

import { decryptToken } from '../../utils/tokenEncryption.util';

/**
 * WhatsApp Service
 * Handles sending WhatsApp messages for appointment notifications
 */
export class WhatsAppService {
    private static readonly WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || '';
    private static readonly WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY || '';
    private static readonly WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    private static readonly WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';
    private static readonly DEFAULT_PROVIDER = (process.env.WHATSAPP_PROVIDER as 'meta' | 'custom') || 'meta';

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

            const activeProvider = config?.activeProvider || this.DEFAULT_PROVIDER;
            const apiUrl = config?.apiUrl || this.WHATSAPP_API_URL;
            let apiKey = config?.apiKey || this.WHATSAPP_API_KEY;
            const phoneNumberId = config?.phoneNumberId || this.WHATSAPP_PHONE_NUMBER_ID;
            let accessToken = config?.accessToken || this.WHATSAPP_ACCESS_TOKEN;
            const senderNumber = config?.senderNumber || '';

            // Decrypt keys if they are from database (they will be longer and base64 encoded)
            try {
                if (accessToken && accessToken.length > 50) accessToken = decryptToken(accessToken);
            } catch (e) { /* Likely not encrypted or different key */ }

            try {
                if (apiKey && apiKey.length > 50) apiKey = decryptToken(apiKey);
            } catch (e) { /* Likely not encrypted */ }

            // Use WhatsApp Business API (Meta/Facebook)
            if (activeProvider === 'meta') {
                if (accessToken && phoneNumberId) {
                    return await this.sendViaWhatsAppBusinessAPI(formattedPhone, message, phoneNumberId, accessToken);
                }
                console.warn('Meta Cloud API selected but not properly configured');
                return false;
            }

            // Use custom WhatsApp API
            if (activeProvider === 'custom') {
                if (apiUrl && apiKey) {
                    return await this.sendViaCustomAPI(formattedPhone, message, apiUrl, apiKey, senderNumber);
                }
                console.warn('Custom WhatsApp API selected but not properly configured');
                return false;
            }

            console.warn('Unknown WhatsApp provider selected');
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
                const errorCode = errorData.error?.code || errorData.error?.error_subcode || '';

                throw new Error(`WhatsApp Cloud API error: ${errorMessage}${errorCode ? ` (Code: ${errorCode})` : ''}`);
            }

            await response.json().catch(() => ({}));
            return true;
        } catch (error: any) {
            console.error('WhatsApp Cloud API error:', error.message);
            throw error;
        }
    }

    /**
     * Send message via custom WhatsApp API or Twilio
     */
    private static async sendViaCustomAPI(to: string, message: string, apiUrl: string, apiKey: string, senderNumber?: string): Promise<boolean> {
        try {
            const isTwilio = apiUrl.includes('api.twilio.com');
            const headers: any = {};
            let body: any;

            if (isTwilio) {
                const url = apiUrl.endsWith('.json') ? apiUrl : `${apiUrl.replace(/\/$/, '')}/Messages.json`;

                // Extract AccountSid from URL if possible
                const match = url.match(/Accounts\/(AC[A-Za-z0-9]+)/i);
                const accountSid = match ? match[1] : '';

                if (!accountSid || !apiKey) {
                    throw new Error('Twilio requires Account SID in URL and Auth Token (entered in API Secret Key)');
                }

                // Twilio requires Basic Auth (AccountSid:AuthToken)
                const authHeader = `Basic ${Buffer.from(`${accountSid}:${apiKey}`).toString('base64')}`;
                headers['Authorization'] = authHeader;
                headers['Content-Type'] = 'application/x-www-form-urlencoded';

                const params = new URLSearchParams();

                // Format To number for WhatsApp
                let formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
                params.append('To', formattedTo);

                // Twilio REQUIRES a 'From' number for WhatsApp (e.g. whatsapp:+14155238886)
                if (senderNumber) {
                    let fromNum = senderNumber.trim();
                    // If it doesn't already have 'whatsapp:', add it
                    if (!fromNum.startsWith('whatsapp:')) {
                        // Ensure there's a '+' for the number part if it looks like a number
                        if (!fromNum.startsWith('+') && /^\d+$/.test(fromNum)) {
                            fromNum = '+' + fromNum;
                        }
                        fromNum = `whatsapp:${fromNum}`;
                    }
                    params.append('From', fromNum);
                }

                params.append('Body', message);
                body = params.toString();

                const response = await fetch(url, {
                    method: 'POST',
                    headers,
                    body
                });

                if (!response.ok) {
                    let errorMessage = `Twilio Error: ${response.status} ${response.statusText}`;
                    try {
                        const errorData: any = await response.json();
                        errorMessage = errorData.message || errorData.error || errorMessage;
                    } catch (e) {
                        const text = await response.text().catch(() => '');
                        if (text) errorMessage = text;
                    }
                    throw new Error(errorMessage);
                }
                return true;
            } else {
                // Generic JSON API
                headers['Content-Type'] = 'application/json';
                if (apiKey) {
                    headers['Authorization'] = `Bearer ${apiKey}`;
                    headers['X-API-Key'] = apiKey;
                }

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        to,
                        message,
                        apiKey: apiKey // Keep for backward compatibility
                    })
                });

                if (!response.ok) {
                    const errorData: any = await response.json().catch(() => ({}));
                    const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}`;
                    throw new Error(`Custom WhatsApp API error: ${errorMessage}`);
                }

                return true;
            }
        } catch (error: any) {
            console.error('Custom WhatsApp API error:', error.message);
            throw error;
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
     * Send appointment notification with approval links
     * @param employeePhone - Employee phone number
     * @param employeeName - Employee name
     * @param visitorDetails - Visitor details object
     * @param scheduledDate - Scheduled date
     * @param scheduledTime - Scheduled time
     * @param purpose - Purpose of visit
     * @param approvalLink - Approval link URL (verify link)
     * @param appointmentId - Appointment ID for direct approve/reject links
     * @returns Promise<boolean> - Success status
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
        purpose: string,
        approvalLink: string,
        companyName: string = 'SafeIn',
        config?: IWhatsAppConfig
    ): Promise<boolean> {
        try {
            const formattedDate = scheduledDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            const formattedTime = this.formatTo12Hour(scheduledTime);

            // Create WhatsApp message (Matches Email Text Format)
            const message = `*NEW APPOINTMENT REQUEST*

Hello ${employeeName},

You have a new appointment request for *${companyName}*.

*DETAILS*
• Visitor: ${visitorDetails.name}
• Date: ${formattedDate}
• Time: ${formattedTime}
• Purpose: ${purpose}

*To view and take action, click here:*
${approvalLink}

Best regards,
${companyName} Team`;

            return await this.sendMessage(employeePhone, message, config);
        } catch (error: any) {
            console.error('Failed to send appointment notification via WhatsApp:', error.message);
            return false;
        }
    }

    /**
     * Send appointment status update to visitor
     * @param visitorPhone - Visitor phone number
     * @param visitorName - Visitor name
     * @param employeeName - Employee name
     * @param scheduledDate - Scheduled date
     * @param scheduledTime - Scheduled time
     * @param status - Appointment status ('approved' or 'rejected')
     * @returns Promise<boolean> - Success status
     */
    static async sendAppointmentStatusUpdate(
        visitorPhone: string,
        visitorName: string,
        employeeName: string,
        scheduledDate: Date,
        scheduledTime: string,
        status: 'approved' | 'rejected',
        companyName: string = 'SafeIn',
        config?: IWhatsAppConfig
    ): Promise<boolean> {
        try {
            const formattedDate = scheduledDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const statusText = status === 'approved' ? 'APPROVED' : 'REJECTED';
            const formattedTime = this.formatTo12Hour(scheduledTime);
            const actionText = status === 'approved'
                ? 'Your appointment has been confirmed. Please arrive on time at the scheduled location.'
                : 'Unfortunately, your appointment request has been declined.';

            const message = `*APPOINTMENT ${statusText}*

Hello ${visitorName},

${actionText}

*DETAILS*
• Date: ${formattedDate}
• Time: ${formattedTime}
• Meeting With: ${employeeName}

${status === 'approved'
                    ? `Please ensure you bring a valid government-issued ID for verification at *${companyName}*.`
                    : `For further information, please contact ${employeeName} directly.`}

Best regards,
${companyName} Team`;

            return await this.sendMessage(visitorPhone, message, config);
        } catch (error: any) {
            console.error('Failed to send appointment status update via WhatsApp:', error.message);
            return false;
        }
    }
}



