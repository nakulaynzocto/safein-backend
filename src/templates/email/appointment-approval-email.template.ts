import { getBaseEmailTemplate } from './base-email.template';

/**
 * Appointment Approval Email Template
 * Sent to visitor when appointment is approved
 */
export function getAppointmentApprovalEmailTemplate(
  visitorName: string,
  employeeName: string,
  scheduledDate: Date,
  scheduledTime: string
): string {
  const formattedDate = scheduledDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const content = `
            <div class="greeting">
                Hi ${visitorName},
            </div>
            
            <div class="message">
                Great news! Your appointment with ${employeeName} has been approved.
            </div>
            
            <div class="highlight-box">
                <h3 style="margin-top: 0; color: #1A73E8;">Appointment Details:</h3>
                <p><strong>Date:</strong> ${formattedDate}</p>
                <p><strong>Time:</strong> ${scheduledTime}</p>
                <p><strong>Employee:</strong> ${employeeName}</p>
            </div>
            
            <div class="message">
                Please arrive 10 minutes before your scheduled time and bring a valid ID for security clearance.
            </div>
            
            <div class="security-note">
                If you need to reschedule or have any questions, please contact us in advance.
            </div>
  `;
  
  return getBaseEmailTemplate(content, 'Appointment Approved - SafeIn');
}

export function getAppointmentApprovalEmailText(
  visitorName: string,
  employeeName: string,
  scheduledDate: Date,
  scheduledTime: string
): string {
  const formattedDate = scheduledDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
Appointment Approved!

Hello ${visitorName},

Great news! Your appointment with ${employeeName} has been approved.

Appointment Details:
- Date: ${formattedDate}
- Time: ${scheduledTime}
- Employee: ${employeeName}

Please arrive 10 minutes before your scheduled time and bring a valid ID for security clearance.

If you need to reschedule or have any questions, please contact us in advance.

Best regards,
SafeIn Security Team

Need help? Contact us at support@safein.com
  `;
}

