import { getBaseEmailTemplate } from './base-email.template';

/**
 * Appointment Confirmation Email Template
 * Sent to visitor when appointment is created (pending approval)
 */
export function getAppointmentConfirmationEmailTemplate(
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
                <p><strong>📅 Date:</strong> ${formattedDate}</p>
                <p><strong>🕐 Time:</strong> ${scheduledTime}</p>
                <p><strong>👤 Meeting With:</strong> ${employeeName}</p>
                <p><strong>📋 Purpose:</strong> ${purpose}</p>
            </div>
            
            <div class="message">
                <strong>What Happens Next?</strong><br><br>
                • Your appointment request has been sent to ${employeeName} for review<br>
                • You will receive a confirmation email once your appointment is approved<br>
                • If approved, please arrive 10 minutes early for security check-in<br>
                • Bring a valid government-issued photo ID
            </div>
            
            <div class="security-note">
                <strong>⏰ Status:</strong> Your appointment is currently <strong>pending approval</strong>. You will be notified via email once ${employeeName} reviews and approves your request.
            </div>
  `;
  
  return getBaseEmailTemplate(content, 'Appointment Request Submitted - SafeIn');
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


