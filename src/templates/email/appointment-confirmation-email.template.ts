import { getBaseEmailTemplate, formatTo12Hour } from './base-email.template';

/**
 * Appointment Confirmation Email Template
 * Sent to visitor when appointment is created (pending approval)
 */
export function getAppointmentConfirmationEmailTemplate(
    visitorName: string,
    employeeName: string,
    scheduledDate: Date,
    scheduledTime: string,
    purpose: string,
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

    const content = `
            <div class="greeting">
                Appointment Requested
            </div>
            
            <div class="message">
                Hello <strong>${visitorName}</strong>,<br><br>
                Thank you for booking an appointment with <strong>${companyName}</strong>. Your request has been submitted and is pending approval.
            </div>
            
            <div class="highlight-box">
                <h3 style="font-size: 16px; margin-bottom: 12px;">Appointment Details:</h3>
                <div class="detail-row">
                    <div class="detail-label">Date</div>
                    <div class="detail-value">${formattedDate}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Time</div>
                    <div class="detail-value">${formattedTime}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Meeting With</div>
                    <div class="detail-value">${employeeName}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Purpose</div>
                    <div class="detail-value">${purpose}</div>
                </div>
            </div>
            
            <div class="security-note">
                <strong>Status:</strong> Your appointment is currently <strong>pending approval</strong>. You will be notified via email once ${employeeName} reviews your request.
            </div>

            <div class="message" style="font-size: 14px; color: #5f6368; border-top: 1px solid #f1f3f4; padding-top: 24px;">
                Once approved, please arrive 10 minutes early and bring a valid photo ID for security check-in.
            </div>
  `;

    return getBaseEmailTemplate(content, `Appointment Requested`, companyName, companyLogo);
}

export function getAppointmentConfirmationEmailText(
    visitorName: string,
    employeeName: string,
    scheduledDate: Date,
    scheduledTime: string,
    purpose: string,
    companyName: string = 'SafeIn'
): string {
    const formattedDate = scheduledDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const formattedTime = formatTo12Hour(scheduledTime);

    return `
Appointment Requested

Hello ${visitorName},

Thank you for booking an appointment with ${companyName}. Your request is pending approval from ${employeeName}.

Details:
- Date: ${formattedDate}
- Time: ${formattedTime}
- Meeting With: ${employeeName}
- Purpose: ${purpose}

You will be notified once your appointment is approved.

Best regards,
${companyName} Team
  `;
}


