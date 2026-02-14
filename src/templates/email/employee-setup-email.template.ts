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
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <h2 style="color: #1A73E8; text-align: center; margin-bottom: 30px;">
        Welcome to ${companyName}! 👋
      </h2>
      
      <p style="font-size: 16px; line-height: 1.6; color: #333;">
        Hello <strong>${employeeName}</strong>,
      </p>
      
      <p style="font-size: 16px; line-height: 1.6; color: #333;">
        Your employee account has been created on ${companyName} Visitor Management System. 
        To get started, you need to set up your password.
      </p>
      
      <div style="text-align: center; margin: 40px 0;">
        <a href="${setupUrl}" 
           style="display: inline-block; background-color: #1A73E8; color: white; 
                  padding: 14px 32px; text-decoration: none; border-radius: 6px; 
                  font-weight: bold; font-size: 16px;">
          Set Up Your Password
        </a>
      </div>
      
      <p style="font-size: 14px; line-height: 1.6; color: #666; margin-top: 30px;">
        Or copy and paste this link into your browser:
      </p>
      <p style="font-size: 12px; color: #999; word-break: break-all;">
        ${setupUrl}
      </p>
      
      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 30px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #856404;">
          <strong>⏰ Important:</strong> This link will expire in 7 days. Please set up your password as soon as possible.
        </p>
      </div>
      
      <p style="font-size: 14px; line-height: 1.6; color: #666; margin-top: 30px;">
        Once you've set up your password, you'll be able to:
      </p>
      <ul style="font-size: 14px; line-height: 1.8; color: #666;">
        <li>Access your Employee Dashboard</li>
        <li>View and manage your appointments</li>
        <li>Approve or reject visitor appointments</li>
        <li>Send appointment booking links to visitors</li>
      </ul>
      
      <p style="font-size: 14px; line-height: 1.6; color: #666; margin-top: 30px;">
        If you have any questions, please contact your administrator.
      </p>
      
      <p style="font-size: 14px; line-height: 1.6; color: #666; margin-top: 30px;">
        Best regards,<br>
        <strong>${companyName} Team</strong>
      </p>
    </div>
  `;

  return getBaseEmailTemplate(content, `Welcome to ${companyName} - Set Up Your Account`, companyName);
}

export function getEmployeeSetupEmailText(
  employeeName: string,
  setupUrl: string,
  companyName: string = 'SafeIn'
): string {
  return `
Welcome to ${companyName}!

Hello ${employeeName},

Your employee account has been created on ${companyName} Visitor Management System. 
To get started, you need to set up your password.

Set up your password by clicking this link:
${setupUrl}

⏰ Important: This link will expire in 7 days. Please set up your password as soon as possible.

Once you've set up your password, you'll be able to:
- Access your Employee Dashboard
- View and manage your appointments
- Approve or reject visitor appointments
- Send appointment booking links to visitors

If you have any questions, please contact your administrator.

Best regards,
${companyName} Team
  `.trim();
}
