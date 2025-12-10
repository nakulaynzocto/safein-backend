// Using fetch instead of axios for better compatibility

/**
 * WhatsApp Service
 * Handles sending WhatsApp messages for appointment notifications
 */
export class WhatsAppService {
    private static readonly WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || '';
    private static readonly WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY || '';
    private static readonly WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    private static readonly WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';

    /**
     * Send WhatsApp message
     * @param to - Recipient phone number (with country code, e.g., +919876543210)
     * @param message - Message text
     * @returns Promise<boolean> - Success status
     */
    static async sendMessage(to: string, message: string): Promise<boolean> {
        try {
            // Format phone number (remove spaces, ensure + prefix)
            const formattedPhone = this.formatPhoneNumber(to);
            
            if (!formattedPhone) {
                console.error('Invalid phone number format:', to);
                return false;
            }

            // If WhatsApp API is not configured, log and return false
            if (!this.WHATSAPP_API_URL && !this.WHATSAPP_ACCESS_TOKEN) {
                console.warn('WhatsApp API not configured. Message would be sent to:', formattedPhone);
                console.warn('Message content:', message);
                return false;
            }

            // Use WhatsApp Business API (Meta/Facebook)
            if (this.WHATSAPP_ACCESS_TOKEN && this.WHATSAPP_PHONE_NUMBER_ID) {
                return await this.sendViaWhatsAppBusinessAPI(formattedPhone, message);
            }

            // Use custom WhatsApp API
            if (this.WHATSAPP_API_URL && this.WHATSAPP_API_KEY) {
                return await this.sendViaCustomAPI(formattedPhone, message);
            }

            console.warn('WhatsApp API not properly configured');
            return false;
        } catch (error: any) {
            console.error('Failed to send WhatsApp message:', error.message);
            throw error;
        }
    }

    /**
     * Send message via WhatsApp Business API (Meta/Facebook) - WhatsApp Cloud API
     */
    private static async sendViaWhatsAppBusinessAPI(to: string, message: string): Promise<boolean> {
        try {
            // Remove + from phone number for WhatsApp Cloud API
            const phoneNumber = to.replace('+', '');
            const url = `https://graph.facebook.com/v18.0/${this.WHATSAPP_PHONE_NUMBER_ID}/messages`;
            
            console.log(`Sending WhatsApp message via Cloud API to: ${phoneNumber}`);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.WHATSAPP_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: phoneNumber,
                    type: 'text',
                    text: {
                        preview_url: false,
                        body: message
                    }
                })
            });

            if (!response.ok) {
                const errorData: any = await response.json().catch(() => ({}));
                console.error('WhatsApp Cloud API error:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorData
                });
                const errorMessage = errorData.error?.message || errorData.message || `HTTP ${response.status}`;
                const errorCode = errorData.error?.code || errorData.error?.error_subcode || '';
                
                // Log specific error details for debugging
                if (errorData.error) {
                    console.error('WhatsApp Cloud API Error Details:', {
                        code: errorData.error.code,
                        type: errorData.error.type,
                        message: errorData.error.message,
                        error_subcode: errorData.error.error_subcode,
                        fbtrace_id: errorData.error.fbtrace_id
                    });
                }
                
                throw new Error(`WhatsApp Cloud API error: ${errorMessage}${errorCode ? ` (Code: ${errorCode})` : ''}`);
            }

            const responseData: any = await response.json().catch(() => ({}));
            console.log('WhatsApp message sent successfully via Cloud API:', {
                messageId: responseData.messages?.[0]?.id,
                to: phoneNumber
            });

            return true;
        } catch (error: any) {
            console.error('WhatsApp Cloud API error:', error.message);
            throw error;
        }
    }

    /**
     * Send message via custom WhatsApp API
     */
    private static async sendViaCustomAPI(to: string, message: string): Promise<boolean> {
        try {
            const response = await fetch(this.WHATSAPP_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    to,
                    message,
                    apiKey: this.WHATSAPP_API_KEY
                })
            });

            if (!response.ok) {
                const errorData: any = await response.json().catch(() => ({}));
                console.error('Custom WhatsApp API error:', errorData);
                const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}`;
                throw new Error(`Custom WhatsApp API error: ${errorMessage}`);
            }

            return true;
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
            company?: string;
            visitorId?: string;
        },
        scheduledDate: Date,
        scheduledTime: string,
        purpose: string,
        approvalLink: string,
        appointmentId?: string
    ): Promise<boolean> {
        try {
            const formattedDate = scheduledDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            
            // Create approve and reject URLs if appointmentId is provided
            let actionUrls = '';
            if (appointmentId) {
                const approveUrl = `${baseUrl}/email-action/approve/${appointmentId}`;
                const rejectUrl = `${baseUrl}/email-action/reject/${appointmentId}`;
                actionUrls = `*Quick Actions:*
✅ Approve: ${approveUrl}
❌ Reject: ${rejectUrl}

Or use the verification link: ${approvalLink}`;
            } else {
                actionUrls = `*Quick Action:*
Click here to approve or reject: ${approvalLink}`;
            }

            // Create WhatsApp message
            const message = `🔔 *New Appointment Request*

Hello ${employeeName},

You have received a new appointment request. Please review the details below.

*Appointment Details:*
📅 Date: ${formattedDate}
🕐 Time: ${scheduledTime}
📋 Purpose: ${purpose}

*Visitor Information:*
👤 Name: ${visitorDetails.name}
📧 Email: ${visitorDetails.email}
📞 Phone: ${visitorDetails.phone}
${visitorDetails.company ? `🏢 Company: ${visitorDetails.company}` : ''}
${visitorDetails.visitorId ? `🆔 Visitor ID: ${visitorDetails.visitorId}` : ''}

${actionUrls}

Or visit your dashboard: ${baseUrl}/dashboard/notifications

⏰ Please respond as soon as possible so the visitor can plan accordingly.

Best regards,
SafeIn Security Team`;

            return await this.sendMessage(employeePhone, message);
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
        status: 'approved' | 'rejected'
    ): Promise<boolean> {
        try {
            const formattedDate = scheduledDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const statusEmoji = status === 'approved' ? '✅' : '❌';
            const statusText = status === 'approved' ? 'Approved' : 'Rejected';
            const actionText = status === 'approved' 
                ? 'Your appointment has been confirmed! Please arrive on time.'
                : 'Unfortunately, your appointment request has been declined.';

            const message = `${statusEmoji} *Appointment ${statusText}*

Hello ${visitorName},

${actionText}

*Appointment Details:*
📅 Date: ${formattedDate}
🕐 Time: ${scheduledTime}
👤 Meeting With: ${employeeName}

${status === 'approved' 
    ? `✅ Your appointment is confirmed. Please arrive on time and bring a valid ID.`
    : `❌ Your appointment request has been rejected. Please contact ${employeeName} for more information.`}

Visit your dashboard: ${baseUrl}/dashboard/notifications

Best regards,
SafeIn Security Team`;

            return await this.sendMessage(visitorPhone, message);
        } catch (error: any) {
            console.error('Failed to send appointment status update via WhatsApp:', error.message);
            return false;
        }
    }
}



