import { getBaseEmailTemplate, formatTo12Hour } from './base-email.template';

/**
 * Get the base URL for email action links
 */
function getEmailActionBaseUrl(): string {
    const url = process.env.FRONTEND_URL || 'http://localhost:3000';
    return url.replace(/\/$/, '');
}

/**
 * New Appointment Request Email Template
 * Sent to employee when a new appointment is requested
 */
export function getNewAppointmentRequestEmailTemplate(
    employeeName: string,
    visitorDetails: any,
    scheduledDate: Date,
    scheduledTime: string,
    purpose: string,
    approvalToken: string,
    companyName: string = 'SafeIn',
    companyLogo?: string
): string {
    const formattedDate = scheduledDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const formattedTime = formatTo12Hour(scheduledTime);

    const baseUrl = getEmailActionBaseUrl();
    const verifyUrl = `${baseUrl}/verify/${approvalToken}`;

    const content = `
            <div class="greeting">
                New Appointment Request
            </div>
            
            <div class="message">
                Hello <strong>${employeeName}</strong>,<br><br>
                You have received a new appointment request for <strong>${companyName}</strong>. Please review the details below and take action.
            </div>
            
            <div class="highlight-box">
                <h3 style="font-size: 16px; margin-bottom: 12px;">Appointment Details:</h3>
                <div class="detail-row">
                    <div class="detail-label">Visitor</div>
                    <div class="detail-value">${visitorDetails.name}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Date</div>
                    <div class="detail-value">${formattedDate}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Time</div>
                    <div class="detail-value">${formattedTime}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Purpose</div>
                    <div class="detail-value">${purpose}</div>
                </div>
            </div>
            
            <div class="action-button-container">
                <a href="${verifyUrl}" class="action-button">View Request</a>
            </div>
            
            <div class="security-note" style="text-align: center;">
                Click the button above to approve or decline this request.
            </div>
  `;

    return getBaseEmailTemplate(content, `New Appointment Request`, companyName, companyLogo);
}

export function getNewAppointmentRequestEmailText(
    employeeName: string,
    visitorDetails: any,
    scheduledDate: Date,
    scheduledTime: string,
    purpose: string,
    approvalToken: string,
    companyName: string = 'SafeIn'
): string {
    const formattedDate = scheduledDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const formattedTime = formatTo12Hour(scheduledTime);

    const baseUrl = getEmailActionBaseUrl();
    const verifyUrl = `${baseUrl}/verify/${approvalToken}`;

    return `
New Appointment Request

Hello ${employeeName},

You have a new appointment request for ${companyName}.

Details:
- Visitor: ${visitorDetails.name}
- Date: ${formattedDate}
- Time: ${formattedTime}
- Purpose: ${purpose}

To view and take action, click here:
${verifyUrl}

Best regards,
${companyName} Team
  `;
}


