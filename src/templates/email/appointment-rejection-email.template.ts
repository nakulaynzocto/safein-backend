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
  scheduledTime: string
): string {
  const formattedDate = scheduledDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const content = `
            <div class="greeting">
                Appointment Update
            </div>
            
            <div class="message">
                Hello ${visitorName},<br><br>
                We regret to inform you that your appointment request with ${employeeName} has been declined. We understand this may be disappointing, and we sincerely apologize for any inconvenience this may cause.
            </div>
            
            <div class="info-card" style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border-left: 5px solid #f59e0b;">
                <h3 style="color: #92400e;">Original Appointment Request</h3>
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
                        <div class="detail-label">Employee</div>
                        <div class="detail-value">${employeeName}</div>
                    </div>
                </div>
            </div>
            
            <div class="info-box">
                <strong>📋 What's Next?</strong><br><br>
                We encourage you to schedule a new appointment at a time that works better for both parties. Our scheduling system is available 24/7, and you can book a new appointment at your convenience.
            </div>
            
            <div class="security-note">
                <strong>💬 Need Assistance?</strong> If you have any questions about this decision or would like to discuss alternative meeting options, please don't hesitate to contact our support team. We're here to help and will do our best to accommodate your needs.
            </div>
  `;
  
  return getBaseEmailTemplate(content, 'Appointment Update - SafeIn');
}

export function getAppointmentRejectionEmailText(
  visitorName: string,
  employeeName: string,
  scheduledDate: Date,
  scheduledTime: string
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

We regret to inform you that your appointment with ${employeeName} has been declined.

Original Appointment Details:
- Date: ${formattedDate}
- Time: ${scheduledTime}
- Employee: ${employeeName}

We apologize for any inconvenience this may cause. Please feel free to schedule a new appointment at a more convenient time.

If you have any questions or need assistance, please don't hesitate to contact us.

Best regards,
SafeIn Security Team

Need help? Contact us at support@safein.com
  `;
}
