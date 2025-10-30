import nodemailer from 'nodemailer';
import { AppError } from '../../middlewares/errorHandler';
import { ERROR_CODES } from '../../utils/constants';
import { getOtpEmailTemplate, getOtpEmailText } from '../../templates/email/otp-email.template';
import { getWelcomeEmailTemplate, getWelcomeEmailText } from '../../templates/email/welcome-email.template';
import { getAppointmentApprovalEmailTemplate, getAppointmentApprovalEmailText } from '../../templates/email/appointment-approval-email.template';
import { getAppointmentRejectionEmailTemplate, getAppointmentRejectionEmailText } from '../../templates/email/appointment-rejection-email.template';
import { 
  getEmployeeAppointmentApprovalEmailTemplate, 
  getEmployeeAppointmentApprovalEmailText,
  getEmployeeAppointmentRejectionEmailTemplate,
  getEmployeeAppointmentRejectionEmailText
} from '../../templates/email/employee-appointment-email.template';
import { 
  getNewAppointmentRequestEmailTemplate, 
  getNewAppointmentRequestEmailText 
} from '../../templates/email/new-appointment-request-email.template';

export class EmailService {
  private static transporter: nodemailer.Transporter;
  private static isEmailServiceAvailable: boolean = false;
  private static useHttpFallback: boolean = false; // e.g., Resend HTTP API

  /**
   * Initialize email transporter
   */
  static initializeTransporter(): nodemailer.Transporter {
    if (this.transporter && this.isEmailServiceAvailable) {
      return this.transporter;
    }

    const smtpConfig = {
      host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      },
      tls: { rejectUnauthorized: false },
      pool: true,
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000
    } as nodemailer.TransportOptions;

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
      // On Railway, some SMTPs block verify(). Allow skip via env
      if (process.env.SKIP_SMTP_VERIFY === 'true') {
        console.log('Skipping SMTP verify as per SKIP_SMTP_VERIFY=true');
        this.isEmailServiceAvailable = true;
        return true;
      }
      
      await this.transporter.verify();
      console.log('SMTP connection verified successfully');
      this.isEmailServiceAvailable = true;
      return true;
    } catch (error: any) {
      console.error('SMTP connection failed:', error.message);
      this.isEmailServiceAvailable = false;
      // Enable HTTP fallback (Resend) if configured
      if (process.env.RESEND_API_KEY) {
        this.useHttpFallback = true;
        console.log('Email HTTP fallback (Resend) enabled');
      }
      
      if (error.code === 'EAUTH' && process.env.SMTP_HOST === 'smtp.gmail.com') {
        console.log('Trying alternative SMTP configurations...');
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
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
        auth: { user: process.env.SMTP_USER || '', pass: process.env.SMTP_PASS || '' }
      },
      {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: { user: process.env.SMTP_USER || '', pass: process.env.SMTP_PASS || '' }
      }
    ];

    for (const config of alternatives) {
      try {
        console.log(`Trying ${config.host}:${config.port}...`);
        this.transporter = nodemailer.createTransport(config);
        await this.transporter.verify();
        console.log(`SMTP connection successful with ${config.host}:${config.port}`);
        this.isEmailServiceAvailable = true;
        return true;
      } catch (error: any) {
        console.log(`Failed with ${config.host}:${config.port} - ${error.message}`);
        continue;
      }
    }

    console.log('All SMTP configurations failed. Email functionality will be disabled.');
    this.isEmailServiceAvailable = false;
    return false;
  }

  private static async sendWithResend(mail: { to: string; subject: string; html: string; from?: string; text?: string }) {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY not set');
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: mail.from || process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@safein.app',
        to: [mail.to],
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Resend error: ${res.status} ${text}`);
    }
  }

  /**
   * Send OTP email
   */
  static async sendOtpEmail(email: string, otp: string, companyName: string): Promise<void> {
    try {
      if (!this.isEmailServiceAvailable && this.useHttpFallback) {
        await this.sendWithResend({
          to: email,
          subject: 'SafeIn Registration - Verify Your Email',
          html: getOtpEmailTemplate(otp, companyName),
          text: getOtpEmailText(otp, companyName),
        });
        console.log('OTP email sent via HTTP fallback');
        return;
      } else if (!this.isEmailServiceAvailable) {
        console.warn('Email service not available. OTP will be logged to console.');
        console.log(`OTP for ${email}: ${otp}`);
        return;
      }

      if (!this.transporter) {
        this.initializeTransporter();
      }

      const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME || 'SafeIn Security Management'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@safein.app'}>`,
        to: email,
        subject: 'SafeIn Registration - Verify Your Email',
        html: getOtpEmailTemplate(otp, companyName),
        text: getOtpEmailText(otp, companyName)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('OTP email sent successfully:', result.messageId);
    } catch (error: any) {
      console.error('Failed to send OTP email:', error.message);
      console.log(`OTP for ${email}: ${otp}`);
      
      if (process.env.NODE_ENV !== 'production') {
        throw new AppError('Failed to send OTP email', ERROR_CODES.INTERNAL_SERVER_ERROR);
      }
    }
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
        from: `"${process.env.SMTP_FROM_NAME || 'SafeIn Security Management'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@safein.app'}>`,
        to: email,
        subject: 'Welcome to SafeIn - Your Account is Ready!',
        html: getWelcomeEmailTemplate(companyName),
        text: getWelcomeEmailText(companyName)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Welcome email sent successfully:', result.messageId);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }
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
    if (!this.isEmailServiceAvailable) {
      console.warn('Email service not available. Skipping appointment approval email.');
      return;
    }

    if (!this.transporter) {
      this.initializeTransporter();
    }
    
    const mailOptions = {
      from: `${process.env.SMTP_FROM_NAME || 'SafeIn'} <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@safein.app'}>`,
      to: visitorEmail,
      subject: 'Appointment Approved - SafeIn',
      html: getAppointmentApprovalEmailTemplate(visitorName, employeeName, scheduledDate, scheduledTime),
      text: getAppointmentApprovalEmailText(visitorName, employeeName, scheduledDate, scheduledTime)
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Appointment approval email sent to ${visitorEmail}`);
    } catch (error: any) {
      console.error('Failed to send appointment approval email:', error.message);
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
    if (!this.isEmailServiceAvailable) {
      console.warn('Email service not available. Skipping appointment rejection email.');
      return;
    }

    if (!this.transporter) {
      this.initializeTransporter();
    }
    
    const mailOptions = {
      from: `${process.env.SMTP_FROM_NAME || 'SafeIn'} <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@safein.app'}>`,
      to: visitorEmail,
      subject: 'Appointment Update - SafeIn',
      html: getAppointmentRejectionEmailTemplate(visitorName, employeeName, scheduledDate, scheduledTime),
      text: getAppointmentRejectionEmailText(visitorName, employeeName, scheduledDate, scheduledTime)
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Appointment rejection email sent to ${visitorEmail}`);
    } catch (error: any) {
      console.error('Failed to send appointment rejection email:', error.message);
    }
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
      from: `${process.env.SMTP_FROM_NAME || 'SafeIn'} <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@safein.app'}>`,
      to: employeeEmail,
      subject: 'Appointment Approved - SafeIn',
      html: getEmployeeAppointmentApprovalEmailTemplate(employeeName, visitorName, scheduledDate, scheduledTime),
      text: getEmployeeAppointmentApprovalEmailText(employeeName, visitorName, scheduledDate, scheduledTime)
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
      from: `${process.env.SMTP_FROM_NAME || 'SafeIn'} <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@safein.app'}>`,
      to: employeeEmail,
      subject: 'Appointment Rejected - SafeIn',
      html: getEmployeeAppointmentRejectionEmailTemplate(employeeName, visitorName, scheduledDate, scheduledTime),
      text: getEmployeeAppointmentRejectionEmailText(employeeName, visitorName, scheduledDate, scheduledTime)
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
    if (!this.isEmailServiceAvailable) {
      console.warn('Email service not available. Skipping appointment notification email.');
      return;
    }

    if (!this.transporter) {
      this.initializeTransporter();
    }
    
    const mailOptions = {
      from: `${process.env.SMTP_FROM_NAME || 'SafeIn'} <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@safein.app'}>`,
      to: employeeEmail,
      subject: 'New Appointment Request - SafeIn',
      html: getNewAppointmentRequestEmailTemplate(employeeName, visitorDetails, scheduledDate, scheduledTime, purpose, appointmentId),
      text: getNewAppointmentRequestEmailText(employeeName, visitorDetails, scheduledDate, scheduledTime, purpose, appointmentId)
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`New appointment request email sent to employee ${employeeEmail}`);
    } catch (error: any) {
      console.error('Failed to send new appointment request email:', error.message);
    }
  }
}
