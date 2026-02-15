import { getBaseEmailTemplate } from './base-email.template';

/**
 * Appointment Link Email Template
 * Sent to visitor when appointment booking link is created
 */
export function getAppointmentLinkEmailTemplate(
  employeeName: string,
  bookingUrl: string,
  expiresAt: Date,
  companyName: string = 'SafeIn'
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
                You have been invited to book an appointment with <strong>${employeeName}</strong> at <strong>${companyName}</strong>. Click the button below to complete your booking.
            </div>
            
            <div class="highlight-box">
                <h3 style="font-size: 16px; margin-bottom: 12px;">Booking Details:</h3>
                <div class="detail-row">
                    <div class="detail-label">Meeting With</div>
                    <div class="detail-value">${employeeName}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Link Expires</div>
                    <div class="detail-value">${formattedExpiryDate}</div>
                </div>
            </div>
            
            <div class="action-button-container">
                <a href="${bookingUrl}" class="action-button">Book Appointment</a>
            </div>
            
            <div class="security-note" style="text-align: center;">
                This is a secure, one-time use link.
            </div>

            <div style="font-size: 12px; color: #bdc1c6; margin-top: 16px; word-break: break-all;">
                If the button above doesn't work, copy and paste this link into your browser:<br>
                ${bookingUrl}
            </div>
  `;

  return getBaseEmailTemplate(content, `Book Your Appointment`, companyName);
}

/**
 * Plain text version of appointment link email
 */
export function getAppointmentLinkEmailText(
  employeeName: string,
  bookingUrl: string,
  expiresAt: Date,
  companyName: string = 'SafeIn'
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

You have been invited to book an appointment with ${employeeName} at ${companyName}.

Book your appointment here:
${bookingUrl}

This link expires on: ${formattedExpiryDate}

Best regards,
${companyName} Team
  `.trim();
}

