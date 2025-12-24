import { getBaseEmailTemplate } from './base-email.template';

/**
 * Get the base URL for email action links
 * Only uses APPROVAL_LINK_BASE_URL environment variable
 */
function getEmailActionBaseUrl(): string {
  const url = process.env.APPROVAL_LINK_BASE_URL || '';
  return url.replace(/\/$/, ''); // Remove trailing slash
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
  approvalToken: string
): string {
  const formattedDate = scheduledDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const baseUrl = getEmailActionBaseUrl();
  // Use /verify/{token} URL format - this is a public page that shows details and allows approve/reject
  const verifyUrl = `${baseUrl}/verify/${approvalToken}`;

  const content = `
            <div class="greeting">
                New Appointment Request
            </div>
            
            <div class="message">
                Hello ${employeeName},<br><br>
                You have received a new appointment request. Please review the details below and take action at your earliest convenience.
            </div>
            
            <div class="highlight-box">
                <h3>Appointment Details</h3>
                <p><strong>📅 Date:</strong> ${formattedDate}</p>
                <p><strong>🕐 Time:</strong> ${scheduledTime}</p>
                <p><strong>📋 Purpose:</strong> ${purpose}</p>
            </div>
            
            <div class="highlight-box" style="background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); border-left: 4px solid #6c757d;">
                <h3 style="color: #4a4a4a;">Visitor Information</h3>
                <p><strong>👤 Name:</strong> ${visitorDetails.name}</p>
                <p><strong>📧 Email:</strong> <a href="mailto:${visitorDetails.email}" style="color: #1A73E8; text-decoration: none;">${visitorDetails.email}</a></p>
                <p><strong>📞 Phone:</strong> <a href="tel:${visitorDetails.phone}" style="color: #1A73E8; text-decoration: none;">${visitorDetails.phone}</a></p>
                ${visitorDetails._id ? `<p><strong>🆔 Visitor ID:</strong> ${visitorDetails._id}</p>` : ''}
            </div>
            
            <div class="button-group" style="text-align: center; margin: 30px 0;">
                <a href="${verifyUrl}" class="action-button action-button-primary" style="display: inline-block; padding: 14px 32px; background-color: #3882a5; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    📋 View Details & Take Action
                </a>
            </div>
            
            <div class="security-note security-success">
                <strong>⏰ Action Required:</strong> Click the button above to view full visitor details, ID proof, and approve or reject this appointment. The link is secure and will expire after use.
            </div>
            
            <div class="message" style="text-align: center; margin-top: 25px; padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
                <strong>💡 Alternative:</strong> You can also manage this appointment through your <a href="${baseUrl}/dashboard/notifications" style="color: #1A73E8; text-decoration: none; font-weight: 600;">SafeIn Dashboard</a> for more detailed options.
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
- Company: ${visitorDetails.company || 'Not provided'}
- Visitor ID: ${visitorDetails._id || 'Not assigned'}

To view full details and approve/reject this appointment, click:
${verifyUrl}

Or visit your dashboard: ${baseUrl}/dashboard/notifications

Important: Please respond to this request as soon as possible. The link is secure and will expire after use.

Best regards,
SafeIn Security Team

Need help? Contact us at support@safein.com
  `;
}

