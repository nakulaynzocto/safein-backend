import { getBaseEmailTemplate, formatTo12Hour } from './base-email.template';

/**
 * Appointment Approval Email Template
 * Sent to visitor when appointment is approved
 */
export function getAppointmentApprovalEmailTemplate(
  visitorName: string,
  employeeName: string,
  scheduledDate: Date,
  scheduledTime: string,
  companyName: string = 'SafeIn'
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
                Appointment Confirmed
            </div>
            
            <div class="message">
                Hello <strong>${visitorName}</strong>,<br><br>
                Your appointment request with <strong>${companyName}</strong> has been approved. We look forward to meeting you.
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
            </div>
            
            <div class="security-note">
                <strong>Important:</strong> Please arrive 10 minutes early and bring a valid photo ID for security check-in.
            </div>
            
            <div class="message" style="font-size: 14px; color: #5f6368; border-top: 1px solid #f1f3f4; padding-top: 24px;">
                If you need to reschedule or have any questions, please contact us at least 24 hours in advance.
            </div>
  `;

  return getBaseEmailTemplate(content, `Appointment Confirmed`, companyName);
}

export function getAppointmentApprovalEmailText(
  visitorName: string,
  employeeName: string,
  scheduledDate: Date,
  scheduledTime: string,
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
Appointment Confirmed

Hello ${visitorName},

Your appointment with ${employeeName} at ${companyName} has been approved.

Details:
- Date: ${formattedDate}
- Time: ${formattedTime}
- Meeting With: ${employeeName}

Please arrive 10 minutes before your scheduled time and bring a valid ID.

Best regards,
${companyName} Team
  `;
}

