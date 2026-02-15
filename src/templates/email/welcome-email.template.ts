import { getBaseEmailTemplate } from './base-email.template';

/**
 * Welcome Email Template
 * Sent after successful registration
 */
export function getWelcomeEmailTemplate(companyName: string): string {
    const content = `
            <div class="greeting">
                Welcome to ${companyName}
            </div>
            
            <div class="message">
                Hello,<br><br>
                We're thrilled to have you on board! Your account has been successfully created and verified. You can now start managing visitors and appointments with ${companyName}.
            </div>
            
            <div class="highlight-box">
                <h3 style="font-size: 16px; margin-bottom: 12px;">Getting Started:</h3>
                <p>• <strong>Access Dashboard:</strong> Log in to start managing visitors</p>
                <p>• <strong>Profile:</strong> Complete your company information</p>
                <p>• <strong>Team:</strong> Add employees and configure access</p>
                <p>• <strong>Settings:</strong> Customize your security preferences</p>
            </div>
            
            <div class="action-button-container">
                <a href="#" class="action-button">Go to Dashboard</a>
            </div>
            
            <div class="message" style="font-size: 14px; color: #5f6368; border-top: 1px solid #f1f3f4; padding-top: 24px;">
                Our support team is available if you have any questions or need assistance setting up your account.
            </div>
  `;

    return getBaseEmailTemplate(content, `Welcome to ${companyName}`, companyName);
}

export function getWelcomeEmailText(companyName: string): string {
    return `
Welcome to ${companyName}!

Hello,

Congratulations! Your ${companyName} account is now active and ready to use.

Getting Started:
- Log in to your dashboard to start managing visitors
- Set up your company profile and preferences
- Add your first employee to the system
- Configure your security settings

If you have any questions or need assistance getting started, our support team is here to help.

Best regards,
${companyName} Team
  `;
}
