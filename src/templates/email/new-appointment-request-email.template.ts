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
 * Modern, Professional, and User-Friendly Design
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
                <div class="detail-row">
                    <div class="detail-icon">📅</div>
                    <div class="detail-content">
                        <div class="detail-label">Date</div>
                        <div class="detail-value">${formattedDate}</div>
                    </div>
                </div>
                <div class="detail-row">
                    <div class="detail-icon">🕐</div>
                    <div class="detail-content">
                        <div class="detail-label">Time</div>
                        <div class="detail-value">${scheduledTime}</div>
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
            
            <div class="info-card">
                <h3>Visitor Information</h3>
                <div class="detail-row">
                    <div class="detail-icon">👤</div>
                    <div class="detail-content">
                        <div class="detail-label">Name</div>
                        <div class="detail-value">${visitorDetails.name}</div>
                    </div>
                </div>
                <div class="detail-row">
                    <div class="detail-icon">📧</div>
                    <div class="detail-content">
                        <div class="detail-label">Email</div>
                        <div class="detail-value"><a href="mailto:${visitorDetails.email}">${visitorDetails.email}</a></div>
                    </div>
                </div>
                <div class="detail-row">
                    <div class="detail-icon">📞</div>
                    <div class="detail-content">
                        <div class="detail-label">Phone</div>
                        <div class="detail-value"><a href="tel:${visitorDetails.phone}">${visitorDetails.phone}</a></div>
                    </div>
                </div>
                ${visitorDetails._id ? `
                <div class="detail-row">
                    <div class="detail-icon">🆔</div>
                    <div class="detail-content">
                        <div class="detail-label">Visitor ID</div>
                        <div class="detail-value">${visitorDetails._id}</div>
                    </div>
                </div>
                ` : ''}
                ${visitorDetails.company ? `
                <div class="detail-row">
                    <div class="detail-icon">🏢</div>
                    <div class="detail-content">
                        <div class="detail-label">Company</div>
                        <div class="detail-value">${visitorDetails.company}</div>
                    </div>
                </div>
                ` : ''}
            </div>
            
            <div class="button-group">
                <a href="${verifyUrl}" class="action-button action-button-primary">
                    View Details & Take Action
                </a>
            </div>
            
            <div class="security-note security-success">
                <strong>⏰ Action Required:</strong> Click the button above to view full visitor details, ID proof, and approve or reject this appointment. The link is secure and will expire after use.
            </div>
            
            <div class="info-box">
                <strong>💡 Alternative:</strong> You can also manage this appointment through your <a href="${baseUrl}/appointment/list">SafeIn Dashboard</a> for more detailed options.
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
