import { getBaseEmailTemplate } from './base-email.template';

/**
 * Employee Appointment Approval Email Template
 * Sent to employee when they approve an appointment
 */
export function getEmployeeAppointmentApprovalEmailTemplate(
  employeeName: string,
  visitorName: string,
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
                Hi ${employeeName},
            </div>
            
            <div class="message">
                You have approved the appointment request from ${visitorName}.
            </div>
            
            <div class="highlight-box">
                <h3 style="margin-top: 0; color: #1A73E8;">Appointment Details:</h3>
                <p><strong>Date:</strong> ${formattedDate}</p>
                <p><strong>Time:</strong> ${scheduledTime}</p>
                <p><strong>Visitor:</strong> ${visitorName}</p>
            </div>
            
            <div class="message">
                The visitor has been notified of the approval and will arrive at the scheduled time. Please ensure you are available for the meeting and have prepared any necessary materials.
            </div>
  `;
  
  return getBaseEmailTemplate(content, 'Appointment Approved - SafeIn');
}

export function getEmployeeAppointmentApprovalEmailText(
  employeeName: string,
  visitorName: string,
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
Appointment Approved!

Hello ${employeeName},

You have approved the appointment request from ${visitorName}.

Appointment Details:
- Date: ${formattedDate}
- Time: ${scheduledTime}
- Visitor: ${visitorName}

The visitor has been notified of the approval and will arrive at the scheduled time.

Please ensure you are available for the meeting and have prepared any necessary materials.

Best regards,
SafeIn Security Team

Need help? Contact us at support@safein.com
  `;
}

/**
 * Employee Appointment Rejection Email Template
 * Sent to employee when they reject an appointment
 */
export function getEmployeeAppointmentRejectionEmailTemplate(
  employeeName: string,
  visitorName: string,
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
                Hi ${employeeName},
            </div>
            
            <div class="message">
                You have rejected the appointment request from ${visitorName}.
            </div>
            
            <div class="highlight-box" style="background-color: #FFF3CD; border-left: 4px solid #FFC107;">
                <h3 style="margin-top: 0;">Original Appointment Details:</h3>
                <p><strong>Date:</strong> ${formattedDate}</p>
                <p><strong>Time:</strong> ${scheduledTime}</p>
                <p><strong>Visitor:</strong> ${visitorName}</p>
            </div>
            
            <div class="message">
                The visitor has been informed of the rejection and may contact you to reschedule. If you need to provide any feedback or alternative meeting times, please contact the visitor directly.
            </div>
  `;
  
  return getBaseEmailTemplate(content, 'Appointment Rejected - SafeIn');
}

export function getEmployeeAppointmentRejectionEmailText(
  employeeName: string,
  visitorName: string,
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
Appointment Rejected

Hello ${employeeName},

You have rejected the appointment request from ${visitorName}.

Original Appointment Details:
- Date: ${formattedDate}
- Time: ${scheduledTime}
- Visitor: ${visitorName}

The visitor has been informed of the rejection and may contact you to reschedule.

If you need to provide any feedback or alternative meeting times, please contact the visitor directly.

Best regards,
SafeIn Security Team

Need help? Contact us at support@safein.com
  `;
}

