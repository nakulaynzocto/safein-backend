import { getBaseEmailTemplate } from './base-email.template';

/**
 * Appointment Rejection Email Template
 * Sent to visitor when appointment is rejected
 * Modern, Professional, and User-Friendly Design
 */
export function getAppointmentRejectionEmailTemplate(
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
                <div style="display: inline-block; width: 100px; height: 100px; background-color: #fef2f2; border-radius: 50%; padding: 20px; box-sizing: border-box; margin: 0 auto;">
                    <div style="width: 100%; height: 100%; background-color: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                        <span style="font-size: 40px;">❌</span>
                    </div>
                </div>
            </div>

            <div class="greeting" style="text-align: center;">
                Appointment Declined
            </div>
            
            <div class="message">
                Hello <strong>${visitorName}</strong>,<br><br>
                We regret to inform you that your appointment request with <strong>${employeeName}</strong> at <strong>${companyName}</strong> has been declined.
            </div>
            
            <div class="highlight-box">
                <h3 style="color: #074463;">Original Details</h3>
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
            </div>
            
            <div class="info-box">
                <strong>📋 What's Next?</strong><br><br>
                We encourage you to schedule a new appointment at a time that works better for both parties. Our scheduling system is available 24/7.
            </div>
            
            <div class="security-note">
                <strong>💬 Need Assistance?</strong> If you have any questions about this decision or would like to discuss alternative meeting options, please don't hesitate to contact our support team. We're here to help and will do our best to accommodate your needs.
            </div>
  `;

  return getBaseEmailTemplate(content, `Appointment Update - ${companyName}`, companyName);
}

export function getAppointmentRejectionEmailText(
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
Appointment Update

Hello ${visitorName},

We regret to inform you that your appointment with ${employeeName} at ${companyName} has been declined.

Original Appointment Details:
- Date: ${formattedDate}
- Time: ${scheduledTime}
- Employee: ${employeeName}

We apologize for any inconvenience this may cause. Please feel free to schedule a new appointment at a more convenient time.

If you have any questions or need assistance, please don't hesitate to contact us.

Best regards,
${companyName} Team

Need help? Contact us at support@safein.com
  `;
}
