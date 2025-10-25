import nodemailer from 'nodemailer';
import { AppError } from '../../middlewares/errorHandler';
import { ERROR_CODES } from '../../utils/constants';

export class EmailService {
  private static transporter: nodemailer.Transporter;
  private static isEmailServiceAvailable: boolean = false;

  /**
   * Initialize email transporter
   */
  static initializeTransporter(): nodemailer.Transporter {
    // Return existing transporter if already initialized
    if (this.transporter && this.isEmailServiceAvailable) {
      return this.transporter;
    }

    // For Gmail, we need to use OAuth2 or App Password
    // Since we have regular credentials, let's try different SMTP configurations
    const smtpConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || 'info@aynzo.com',
        pass: process.env.SMTP_PASS || 'S#j+#Ap'
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 10000, // 10 seconds timeout
      greetingTimeout: 10000,
      socketTimeout: 10000
    };

    // Create transporter
    this.transporter = nodemailer.createTransport(smtpConfig);
    return this.transporter;
  }

  /**
   * Verify SMTP connection
   */
  static async verifyConnection(): Promise<boolean> {
    try {
      if (!this.transporter) {
        this.initializeTransporter();
      }
      
      await this.transporter.verify();
      console.log('✅ SMTP connection verified successfully');
      this.isEmailServiceAvailable = true;
      return true;
    } catch (error: any) {
      console.error('❌ SMTP connection failed:', error.message);
      this.isEmailServiceAvailable = false;
      
      // If Gmail authentication fails, try alternative SMTP configurations
      if (error.code === 'EAUTH' && process.env.SMTP_HOST === 'smtp.gmail.com') {
        console.log('🔄 Trying alternative SMTP configurations...');
        return await this.tryAlternativeSmtpConfigs();
      }
      
      return false;
    }
  }

  /**
   * Try alternative SMTP configurations
   */
  private static async tryAlternativeSmtpConfigs(): Promise<boolean> {
    const alternatives = [
      {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.SMTP_USER || 'info@aynzo.com',
          pass: process.env.SMTP_PASS || 'S#j+#Ap'
        }
      },
      {
        host: 'smtp.outlook.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER || 'info@aynzo.com',
          pass: process.env.SMTP_PASS || 'S#j+#Ap'
        }
      }
    ];

    for (const config of alternatives) {
      try {
        console.log(`🔄 Trying ${config.host}:${config.port}...`);
        this.transporter = nodemailer.createTransport(config);
        await this.transporter.verify();
        console.log(`✅ SMTP connection successful with ${config.host}:${config.port}`);
        this.isEmailServiceAvailable = true;
        return true;
      } catch (error: any) {
        console.log(`❌ Failed with ${config.host}:${config.port} - ${error.message}`);
        continue;
      }
    }

    console.log('❌ All SMTP configurations failed. Email functionality will be disabled.');
    this.isEmailServiceAvailable = false;
    return false;
  }

  /**
   * Send OTP email
   */
  static async sendOtpEmail(email: string, otp: string, companyName: string): Promise<void> {
    try {
      // Check if email service is available
      if (!this.isEmailServiceAvailable) {
        console.warn('⚠️ Email service not available. OTP will be logged to console.');
        // In development or when email is not configured, log OTP to console
        console.log(`📧 OTP for ${email}: ${otp}`);
        return;
      }

      if (!this.transporter) {
        this.initializeTransporter();
      }

      const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME || 'SafeIn Security Management'}" <${process.env.SMTP_FROM_EMAIL || 'info@aynzo.com'}>`,
        to: email,
        subject: 'SafeIn Registration - Verify Your Email',
        html: this.getOtpEmailTemplate(otp, companyName),
        text: this.getOtpEmailText(otp, companyName)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ OTP email sent successfully:', result.messageId);
    } catch (error: any) {
      console.error('❌ Failed to send OTP email:', error.message);
      
      // If email fails, log the OTP to console for development/testing
      console.log(`📧 OTP for ${email}: ${otp}`);
      
      // Don't throw error in production - allow user to continue with logged OTP
      if (process.env.NODE_ENV !== 'production') {
        throw new AppError('Failed to send OTP email', ERROR_CODES.INTERNAL_SERVER_ERROR);
      }
    }
  }

  /**
   * Get OTP email HTML template
   */
  private static getOtpEmailTemplate(otp: string, companyName: string): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SafeIn Registration Verification</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background-color: #ffffff;
                padding: 40px;
                border-radius: 10px;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                background-color: #3882a5;
                color: white;
                padding: 15px 25px;
                border-radius: 8px;
                display: inline-block;
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 20px;
            }
            .otp-box {
                background-color: #f8f9fa;
                border: 2px solid #3882a5;
                border-radius: 8px;
                padding: 20px;
                text-align: center;
                margin: 30px 0;
            }
            .otp-code {
                font-size: 32px;
                font-weight: bold;
                color: #3882a5;
                letter-spacing: 5px;
                font-family: 'Courier New', monospace;
            }
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                font-size: 14px;
                color: #666;
            }
            .button {
                display: inline-block;
                background-color: #3882a5;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">SafeIn</div>
                <h1>Email Verification Required</h1>
            </div>
            
            <p>Hello ${companyName},</p>
            
            <p>Thank you for registering with SafeIn Security Management System. To complete your registration and secure your account, please verify your email address using the OTP below:</p>
            
            <div class="otp-box">
                <p><strong>Your Verification Code:</strong></p>
                <div class="otp-code">${otp}</div>
                <p><small>This code will expire in 10 minutes</small></p>
            </div>
            
            <p>Enter this code in the registration form to complete your account setup.</p>
            
            <p><strong>Important Security Notes:</strong></p>
            <ul>
                <li>This OTP is valid for 10 minutes only</li>
                <li>Never share this code with anyone</li>
                <li>If you didn't request this registration, please ignore this email</li>
            </ul>
            
            <p>If you have any questions or need assistance, please contact our support team.</p>
            
            <div class="footer">
                <p>Best regards,<br>
                <strong>SafeIn Security Team</strong></p>
                
                <p>This is an automated message. Please do not reply to this email.</p>
                
                <p style="font-size: 12px; color: #999;">
                    SafeIn Security Management System<br>
                    Professional Visitor Management Solutions
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Get OTP email text version
   */
  private static getOtpEmailText(otp: string, companyName: string): string {
    return `
SafeIn Registration Verification

Hello ${companyName},

Thank you for registering with SafeIn Security Management System.

Your verification code is: ${otp}

This code will expire in 10 minutes.

Enter this code in the registration form to complete your account setup.

Important Security Notes:
- This OTP is valid for 10 minutes only
- Never share this code with anyone
- If you didn't request this registration, please ignore this email

If you have any questions or need assistance, please contact our support team.

Best regards,
SafeIn Security Team

This is an automated message. Please do not reply to this email.

SafeIn Security Management System
Professional Visitor Management Solutions
    `;
  }

  /**
   * Send welcome email after successful registration
   */
  static async sendWelcomeEmail(email: string, companyName: string): Promise<void> {
    try {
      if (!this.transporter) {
        this.initializeTransporter();
      }

      const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME || 'SafeIn Security Management'}" <${process.env.SMTP_FROM_EMAIL || 'info@aynzo.com'}>`,
        to: email,
        subject: 'Welcome to SafeIn - Your Account is Ready!',
        html: this.getWelcomeEmailTemplate(companyName),
        text: this.getWelcomeEmailText(companyName)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Welcome email sent successfully:', result.messageId);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Don't throw error for welcome email failure
    }
  }

  /**
   * Get welcome email HTML template
   */
  private static getWelcomeEmailTemplate(companyName: string): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to SafeIn</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background-color: #ffffff;
                padding: 40px;
                border-radius: 10px;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                background-color: #3882a5;
                color: white;
                padding: 15px 25px;
                border-radius: 8px;
                display: inline-block;
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 20px;
            }
            .success-box {
                background-color: #d4edda;
                border: 1px solid #c3e6cb;
                border-radius: 8px;
                padding: 20px;
                text-align: center;
                margin: 30px 0;
            }
            .button {
                display: inline-block;
                background-color: #3882a5;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
            }
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                font-size: 14px;
                color: #666;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">SafeIn logo add krna hai</div>
                <h1>Welcome to SafeIn!</h1>
            </div>
            
            <div class="success-box">
                <h2>🎉 Registration Successful!</h2>
                <p>Your account has been created and verified successfully.</p>
            </div>
            
            <p>Hello ${companyName},</p>
            
            <p>Congratulations! Your SafeIn Security Management System account is now active and ready to use.</p>
            
            <p><strong>What's Next?</strong></p>
            <ul>
                <li>Log in to your dashboard to start managing visitors</li>
                <li>Set up your company profile and preferences</li>
                <li>Add your first employee to the system</li>
                <li>Configure your security settings</li>
            </ul>
            
            <p>Your account includes:</p>
            <ul>
                <li>✅ Secure visitor registration</li>
                <li>✅ Appointment scheduling</li>
                <li>✅ Real-time notifications</li>
                <li>✅ Comprehensive reporting</li>
                <li>✅ 24/7 security monitoring</li>
            </ul>
            
            <div style="text-align: center;">
                <a href="#" class="button">Access Your Dashboard</a>
            </div>
            
            <p>If you have any questions or need assistance getting started, our support team is here to help.</p>
            
            <div class="footer">
                <p>Best regards,<br>
                <strong>SafeIn Security Team</strong></p>
                
                <p>Need help? Contact us at support@safein.com</p>
                
                <p style="font-size: 12px; color: #999;">
                    SafeIn Security Management System<br>
                    Professional Visitor Management Solutions
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Get welcome email text version
   */
  private static getWelcomeEmailText(companyName: string): string {
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
✅ Secure visitor registration
✅ Appointment scheduling
✅ Real-time notifications
✅ Comprehensive reporting
✅ 24/7 security monitoring

If you have any questions or need assistance getting started, our support team is here to help.

Best regards,
SafeIn Security Team

Need help? Contact us at support@safein.com

SafeIn Security Management System
Professional Visitor Management Solutions
    `;
  }

  /**
   * Send appointment approval email to visitor
   */
  static async sendAppointmentApprovalEmail(
    visitorEmail: string,
    visitorName: string,
    employeeName: string,
    scheduledDate: Date,
    scheduledTime: string
  ): Promise<void> {
    // Check if email service is available
    if (!this.isEmailServiceAvailable) {
      console.warn('⚠️ Email service not available. Skipping appointment approval email.');
      return;
    }

    // Use existing transporter instead of recreating
    if (!this.transporter) {
      this.initializeTransporter();
    }
    
    const mailOptions = {
      from: `${process.env.SMTP_FROM_NAME || 'SafeIn'} <${process.env.SMTP_FROM_EMAIL || 'noreply@safein.com'}>`,
      to: visitorEmail,
      subject: 'Appointment Approved - SafeIn',
      html: this.getAppointmentApprovalEmailTemplate(visitorName, employeeName, scheduledDate, scheduledTime),
      text: this.getAppointmentApprovalEmailText(visitorName, employeeName, scheduledDate, scheduledTime)
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Appointment approval email sent to ${visitorEmail}`);
    } catch (error: any) {
      console.error('❌ Failed to send appointment approval email:', error.message);
      // Don't throw error - just log it
    }
  }

  /**
   * Send appointment rejection email to visitor
   */
  static async sendAppointmentRejectionEmail(
    visitorEmail: string,
    visitorName: string,
    employeeName: string,
    scheduledDate: Date,
    scheduledTime: string
  ): Promise<void> {
    // Check if email service is available
    if (!this.isEmailServiceAvailable) {
      console.warn('⚠️ Email service not available. Skipping appointment rejection email.');
      return;
    }

    // Use existing transporter instead of recreating
    if (!this.transporter) {
      this.initializeTransporter();
    }
    
    const mailOptions = {
      from: `${process.env.SMTP_FROM_NAME || 'SafeIn'} <${process.env.SMTP_FROM_EMAIL || 'noreply@safein.com'}>`,
      to: visitorEmail,
      subject: 'Appointment Update - SafeIn',
      html: this.getAppointmentRejectionEmailTemplate(visitorName, employeeName, scheduledDate, scheduledTime),
      text: this.getAppointmentRejectionEmailText(visitorName, employeeName, scheduledDate, scheduledTime)
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Appointment rejection email sent to ${visitorEmail}`);
    } catch (error: any) {
      console.error('❌ Failed to send appointment rejection email:', error.message);
      // Don't throw error - just log it
    }
  }

  /**
   * Get appointment approval email HTML template
   */
  private static getAppointmentApprovalEmailTemplate(
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
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Appointment Approved - SafeIn</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #3882a5; }
            .logo { font-size: 24px; font-weight: bold; color: #3882a5; }
            .content { padding: 20px 0; }
            .highlight { background-color: #e8f5e8; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745; margin: 20px 0; }
            .appointment-details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">SafeIn</div>
                <p>Security Management System</p>
            </div>
            
            <div class="content">
                <h2>Appointment Approved! 🎉</h2>
                
                <p>Hello <strong>${visitorName}</strong>,</p>
                
                <div class="highlight">
                    <p><strong>Great news!</strong> Your appointment with <strong>${employeeName}</strong> has been approved.</p>
                </div>
                
                <div class="appointment-details">
                    <h3>Appointment Details:</h3>
                    <p><strong>Date:</strong> ${formattedDate}</p>
                    <p><strong>Time:</strong> ${scheduledTime}</p>
                    <p><strong>Employee:</strong> ${employeeName}</p>
                </div>
                
                <p>Please arrive 10 minutes before your scheduled time and bring a valid ID for security clearance.</p>
                
                <p>If you need to reschedule or have any questions, please contact us in advance.</p>
            </div>
            
            <div class="footer">
                <p>Best regards,<br><strong>SafeIn Security Team</strong></p>
                <p>Need help? Contact us at support@safein.com</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Get appointment approval email text version
   */
  private static getAppointmentApprovalEmailText(
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
Appointment Approved! 🎉

Hello ${visitorName},

Great news! Your appointment with ${employeeName} has been approved.

Appointment Details:
- Date: ${formattedDate}
- Time: ${scheduledTime}
- Employee: ${employeeName}

Please arrive 10 minutes before your scheduled time and bring a valid ID for security clearance.

If you need to reschedule or have any questions, please contact us in advance.

Best regards,
SafeIn Security Team

Need help? Contact us at support@safein.com
    `;
  }

  /**
   * Get appointment rejection email HTML template
   */
  private static getAppointmentRejectionEmailTemplate(
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
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Appointment Update - SafeIn</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #3882a5; }
            .logo { font-size: 24px; font-weight: bold; color: #3882a5; }
            .content { padding: 20px 0; }
            .highlight { background-color: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; margin: 20px 0; }
            .appointment-details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">SafeIn</div>
                <p>Security Management System</p>
            </div>
            
            <div class="content">
                <h2>Appointment Update</h2>
                
                <p>Hello <strong>${visitorName}</strong>,</p>
                
                <div class="highlight">
                    <p>We regret to inform you that your appointment with <strong>${employeeName}</strong> has been declined.</p>
                </div>
                
                <div class="appointment-details">
                    <h3>Original Appointment Details:</h3>
                    <p><strong>Date:</strong> ${formattedDate}</p>
                    <p><strong>Time:</strong> ${scheduledTime}</p>
                    <p><strong>Employee:</strong> ${employeeName}</p>
                </div>
                
                <p>We apologize for any inconvenience this may cause. Please feel free to schedule a new appointment at a more convenient time.</p>
                
                <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
            </div>
            
            <div class="footer">
                <p>Best regards,<br><strong>SafeIn Security Team</strong></p>
                <p>Need help? Contact us at support@safein.com</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Get appointment rejection email text version
   */
  private static getAppointmentRejectionEmailText(
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

  /**
   * Send appointment approval email to employee
   */
  static async sendEmployeeAppointmentApprovalEmail(
    employeeEmail: string,
    employeeName: string,
    visitorName: string,
    scheduledDate: Date,
    scheduledTime: string
  ): Promise<void> {
    const transporter = this.initializeTransporter();
    
    const mailOptions = {
      from: `${process.env.SMTP_FROM_NAME || 'SafeIn'} <${process.env.SMTP_FROM_EMAIL || 'noreply@safein.com'}>`,
      to: employeeEmail,
      subject: 'Appointment Approved - SafeIn',
      html: this.getEmployeeAppointmentApprovalEmailTemplate(employeeName, visitorName, scheduledDate, scheduledTime),
      text: this.getEmployeeAppointmentApprovalEmailText(employeeName, visitorName, scheduledDate, scheduledTime)
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Appointment approval email sent to employee ${employeeEmail}`);
    } catch (error) {
      console.error('Failed to send appointment approval email to employee:', error);
      throw error;
    }
  }

  /**
   * Send appointment rejection email to employee
   */
  static async sendEmployeeAppointmentRejectionEmail(
    employeeEmail: string,
    employeeName: string,
    visitorName: string,
    scheduledDate: Date,
    scheduledTime: string
  ): Promise<void> {
    const transporter = this.initializeTransporter();
    
    const mailOptions = {
      from: `${process.env.SMTP_FROM_NAME || 'SafeIn'} <${process.env.SMTP_FROM_EMAIL || 'noreply@safein.com'}>`,
      to: employeeEmail,
      subject: 'Appointment Rejected - SafeIn',
      html: this.getEmployeeAppointmentRejectionEmailTemplate(employeeName, visitorName, scheduledDate, scheduledTime),
      text: this.getEmployeeAppointmentRejectionEmailText(employeeName, visitorName, scheduledDate, scheduledTime)
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Appointment rejection email sent to employee ${employeeEmail}`);
    } catch (error) {
      console.error('Failed to send appointment rejection email to employee:', error);
      throw error;
    }
  }

  /**
   * Get employee appointment approval email HTML template
   */
  private static getEmployeeAppointmentApprovalEmailTemplate(
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
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Appointment Approved - SafeIn</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #3882a5; }
            .logo { font-size: 24px; font-weight: bold; color: #3882a5; }
            .content { padding: 20px 0; }
            .highlight { background-color: #e8f5e8; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745; margin: 20px 0; }
            .appointment-details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">SafeIn</div>
                <p>Security Management System</p>
            </div>
            
            <div class="content">
                <h2>Appointment Approved! ✅</h2>
                
                <p>Hello <strong>${employeeName}</strong>,</p>
                
                <div class="highlight">
                    <p><strong>Great news!</strong> You have approved the appointment request from <strong>${visitorName}</strong>.</p>
                </div>
                
                <div class="appointment-details">
                    <h3>Appointment Details:</h3>
                    <p><strong>Date:</strong> ${formattedDate}</p>
                    <p><strong>Time:</strong> ${scheduledTime}</p>
                    <p><strong>Visitor:</strong> ${visitorName}</p>
                </div>
                
                <p>The visitor has been notified of the approval and will arrive at the scheduled time.</p>
                
                <p>Please ensure you are available for the meeting and have prepared any necessary materials.</p>
            </div>
            
            <div class="footer">
                <p>Best regards,<br><strong>SafeIn Security Team</strong></p>
                <p>Need help? Contact us at support@safein.com</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Get employee appointment approval email text version
   */
  private static getEmployeeAppointmentApprovalEmailText(
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
Appointment Approved! ✅

Hello ${employeeName},

Great news! You have approved the appointment request from ${visitorName}.

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
   * Get employee appointment rejection email HTML template
   */
  private static getEmployeeAppointmentRejectionEmailTemplate(
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
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Appointment Rejected - SafeIn</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #3882a5; }
            .logo { font-size: 24px; font-weight: bold; color: #3882a5; }
            .content { padding: 20px 0; }
            .highlight { background-color: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; margin: 20px 0; }
            .appointment-details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">SafeIn</div>
                <p>Security Management System</p>
            </div>
            
            <div class="content">
                <h2>Appointment Rejected</h2>
                
                <p>Hello <strong>${employeeName}</strong>,</p>
                
                <div class="highlight">
                    <p>You have rejected the appointment request from <strong>${visitorName}</strong>.</p>
                </div>
                
                <div class="appointment-details">
                    <h3>Original Appointment Details:</h3>
                    <p><strong>Date:</strong> ${formattedDate}</p>
                    <p><strong>Time:</strong> ${scheduledTime}</p>
                    <p><strong>Visitor:</strong> ${visitorName}</p>
                </div>
                
                <p>The visitor has been informed of the rejection and may contact you to reschedule.</p>
                
                <p>If you need to provide any feedback or alternative meeting times, please contact the visitor directly.</p>
            </div>
            
            <div class="footer">
                <p>Best regards,<br><strong>SafeIn Security Team</strong></p>
                <p>Need help? Contact us at support@safein.com</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Get employee appointment rejection email text version
   */
  private static getEmployeeAppointmentRejectionEmailText(
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

  /**
   * Send new appointment request email to employee
   */
  static async sendNewAppointmentRequestEmail(
    employeeEmail: string,
    employeeName: string,
    visitorDetails: any,
    scheduledDate: Date,
    scheduledTime: string,
    purpose: string,
    appointmentId: string
  ): Promise<void> {
    // Check if email service is available
    if (!this.isEmailServiceAvailable) {
      console.warn('⚠️ Email service not available. Skipping appointment notification email.');
      return;
    }

    // Use existing transporter instead of recreating
    if (!this.transporter) {
      this.initializeTransporter();
    }
    
    const mailOptions = {
      from: `${process.env.SMTP_FROM_NAME || 'SafeIn'} <${process.env.SMTP_FROM_EMAIL || 'noreply@safein.com'}>`,
      to: employeeEmail,
      subject: 'New Appointment Request - SafeIn',
      html: this.getNewAppointmentRequestEmailTemplate(employeeName, visitorDetails, scheduledDate, scheduledTime, purpose, appointmentId),
      text: this.getNewAppointmentRequestEmailText(employeeName, visitorDetails, scheduledDate, scheduledTime, purpose, appointmentId)
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ New appointment request email sent to employee ${employeeEmail}`);
    } catch (error: any) {
      console.error('❌ Failed to send new appointment request email:', error.message);
      // Don't throw error - just log it so appointment creation continues
    }
  }

  /**
   * Get new appointment request email HTML template
   */
  private static getNewAppointmentRequestEmailTemplate(
    employeeName: string,
    visitorDetails: any,
    scheduledDate: Date,
    scheduledTime: string,
    purpose: string,
    appointmentId: string
  ): string {
    const formattedDate = scheduledDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Create approve and reject URLs
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const approveUrl = `${baseUrl}/email-action/approve/${appointmentId}`;
    const rejectUrl = `${baseUrl}/email-action/reject/${appointmentId}`;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Appointment Request - SafeIn</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #3882a5; }
            .logo { font-size: 24px; font-weight: bold; color: #3882a5; }
            .content { padding: 20px 0; }
            .highlight { background-color: #e3f2fd; padding: 15px; border-radius: 5px; border-left: 4px solid #2196f3; margin: 20px 0; }
            .appointment-details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .action-buttons { text-align: center; margin: 30px 0; }
            .button { display: inline-block; padding: 12px 24px; margin: 0 10px; text-decoration: none; border-radius: 5px; font-weight: bold; transition: all 0.3s ease; }
            .approve-btn { background-color: #28a745; color: white; }
            .approve-btn:hover { background-color: #218838; }
            .reject-btn { background-color: #dc3545; color: white; }
            .reject-btn:hover { background-color: #c82333; }
            .dashboard-btn { background-color: #3882a5; color: white; margin-top: 15px; }
            .dashboard-btn:hover { background-color: #2c6b8a; }
            .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #666; font-size: 12px; }
            .warning { background-color: #fff3cd; padding: 10px; border-radius: 5px; border-left: 4px solid #ffc107; margin: 15px 0; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">SafeIn</div>
                <p>Security Management System</p>
            </div>
            
            <div class="content">
                <h2>New Appointment Request 📅</h2>
                
                <p>Hello <strong>${employeeName}</strong>,</p>
                
                <div class="highlight">
                    <p><strong>You have a new appointment request!</strong> Please review the details below and take action.</p>
                </div>
                
                <div class="appointment-details">
                    <h3>Appointment Details:</h3>
                    <p><strong>Date:</strong> ${formattedDate}</p>
                    <p><strong>Time:</strong> ${scheduledTime}</p>
                    <p><strong>Purpose:</strong> ${purpose}</p>
                </div>
                
                <div class="visitor-details">
                    <h3>Visitor Information:</h3>
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <p><strong>Name:</strong> ${visitorDetails.name}</p>
                        <p><strong>Email:</strong> ${visitorDetails.email}</p>
                        <p><strong>Phone:</strong> ${visitorDetails.phone}</p>
                        <p><strong>Company:</strong> ${visitorDetails.company || 'Not provided'}</p>
                        <p><strong>Designation:</strong> ${visitorDetails.designation || 'Not provided'}</p>
                        <p><strong>Visitor ID:</strong> ${visitorDetails.visitorId || 'Not assigned'}</p>
                    </div>
                    
                    <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <h4>Address Details:</h4>
                        <p><strong>Street:</strong> ${visitorDetails.address?.street || 'Not provided'}</p>
                        <p><strong>City:</strong> ${visitorDetails.address?.city || 'Not provided'}</p>
                        <p><strong>State:</strong> ${visitorDetails.address?.state || 'Not provided'}</p>
                        <p><strong>Country:</strong> ${visitorDetails.address?.country || 'Not provided'}</p>
                    </div>
                    
                    <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <h4>ID Proof Details:</h4>
                        <p><strong>ID Type:</strong> ${visitorDetails.idProof?.type || 'Not provided'}</p>
                        <p><strong>ID Number:</strong> ${visitorDetails.idProof?.number || 'Not provided'}</p>
                        ${visitorDetails.idProof?.image ? `<p><strong>ID Document:</strong> <a href="${visitorDetails.idProof.image}" target="_blank">View ID Document</a></p>` : ''}
                    </div>
                    
                    ${visitorDetails.photo ? `
                    <div style="background-color: #d1ecf1; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <h4>Visitor Photo:</h4>
                        <p><a href="${visitorDetails.photo}" target="_blank">View Visitor Photo</a></p>
                    </div>
                    ` : ''}
                </div>
                
                <div class="action-buttons">
                    <p><strong>Quick Action:</strong> Click the buttons below to approve or reject this request:</p>
                    
                    <a href="${approveUrl}" class="button approve-btn">✅ Approve Appointment</a>
                    <a href="${rejectUrl}" class="button reject-btn">❌ Reject Appointment</a>
                    
                    <div style="margin-top: 20px;">
                        <a href="${baseUrl}/dashboard/notifications" class="button dashboard-btn">📋 View All Requests</a>
                    </div>
                </div>
                
                <div class="warning">
                    <strong>Important:</strong> Please respond to this request as soon as possible so the visitor can plan accordingly. If you don't take action, the request will remain pending.
                </div>
                
                <p><strong>Note:</strong> You can also manage this appointment through your SafeIn dashboard for more detailed options.</p>
            </div>
            
            <div class="footer">
                <p>Best regards,<br><strong>SafeIn Security Team</strong></p>
                <p>Need help? Contact us at support@safein.com</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Get new appointment request email text version
   */
  private static getNewAppointmentRequestEmailText(
    employeeName: string,
    visitorDetails: any,
    scheduledDate: Date,
    scheduledTime: string,
    purpose: string,
    appointmentId: string
  ): string {
    const formattedDate = scheduledDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const approveUrl = `${baseUrl}/email-action/approve/${appointmentId}`;
    const rejectUrl = `${baseUrl}/email-action/reject/${appointmentId}`;

    return `
New Appointment Request 📅

Hello ${employeeName},

You have a new appointment request! Please review the details below and take action.

Appointment Details:
- Date: ${formattedDate}
- Time: ${scheduledTime}
- Purpose: ${purpose}

Visitor Information:
- Name: ${visitorDetails.name}
- Email: ${visitorDetails.email}
- Phone: ${visitorDetails.phone}
- Company: ${visitorDetails.company || 'Not provided'}
- Designation: ${visitorDetails.designation || 'Not provided'}
- Visitor ID: ${visitorDetails.visitorId || 'Not assigned'}

Address Details:
- Street: ${visitorDetails.address?.street || 'Not provided'}
- City: ${visitorDetails.address?.city || 'Not provided'}
- State: ${visitorDetails.address?.state || 'Not provided'}
- Country: ${visitorDetails.address?.country || 'Not provided'}

ID Proof Details:
- ID Type: ${visitorDetails.idProof?.type || 'Not provided'}
- ID Number: ${visitorDetails.idProof?.number || 'Not provided'}
${visitorDetails.idProof?.image ? `- ID Document: ${visitorDetails.idProof.image}` : ''}

${visitorDetails.photo ? `Visitor Photo: ${visitorDetails.photo}` : ''}

Quick Action:
To approve this appointment, click: ${approveUrl}
To reject this appointment, click: ${rejectUrl}

Or visit your dashboard: ${baseUrl}/dashboard/notifications

Important: Please respond to this request as soon as possible so the visitor can plan accordingly. If you don't take action, the request will remain pending.

Note: You can also manage this appointment through your SafeIn dashboard for more detailed options.

Best regards,
SafeIn Security Team

Need help? Contact us at support@safein.com
    `;
  }
}
