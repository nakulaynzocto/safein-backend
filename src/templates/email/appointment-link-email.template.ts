import { getBaseEmailTemplate } from './base-email.template';

/**
 * Appointment Link Email Template
 * Sent to visitor when appointment booking link is created
 * Modern, Professional, and User-Friendly Design
 */
export function getAppointmentLinkEmailTemplate(
  employeeName: string,
  bookingUrl: string,
  expiresAt: Date
): string {
  const formattedExpiryDate = expiresAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const content = `
            <div class="greeting">
                Book Your Appointment
            </div>
            
            <div class="message">
                Hello,<br><br>
                You have been invited to book an appointment with <strong>${employeeName}</strong>. Click the button below to complete your appointment booking.
            </div>
            
            <div class="highlight-box">
                <h3>Appointment Details</h3>
                <div class="detail-row">
                    <div class="detail-icon">👤</div>
                    <div class="detail-content">
                        <div class="detail-label">Meeting With</div>
                        <div class="detail-value">${employeeName}</div>
                    </div>
                </div>
                <div class="detail-row">
                    <div class="detail-icon">⏰</div>
                    <div class="detail-content">
                        <div class="detail-label">Link Expires</div>
                        <div class="detail-value">${formattedExpiryDate}</div>
                    </div>
                </div>
            </div>
            
            <div class="button-group">
                <a href="${bookingUrl}" class="action-button action-button-primary">
                    Book Appointment Now
                </a>
            </div>
            
            <div class="info-box">
                <strong>📋 What to Expect:</strong><br><br>
                • Click the button above to open the appointment booking form<br>
                • Your visitor and employee information will be pre-filled<br>
                • Complete the remaining appointment details (date, time, purpose, etc.)<br>
                • Submit to confirm your appointment
            </div>
            
            <div class="security-note security-success">
                <strong>🔒 Secure Link:</strong> This is a secure, one-time use link. Once you book an appointment, this link will no longer be valid. If you have any questions, please contact us.
            </div>
            
            <div class="info-box" style="margin-top: 24px; font-size: 13px; padding: 16px;">
                <strong>Note:</strong> If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${bookingUrl}" style="word-break: break-all; font-size: 12px;">${bookingUrl}</a>
            </div>
  `;

  return getBaseEmailTemplate(content, 'Book Your Appointment - SafeIn');
}

/**
 * Plain text version of appointment link email
 */
export function getAppointmentLinkEmailText(
  employeeName: string,
  bookingUrl: string,
  expiresAt: Date
): string {
  const formattedExpiryDate = expiresAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
Book Your Appointment

Hello,

You have been invited to book an appointment with ${employeeName}. Use the link below to complete your appointment booking.

Appointment Details:
- Meeting With: ${employeeName}
- Link Expires: ${formattedExpiryDate}

Book Appointment: ${bookingUrl}

What to Expect:
- Click the link above to open the appointment booking form
- Your visitor and employee information will be pre-filled
- Complete the remaining appointment details (date, time, purpose, etc.)
- Submit to confirm your appointment

Secure Link: This is a secure, one-time use link. Once you book an appointment, this link will no longer be valid.

If you have any questions, please contact us.

Best regards,
SafeIn Security Team
  `.trim();
}
