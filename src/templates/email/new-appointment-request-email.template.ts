import { getBaseEmailTemplate } from './base-email.template';

/**
 * Get the base URL for email action links
 * Uses FRONTEND_URL environment variable
 */
function getEmailActionBaseUrl(): string {
    const url = process.env.FRONTEND_URL || 'http://localhost:3000';
    return url.replace(/\/$/, ''); // Remove trailing slash
}

/**
 * New Appointment Request Email Template
 * Sent to employee when a new appointment is requested
 * Modern, Professional, and User-Friendly Design
 */
export function getNewAppointmentRequestEmailTemplate(
    employeeName: string,
    visitorDetails: any,
    scheduledDate: Date,
    scheduledTime: string,
    purpose: string,
    approvalToken: string,
    companyLogo?: string
): string {
    const formattedDate = scheduledDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const baseUrl = getEmailActionBaseUrl();
    const verifyUrl = `${baseUrl}/verify/${approvalToken}`;

    const content = `
            <div class="greeting">
                New Appointment Request
            </div>
            
            <div class="message">
                Hello ${employeeName},<br><br>
                You have received a new appointment request. Please review the details below.
            </div>
            
            <div class="highlight-box">
                <h3>Appointment Details</h3>
                <div class="detail-row">
                    <div class="detail-icon">📅</div>
                    <div class="detail-content">
                        <div class="detail-label">Date & Time</div>
                        <div class="detail-value">${formattedDate} at ${scheduledTime}</div>
                    </div>
                </div>
                <div class="detail-row">
                    <div class="detail-icon">👤</div>
                    <div class="detail-content">
                        <div class="detail-label">Visitor</div>
                        <div class="detail-value">${visitorDetails.name}</div>
                    </div>
                </div>
                <div class="detail-row">
                    <div class="detail-icon">📋</div>
                    <div class="detail-content">
                        <div class="detail-label">Purpose</div>
                        <div class="detail-value">${purpose}</div>
                    </div>
                </div>
            </div>
            
            <div class="button-group">
                <a href="${verifyUrl}" class="action-button action-button-primary">
                    View Details & Take Action
                </a>
            </div>
            
            <div class="security-note">
                <strong>⏰ Action Required:</strong> Click the button above to view full details and approve or reject this appointment.
            </div>
  `;


    return getBaseEmailTemplate(content, 'New Appointment Request - SafeIn', companyLogo);
}

export function getNewAppointmentRequestEmailText(
    employeeName: string,
    visitorDetails: any,
    scheduledDate: Date,
    scheduledTime: string,
    purpose: string,
    approvalToken: string
): string {
    const formattedDate = scheduledDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const baseUrl = getEmailActionBaseUrl();
    const verifyUrl = `${baseUrl}/verify/${approvalToken}`;

    return `
New Appointment Request

Hello ${employeeName},

You have a new appointment request! Please review the details below and take action.

Appointment Details:
- Date: ${formattedDate}
- Time: ${scheduledTime}
- Purpose: ${purpose}

Visitor Information:
- Name: ${visitorDetails.name}
- Email: ${visitorDetails.email}
- Phone: ${visitorDetails.phone}
${visitorDetails.company ? `- Company: ${visitorDetails.company}` : ''}
${visitorDetails._id ? `- Visitor ID: ${visitorDetails._id}` : ''}

To view full details and approve/reject this appointment, click:
${verifyUrl}

Or visit your dashboard: ${baseUrl}/appointment/list

Important: Please respond to this request as soon as possible. The link is secure and will expire after use.

Best regards,
SafeIn Security Team

Need help? Contact us at support@safein.com
  `;
}
