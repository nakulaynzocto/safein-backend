import { getBaseEmailTemplate } from './base-email.template';

/**
 * Employee Appointment Approval Email Template
 * Sent to employee when they approve an appointment
 * Modern, Professional, and User-Friendly Design
 */
export function getEmployeeAppointmentApprovalEmailTemplate(
  employeeName: string,
  visitorName: string,
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
            <div class="greeting">
                Appointment Confirmation ✅
            </div>
            
            <div class="message">
                Hello ${employeeName},<br><br>
                This is a confirmation that you have successfully approved the appointment request from ${visitorName} at ${companyName}. The visitor has been notified and is expecting to meet with you at the scheduled time.
            </div>
            
            <div class="highlight-box">
                <h3>Confirmed Appointment Details</h3>
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
                        <div class="detail-label">Visitor</div>
                        <div class="detail-value">${visitorName}</div>
                    </div>
                </div>
            </div>
            
            <div class="info-box">
                <strong>✓ Meeting Preparation Checklist:</strong><br><br>
                • Visitor has been notified of approval<br>
                • Appointment is confirmed in the system<br>
                • Please ensure you're available at the scheduled time<br>
                • Prepare any necessary materials or documents<br>
                • Review visitor information if needed
            </div>
            
            <div class="security-note security-success">
                <strong>💡 Reminder:</strong> The visitor will arrive at the scheduled time and check in at the reception desk. You'll receive a notification when they arrive. If you need to reschedule or have any concerns, please contact the visitor directly or update the appointment in your dashboard.
            </div>
  `;

  return getBaseEmailTemplate(content, `Appointment Approved - ${companyName}`, companyName);
}

export function getEmployeeAppointmentApprovalEmailText(
  employeeName: string,
  visitorName: string,
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

Hello ${employeeName},

You have approved the appointment request from ${visitorName} at ${companyName}.

Appointment Details:
- Date: ${formattedDate}
- Time: ${scheduledTime}
- Visitor: ${visitorName}

The visitor has been notified of the approval and will arrive at the scheduled time.

Please ensure you are available for the meeting and have prepared any necessary materials.

Best regards,
${companyName} Team
  `;
}

/**
 * Employee Appointment Rejection Email Template
 * Sent to employee when they reject an appointment
 * Modern, Professional, and User-Friendly Design
 */
export function getEmployeeAppointmentRejectionEmailTemplate(
  employeeName: string,
  visitorName: string,
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
            <div class="greeting">
                Appointment Request Declined
            </div>
            
            <div class="message">
                Hello ${employeeName},<br><br>
                This is a confirmation that you have declined the appointment request from ${visitorName} at ${companyName}. The visitor has been notified of this decision.
            </div>
            
            <div class="info-card" style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border-left: 5px solid #f59e0b;">
                <h3 style="color: #92400e;">Declined Appointment Details</h3>
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
                        <div class="detail-label">Visitor</div>
                        <div class="detail-value">${visitorName}</div>
                    </div>
                </div>
            </div>
            
            <div class="info-box">
                <strong>📋 What Happens Next:</strong><br><br>
                • The visitor has been automatically notified of the rejection<br>
                • They may contact you directly to discuss alternative options<br>
                • You can view this and other appointment requests in your dashboard<br>
                • If you'd like to suggest alternative meeting times, please reach out to the visitor
            </div>
            
            <div class="security-note">
                <strong>💬 Optional Follow-up:</strong> If you'd like to provide feedback or suggest alternative meeting times, you can contact ${visitorName} directly. This helps maintain good communication and may lead to a successful rescheduled appointment.
            </div>
  `;

  return getBaseEmailTemplate(content, `Appointment Rejected - ${companyName}`, companyName);
}

export function getEmployeeAppointmentRejectionEmailText(
  employeeName: string,
  visitorName: string,
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
Appointment Rejected

Hello ${employeeName},

You have rejected the appointment request from ${visitorName} at ${companyName}.

Original Appointment Details:
- Date: ${formattedDate}
- Time: ${scheduledTime}
- Visitor: ${visitorName}

The visitor has been informed of the rejection and may contact you to reschedule.

If you need to provide any feedback or alternative meeting times, please contact the visitor directly.

Best regards,
${companyName} Team
  `;
}
