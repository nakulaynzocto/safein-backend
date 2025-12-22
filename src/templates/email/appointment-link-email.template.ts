import { getBaseEmailTemplate } from './base-email.template';

/**
 * Appointment Link Email Template
 * Sent to visitor when appointment booking link is created
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
                <p><strong>👤 Meeting With:</strong> ${employeeName}</p>
                <p><strong>⏰ Link Expires:</strong> ${formattedExpiryDate}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${bookingUrl}" 
                   style="display: inline-block; padding: 14px 28px; background-color: #1A73E8; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                    Book Appointment
                </a>
            </div>
            
            <div class="message">
                <strong>What to Expect:</strong><br><br>
                • Click the button above to open the appointment booking form<br>
                • Your visitor and employee information will be pre-filled<br>
                • Complete the remaining appointment details (date, time, purpose, etc.)<br>
                • Submit to confirm your appointment
            </div>
            
            <div class="security-note security-success">
                <strong>🔒 Secure Link:</strong> This is a secure, one-time use link. Once you book an appointment, this link will no longer be valid. If you have any questions, please contact us.
            </div>
            
            <div class="message" style="margin-top: 20px; font-size: 12px; color: #666;">
                <strong>Note:</strong> If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${bookingUrl}" style="color: #1A73E8; word-break: break-all;">${bookingUrl}</a>
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
SafeIn Security Management Team
  `.trim();
}


