import { getBaseEmailTemplate } from './base-email.template';

/**
 * Employee Setup Email Template
 * Sent to employee when admin creates their account
 */
export function getEmployeeSetupEmailTemplate(
  employeeName: string,
  setupUrl: string,
  companyName: string = 'SafeIn'
): string {
  const content = `
            <div class="greeting">
                Welcome to ${companyName}
            </div>
            
            <div class="message">
                Hello <strong>${employeeName}</strong>,<br><br>
                Your employee account has been created on the <strong>${companyName}</strong> Visitor Management System. To get started, please set up your password:
            </div>
            
            <div class="action-button-container">
                <a href="${setupUrl}" class="action-button">Set Up Account</a>
            </div>
            
            <div class="highlight-box">
                <h3 style="font-size: 16px; margin-bottom: 12px;">What you can do:</h3>
                <p>• Manage your appointments</p>
                <p>• Approve or decline visitor requests</p>
                <p>• Send booking links to visitors</p>
            </div>

            <div class="security-note" style="text-align: center;">
                This setup link will expire in <strong>7 days</strong>.
            </div>

            <div style="font-size: 12px; color: #bdc1c6; margin-top: 16px; word-break: break-all;">
                If the button above doesn't work, copy and paste this link into your browser:<br>
                ${setupUrl}
            </div>
  `;

  return getBaseEmailTemplate(content, `Welcome to ${companyName}`, companyName);
}

export function getEmployeeSetupEmailText(
  employeeName: string,
  setupUrl: string,
  companyName: string = 'SafeIn'
): string {
  return `
Welcome to ${companyName}!

Hello ${employeeName},

Your employee account has been created on the ${companyName} Visitor Management System. 

Set up your password here:
${setupUrl}

This link will expire in 7 days.

Best regards,
${companyName} Team
  `.trim();
}

