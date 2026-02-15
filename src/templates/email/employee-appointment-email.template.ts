import { getBaseEmailTemplate, formatTo12Hour } from './base-email.template';

/**
 * Employee Appointment Approval Email Template
 * Sent to employee when they approve an appointment
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
  const formattedTime = formatTo12Hour(scheduledTime);

  const content = `
            <div class="greeting">
                Appointment Confirmed
            </div>
            
            <div class="message">
                Hello <strong>${employeeName}</strong>,<br><br>
                You have approved the appointment request from <strong>${visitorName}</strong> at ${companyName}. The visitor has been notified and is expecting to meet with you.
            </div>
            
            <div class="highlight-box">
                <h3 style="font-size: 16px; margin-bottom: 12px;">Confirmed Details:</h3>
                <div class="detail-row">
                    <div class="detail-label">Date</div>
                    <div class="detail-value">${formattedDate}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Time</div>
                    <div class="detail-value">${formattedTime}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Visitor</div>
                    <div class="detail-value">${visitorName}</div>
                </div>
            </div>
            
            <div class="message" style="font-size: 14px; color: #5f6368; border-top: 1px solid #f1f3f4; padding-top: 24px;">
                The visitor will arrive at the scheduled time and check in at the reception. You will receive a notification upon their arrival.
            </div>
  `;

  return getBaseEmailTemplate(content, `Appointment Approved`, companyName);
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
  const formattedTime = formatTo12Hour(scheduledTime);

  return `
Appointment Approved

Hello ${employeeName},

You have approved the appointment request from ${visitorName} at ${companyName}.

Details:
- Date: ${formattedDate}
- Time: ${formattedTime}
- Visitor: ${visitorName}

The visitor has been notified and will arrive at the scheduled time.

Best regards,
${companyName} Team
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
  scheduledTime: string,
  companyName: string = 'SafeIn'
): string {
  const formattedDate = scheduledDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const formattedTime = formatTo12Hour(scheduledTime);

  const content = `
            <div class="greeting">
                Appointment Declined
            </div>
            
            <div class="message">
                Hello <strong>${employeeName}</strong>,<br><br>
                You have declined the appointment request from <strong>${visitorName}</strong> at ${companyName}. The visitor has been notified of this decision.
            </div>
            
            <div class="highlight-box">
                <h3 style="font-size: 16px; margin-bottom: 12px;">Declined Details:</h3>
                <div class="detail-row">
                    <div class="detail-label">Date</div>
                    <div class="detail-value">${formattedDate}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Time</div>
                    <div class="detail-value">${formattedTime}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Visitor</div>
                    <div class="detail-value">${visitorName}</div>
                </div>
            </div>
            
            <div class="message" style="font-size: 14px; color: #5f6368; border-top: 1px solid #f1f3f4; padding-top: 24px;">
                The visitor has been informed. If you'd like to suggest an alternative time, please reach out to the visitor directly.
            </div>
  `;

  return getBaseEmailTemplate(content, `Appointment Declined`, companyName);
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
  const formattedTime = formatTo12Hour(scheduledTime);

  return `
Appointment Declined

Hello ${employeeName},

You have declined the appointment request from ${visitorName} at ${companyName}.

Original Details:
- Date: ${formattedDate}
- Time: ${formattedTime}
- Visitor: ${visitorName}

The visitor has been informed of the rejection.

Best regards,
${companyName} Team
  `;
}


