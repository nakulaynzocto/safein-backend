import { getBaseEmailTemplate } from './base-email.template';

/**
 * Appointment Confirmation Email Template
 * Sent to visitor when appointment is created (pending approval)
 * Modern, Professional, and User-Friendly Design
 */
export function getAppointmentConfirmationEmailTemplate(
  visitorName: string,
  employeeName: string,
  scheduledDate: Date,
  scheduledTime: string,
  purpose: string,
  companyLogo?: string
): string {
  const formattedDate = scheduledDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const content = `
            <div class="greeting">
                Appointment Request Submitted
            </div>
            
            <div class="message">
                Hello ${visitorName},<br><br>
                Thank you for booking an appointment with us. Your appointment request has been submitted and is pending approval from ${employeeName}.
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
                    <div class="detail-icon">👤</div>
                    <div class="detail-content">
                        <div class="detail-label">Meeting With</div>
                        <div class="detail-value">${employeeName}</div>
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
            
            <div class="info-box">
                <strong>📋 What Happens Next?</strong><br><br>
                • Your appointment request has been sent to ${employeeName} for review<br>
                • You will receive a confirmation email once your appointment is approved<br>
                • If approved, please arrive 10 minutes early for security check-in<br>
                • Bring a valid government-issued photo ID
            </div>
            
            <div class="security-note">
                <strong>⏰ Status:</strong> Your appointment is currently <strong>pending approval</strong>. You will be notified via email once ${employeeName} reviews and approves your request.
            </div>
  `;

  return getBaseEmailTemplate(content, 'Appointment Request Submitted - SafeIn', companyLogo);
}

export function getAppointmentConfirmationEmailText(
  visitorName: string,
  employeeName: string,
  scheduledDate: Date,
  scheduledTime: string,
  purpose: string
): string {
  const formattedDate = scheduledDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
Appointment Request Submitted

Hello ${visitorName},

Thank you for booking an appointment with us. Your appointment request has been submitted and is pending approval from ${employeeName}.

Appointment Details:
Date: ${formattedDate}
Time: ${scheduledTime}
Meeting With: ${employeeName}
Purpose: ${purpose}

What Happens Next?
- Your appointment request has been sent to ${employeeName} for review
- You will receive a confirmation email once your appointment is approved
- If approved, please arrive 10 minutes early for security check-in
- Bring a valid government-issued photo ID

Status: Your appointment is currently pending approval. You will be notified via email once ${employeeName} reviews and approves your request.

Best Regards,
SafeIn Security Team
  `;
}
