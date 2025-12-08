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
                Appointment Confirmed!
            </div>
            
            <div class="message">
                Hello ${visitorName},<br><br>
                Great news! Your appointment request has been approved. We're looking forward to meeting with you.
            </div>
            
            <div class="highlight-box">
                <h3>Appointment Details</h3>
                <p><strong>📅 Date:</strong> ${formattedDate}</p>
                <p><strong>🕐 Time:</strong> ${scheduledTime}</p>
                <p><strong>👤 Meeting With:</strong> ${employeeName}</p>
            </div>
            
            <div class="message">
                <strong>Important Reminders:</strong><br><br>
                • Please arrive <strong>10 minutes early</strong> to allow time for security check-in<br>
                • Bring a <strong>valid government-issued photo ID</strong> (driver's license, passport, etc.)<br>
                • Check in at the reception desk upon arrival<br>
                • If you're running late, please notify us as soon as possible
            </div>
            
            <div class="security-note security-success">
                <strong>💡 Need to Reschedule?</strong> If you need to change your appointment time, please contact us at least 24 hours in advance. You can also reach out to ${employeeName} directly if you have any questions about the meeting.
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

