import { getBaseEmailTemplate } from './base-email.template';

/**
 * Welcome Email Template
 * Sent after successful registration
 */
export function getWelcomeEmailTemplate(companyName: string): string {
    const content = `
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; width: 100px; height: 100px; background-color: #e3f2fd; border-radius: 50%; padding: 20px; box-sizing: border-box; margin: 0 auto;">
                    <div style="width: 100%; height: 100%; background-color: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                        <span style="font-size: 40px;">👋</span>
                    </div>
                </div>
            </div>

            <div class="greeting" style="text-align: center;">
                Welcome to ${companyName}!
            </div>
            
            <div class="message">
                We're thrilled to have you on board! Your <strong>${companyName}</strong> account has been successfully created and verified.
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
                <strong>💡 Pro Tip:</strong> Our support team is available 24/7 to help you get started. If you have any questions or need assistance setting up your account, don't hesitate to reach out to our support team.
            </div>
  `;

    return getBaseEmailTemplate(content, `Welcome to ${companyName}`, companyName);
}

export function getWelcomeEmailText(companyName: string): string {
    return `
Welcome to ${companyName}!

Hello ${companyName},

Congratulations! Your ${companyName} Security Management System account is now active and ready to use.

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
${companyName} Team

${companyName} Security Management System
Professional Visitor Management Solutions
  `;
}
