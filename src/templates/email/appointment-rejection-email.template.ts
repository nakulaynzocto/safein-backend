import { getBaseEmailTemplate, formatTo12Hour } from './base-email.template';

/**
 * Appointment Rejection Email Template
 * Sent to visitor when appointment is rejected
 */
export function getAppointmentRejectionEmailTemplate(
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
                Appointment Declined
            </div>
            
            <div class="message">
                Hello <strong>${visitorName}</strong>,<br><br>
                We regret to inform you that your appointment request with <strong>${employeeName}</strong> at <strong>${companyName}</strong> has been declined.
            </div>
            
            <div class="highlight-box">
                <h3 style="font-size: 16px; margin-bottom: 12px;">Original Details:</h3>
                <div class="detail-row">
                    <div class="detail-label">Date</div>
                    <div class="detail-value">${formattedDate}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Time</div>
                    <div class="detail-value">${formattedTime}</div>
                </div>
            </div>
            
            <div class="message" style="font-size: 14px; color: #5f6368; border-top: 1px solid #f1f3f4; padding-top: 24px;">
                We encourage you to schedule a new appointment at a time that works better for both parties. If you have any questions, please contact our support team.
            </div>
  `;

  return getBaseEmailTemplate(content, `Appointment Declined`, companyName);
}

export function getAppointmentRejectionEmailText(
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
Appointment Declined

Hello ${visitorName},

We regret to inform you that your appointment request with ${employeeName} at ${companyName} has been declined.

Original Details:
- Date: ${formattedDate}
- Time: ${formattedTime}

Please feel free to schedule a new appointment at a more convenient time.

Best regards,
${companyName} Team
  `;
}


