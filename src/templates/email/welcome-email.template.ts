import { getBaseEmailTemplate } from './base-email.template';

/**
 * Welcome Email Template
 * Sent after successful registration
 */
export function getWelcomeEmailTemplate(companyName: string): string {
  const content = `
            <div class="greeting">
                Welcome to SafeIn, ${companyName}!
            </div>
            
            <div class="message">
                We're thrilled to have you on board! Your SafeIn account has been successfully created and verified. You now have access to a comprehensive visitor management system designed to enhance security and streamline your operations.
            </div>
            
            <div class="highlight-box">
                <h3>Get Started in 4 Easy Steps:</h3>
                <ul>
                    <li><strong>Access Your Dashboard:</strong> Log in to start managing visitors and appointments</li>
                    <li><strong>Complete Your Profile:</strong> Set up your company information and preferences</li>
                    <li><strong>Add Team Members:</strong> Invite employees and configure their access levels</li>
                    <li><strong>Configure Settings:</strong> Customize security settings and notification preferences</li>
                </ul>
            </div>
            
            <div class="message">
                <strong>What's Included in Your Account:</strong><br><br>
                ✓ Secure visitor registration and check-in<br>
                ✓ Advanced appointment scheduling system<br>
                ✓ Real-time notifications and alerts<br>
                ✓ Comprehensive reporting and analytics<br>
                ✓ 24/7 security monitoring and support<br>
                ✓ Mobile-friendly access from any device
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="#" class="action-button">Access Your Dashboard</a>
            </div>
            
            <div class="security-note security-success">
                <strong>💡 Pro Tip:</strong> Our support team is available 24/7 to help you get started. If you have any questions or need assistance setting up your account, don't hesitate to reach out to us at <a href="mailto:support@safein.com" style="color: #1A73E8; text-decoration: none;">support@safein.com</a>
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

