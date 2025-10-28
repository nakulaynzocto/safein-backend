import { getBaseEmailTemplate } from './base-email.template';

/**
 * Welcome Email Template
 * Sent after successful registration
 */
export function getWelcomeEmailTemplate(companyName: string): string {
  const content = `
            <div class="greeting">
                Hi ${companyName},
            </div>
            
            <div class="message">
                Welcome to SafeIn! Your account has been created and verified successfully.
            </div>
            
            <div class="highlight-box">
                <h3 style="margin-top: 0; color: #1A73E8;">Get Started:</h3>
                <ul style="text-align: left; padding-left: 20px;">
                    <li>Log in to your dashboard to start managing visitors</li>
                    <li>Set up your company profile and preferences</li>
                    <li>Add your first employee to the system</li>
                    <li>Configure your security settings</li>
                </ul>
            </div>
            
            <div class="message">
                Your account includes secure visitor registration, appointment scheduling, real-time notifications, comprehensive reporting, and 24/7 security monitoring.
            </div>
            
            <a href="#" class="action-button">Access Your Dashboard</a>
            
            <div class="security-note">
                If you have any questions or need assistance, please contact our support team at support@safein.com
            </div>
  `;
  
  return getBaseEmailTemplate(content, 'Welcome to SafeIn');
}

export function getWelcomeEmailText(companyName: string): string {
  return `
Welcome to SafeIn!

Hello ${companyName},

Congratulations! Your SafeIn Security Management System account is now active and ready to use.

What's Next?
- Log in to your dashboard to start managing visitors
- Set up your company profile and preferences
- Add your first employee to the system
- Configure your security settings

Your account includes:
- Secure visitor registration
- Appointment scheduling
- Real-time notifications
- Comprehensive reporting
- 24/7 security monitoring

If you have any questions or need assistance getting started, our support team is here to help.

Best regards,
SafeIn Security Team

Need help? Contact us at support@safein.com

SafeIn Security Management System
Professional Visitor Management Solutions
  `;
}

