import { getBaseEmailTemplate } from './base-email.template';

/**
 * Appointment Rejection Email Template
 * Sent to visitor when appointment is rejected
 */
export function getAppointmentRejectionEmailTemplate(
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
                We regret to inform you that your appointment with ${employeeName} has been declined.
            </div>
            
            <div class="highlight-box" style="background-color: #FFF3CD; border-left: 4px solid #FFC107;">
                <h3 style="margin-top: 0;">Original Appointment Details:</h3>
                <p><strong>Date:</strong> ${formattedDate}</p>
                <p><strong>Time:</strong> ${scheduledTime}</p>
                <p><strong>Employee:</strong> ${employeeName}</p>
            </div>
            
            <div class="message">
                We apologize for any inconvenience this may cause. Please feel free to schedule a new appointment at a more convenient time.
            </div>
            
            <div class="security-note">
                If you have any questions or need assistance, please don't hesitate to contact us.
            </div>
  `;
  
  return getBaseEmailTemplate(content, 'Appointment Update - SafeIn');
}

export function getAppointmentRejectionEmailText(
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
Appointment Update

Hello ${visitorName},

We regret to inform you that your appointment with ${employeeName} has been declined.

Original Appointment Details:
- Date: ${formattedDate}
- Time: ${scheduledTime}
- Employee: ${employeeName}

We apologize for any inconvenience this may cause. Please feel free to schedule a new appointment at a more convenient time.

If you have any questions or need assistance, please don't hesitate to contact us.

Best regards,
SafeIn Security Team

Need help? Contact us at support@safein.com
  `;
}

