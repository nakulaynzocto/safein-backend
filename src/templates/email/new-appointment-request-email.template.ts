import { getBaseEmailTemplate } from './base-email.template';

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
  appointmentId: string
): string {
  const formattedDate = scheduledDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Create approve and reject URLs
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const approveUrl = `${baseUrl}/email-action/approve/${appointmentId}`;
  const rejectUrl = `${baseUrl}/email-action/reject/${appointmentId}`;

  const content = `
            <div class="greeting">
                Hi ${employeeName},
            </div>
            
            <div class="message">
                You have a new appointment request! Please review the details below and take action.
            </div>
            
            <div class="highlight-box">
                <h3 style="margin-top: 0; color: #1A73E8;">Appointment Details:</h3>
                <p><strong>Date:</strong> ${formattedDate}</p>
                <p><strong>Time:</strong> ${scheduledTime}</p>
                <p><strong>Purpose:</strong> ${purpose}</p>
            </div>
            
            <div class="message">
                <strong>Visitor Information:</strong><br>
                Name: ${visitorDetails.name}<br>
                Email: ${visitorDetails.email}<br>
                Phone: ${visitorDetails.phone}<br>
                Company: ${visitorDetails.company || 'Not provided'}<br>
                Visitor ID: ${visitorDetails.visitorId || 'Not assigned'}
            </div>
            
            <div style="margin: 30px 0;">
                <a href="${approveUrl}" class="action-button" style="background-color: #28a745;">Approve Appointment</a>
                <a href="${rejectUrl}" class="action-button" style="background-color: #dc3545;">Reject Appointment</a>
            </div>
            
            <div class="security-note">
                <strong>Important:</strong> Please respond to this request as soon as possible so the visitor can plan accordingly. You can also manage this appointment through your SafeIn dashboard.
            </div>
  `;
  
  return getBaseEmailTemplate(content, 'New Appointment Request - SafeIn');
}

export function getNewAppointmentRequestEmailText(
  employeeName: string,
  visitorDetails: any,
  scheduledDate: Date,
  scheduledTime: string,
  purpose: string,
  appointmentId: string
): string {
  const formattedDate = scheduledDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const approveUrl = `${baseUrl}/email-action/approve/${appointmentId}`;
  const rejectUrl = `${baseUrl}/email-action/reject/${appointmentId}`;

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
- Company: ${visitorDetails.company || 'Not provided'}
- Visitor ID: ${visitorDetails.visitorId || 'Not assigned'}

Quick Action:
To approve this appointment, click: ${approveUrl}
To reject this appointment, click: ${rejectUrl}

Or visit your dashboard: ${baseUrl}/dashboard/notifications

Important: Please respond to this request as soon as possible so the visitor can plan accordingly. If you don't take action, the request will remain pending.

Note: You can also manage this appointment through your SafeIn dashboard for more detailed options.

Best regards,
SafeIn Security Team

Need help? Contact us at support@safein.com
  `;
}

