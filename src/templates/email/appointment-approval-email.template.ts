import { getBaseEmailTemplate } from './base-email.template';

/**
 * Appointment Approval Email Template
 * Sent to visitor when appointment is approved
 * Modern, Professional, and User-Friendly Design
 */
export function getAppointmentApprovalEmailTemplate(
  visitorName: string,
  employeeName: string,
  scheduledDate: Date,
  scheduledTime: string,
  companyName: string = 'SafeIn'
): string {
  const formattedDate = scheduledDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const content = `
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; width: 100px; height: 100px; background-color: #e3f2fd; border-radius: 50%; padding: 20px; box-sizing: border-box; margin: 0 auto;">
                    <div style="width: 100%; height: 100%; background-color: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                        <span style="font-size: 40px;">✅</span>
                    </div>
                </div>
            </div>

            <div class="greeting" style="text-align: center;">
                Appointment Confirmed
            </div>
            
            <div class="message">
                Hello <strong>${visitorName}</strong>,<br><br>
                Great news! Your appointment request with <strong>${companyName}</strong> has been approved. We're looking forward to meeting with you.
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
            </div>
            
            <div class="info-box">
                <strong>📌 Important Reminders:</strong><br><br>
                • Please arrive <strong>10 minutes early</strong> to allow time for security check-in<br>
                • Bring a <strong>valid government-issued photo ID</strong> (driver's license, passport, etc.)<br>
                • Check in at the reception desk upon arrival<br>
                • If you're running late, please notify us as soon as possible
            </div>
            
            <div class="security-note security-success">
                <strong>💡 Need to Reschedule?</strong> If you need to change your appointment time, please contact us at least 24 hours in advance. You can also reach out to ${employeeName} directly if you have any questions about the meeting.
            </div>
  `;

  return getBaseEmailTemplate(content, `Appointment Approved - ${companyName}`, companyName);
}

export function getAppointmentApprovalEmailText(
  visitorName: string,
  employeeName: string,
  scheduledDate: Date,
  scheduledTime: string,
  companyName: string = 'SafeIn'
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

Great news! Your appointment with ${employeeName} at ${companyName} has been approved.

Appointment Details:
- Date: ${formattedDate}
- Time: ${scheduledTime}
- Employee: ${employeeName}

Please arrive 10 minutes before your scheduled time and bring a valid ID for security clearance.

If you need to reschedule or have any questions, please contact us in advance.

Best regards,
${companyName} Team
  `;
}
