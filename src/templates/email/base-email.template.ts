/**
 * Base Email Template
 * Modern, Professional, and User-Friendly Design
 */

export interface EmailContent {
  greeting?: string;
  message: string;
  actionButton?: {
    text: string;
    url: string;
    color?: string;
  };
  additionalInfo?: string;
}

export function getBaseEmailTemplate(content: string, title: string = 'SafeIn'): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>${title}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                background-color: #e9eff6;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }
            .email-wrapper {
                width: 100%;
                background-color: #e9eff6;
                padding: 40px 20px;
            }
            .email-container {
                max-width: 640px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            }
            .header {
                background: linear-gradient(135deg, #074463 0%, #3882a5 100%);
                padding: 48px 40px;
                text-align: center;
                position: relative;
                overflow: hidden;
            }
            .header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('data:image/svg+xml,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
                opacity: 0.3;
            }
            .logo {
                color: #ffffff;
                font-size: 36px;
                font-weight: 700;
                letter-spacing: -0.5px;
                margin: 0;
                text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                position: relative;
                z-index: 1;
            }
            .logo-tagline {
                color: #e0e7ff;
                font-size: 15px;
                margin-top: 10px;
                font-weight: 400;
                letter-spacing: 0.3px;
                position: relative;
                z-index: 1;
            }
            .content-wrapper {
                padding: 48px 40px;
                background-color: #ffffff;
            }
            .icon-container {
                text-align: center;
                margin-bottom: 32px;
            }
            .icon-circle {
                width: 112px;
                height: 112px;
                background: linear-gradient(135deg, #98c7dd 0%, #e9eff6 100%);
                border-radius: 50%;
                margin: 0 auto;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 8px 24px rgba(7, 68, 99, 0.12);
                border: 4px solid #ffffff;
            }
            .icon-symbol {
                font-size: 56px;
                line-height: 1;
            }
            .greeting {
                font-size: 28px;
                color: #1e293b;
                margin: 0 0 20px 0;
                font-weight: 700;
                line-height: 1.3;
                letter-spacing: -0.5px;
            }
            .message {
                font-size: 16px;
                color: #475569;
                margin: 24px 0;
                line-height: 1.75;
                text-align: left;
            }
            .message strong {
                color: #1e293b;
                font-weight: 600;
            }
            .action-button {
                display: inline-block;
                padding: 16px 40px;
                background: linear-gradient(135deg, #074463 0%, #3882a5 100%);
                color: #ffffff !important;
                text-decoration: none;
                border-radius: 10px;
                margin: 28px 0;
                font-weight: 600;
                font-size: 16px;
                text-align: center;
                box-shadow: 0 6px 20px rgba(7, 68, 99, 0.35);
                transition: all 0.3s ease;
                letter-spacing: 0.2px;
            }
            .action-button:hover {
                background: linear-gradient(135deg, #3882a5 0%, #074463 100%);
                box-shadow: 0 8px 24px rgba(7, 68, 99, 0.45);
                transform: translateY(-2px);
            }
            .action-button-primary {
                background: linear-gradient(135deg, #074463 0%, #3882a5 100%);
                box-shadow: 0 6px 20px rgba(7, 68, 99, 0.35);
            }
            .action-button-secondary {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                box-shadow: 0 6px 20px rgba(16, 185, 129, 0.35);
            }
            .action-button-secondary:hover {
                background: linear-gradient(135deg, #059669 0%, #047857 100%);
                box-shadow: 0 8px 24px rgba(16, 185, 129, 0.45);
            }
            .action-button-danger {
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                box-shadow: 0 6px 20px rgba(239, 68, 68, 0.35);
            }
            .action-button-danger:hover {
                background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
                box-shadow: 0 8px 24px rgba(239, 68, 68, 0.45);
            }
            .button-group {
                text-align: center;
                margin: 32px 0;
            }
            .button-group .action-button {
                margin: 10px 8px;
            }
            .highlight-box {
                background: linear-gradient(135deg, #e9eff6 0%, #f8fafc 100%);
                padding: 28px;
                border-radius: 12px;
                margin: 28px 0;
                text-align: left;
                border-left: 5px solid #074463;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
            }
            .highlight-box h3 {
                margin: 0 0 20px 0;
                color: #074463;
                font-size: 20px;
                font-weight: 700;
                letter-spacing: -0.3px;
            }
            .highlight-box p {
                margin: 12px 0;
                color: #475569;
                font-size: 15px;
                line-height: 1.7;
                display: flex;
                align-items: flex-start;
            }
            .highlight-box p strong {
                color: #1e293b;
                font-weight: 600;
                min-width: 100px;
                margin-right: 12px;
            }
            .highlight-box ul {
                margin: 12px 0;
                padding-left: 28px;
            }
            .highlight-box li {
                margin: 10px 0;
                color: #475569;
                font-size: 15px;
                line-height: 1.7;
            }
            .info-card {
                background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                padding: 28px;
                border-radius: 12px;
                margin: 28px 0;
                border-left: 5px solid #64748b;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
            }
            .info-card h3 {
                margin: 0 0 20px 0;
                color: #334155;
                font-size: 20px;
                font-weight: 700;
                letter-spacing: -0.3px;
            }
            .info-card p {
                margin: 12px 0;
                color: #475569;
                font-size: 15px;
                line-height: 1.7;
                display: flex;
                align-items: flex-start;
            }
            .info-card p strong {
                color: #1e293b;
                font-weight: 600;
                min-width: 100px;
                margin-right: 12px;
            }
            .detail-row {
                display: flex;
                align-items: center;
                margin: 14px 0;
                padding: 12px 0;
                border-bottom: 1px solid rgba(0, 0, 0, 0.05);
            }
            .detail-row:last-child {
                border-bottom: none;
            }
            .detail-icon {
                width: 40px;
                height: 40px;
                background: linear-gradient(135deg, #98c7dd 0%, #e9eff6 100%);
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 16px;
                flex-shrink: 0;
                font-size: 20px;
            }
            .detail-content {
                flex: 1;
            }
            .detail-label {
                font-size: 13px;
                color: #64748b;
                font-weight: 500;
                margin-bottom: 4px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .detail-value {
                font-size: 16px;
                color: #1e293b;
                font-weight: 600;
                word-break: break-word;
            }
            .detail-value a {
                color: #074463;
                text-decoration: none;
            }
            .detail-value a:hover {
                text-decoration: underline;
            }
            .security-note {
                font-size: 14px;
                color: #64748b;
                margin: 28px 0;
                padding: 20px;
                background-color: #f8fafc;
                border-radius: 10px;
                border-left: 4px solid #64748b;
                line-height: 1.7;
            }
            .security-note strong {
                color: #1e293b;
                font-weight: 600;
            }
            .security-warning {
                background-color: #fffbeb;
                border-left-color: #f59e0b;
                color: #92400e;
            }
            .security-warning strong {
                color: #78350f;
            }
            .security-success {
                background-color: #f0fdf4;
                border-left-color: #10b981;
                color: #065f46;
            }
            .security-success strong {
                color: #047857;
            }
            .info-box {
                background-color: #f8fafc;
                padding: 24px;
                border-radius: 10px;
                margin: 28px 0;
                font-size: 14px;
                color: #64748b;
                line-height: 1.7;
                border: 1px solid #e2e8f0;
            }
            .info-box strong {
                color: #1e293b;
                font-weight: 600;
            }
            .info-box a {
                color: #074463;
                word-break: break-all;
                text-decoration: none;
                font-weight: 500;
            }
            .info-box a:hover {
                text-decoration: underline;
            }
            .footer {
                background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                padding: 48px 40px 32px;
                text-align: center;
                border-top: 1px solid #e2e8f0;
            }
            .footer-signature {
                font-size: 18px;
                color: #1e293b;
                margin: 0 0 8px 0;
                font-weight: 700;
            }
            .footer-company {
                font-size: 16px;
                color: #475569;
                margin: 0 0 24px 0;
                font-weight: 500;
            }
            .footer-tagline {
                font-size: 14px;
                color: #64748b;
                margin: 0 0 28px 0;
            }
            .footer-links {
                margin: 28px 0;
                padding-top: 28px;
                border-top: 1px solid #e2e8f0;
            }
            .footer-links a {
                color: #074463;
                text-decoration: none;
                font-size: 14px;
                margin: 0 16px;
                font-weight: 500;
            }
            .footer-links a:hover {
                text-decoration: underline;
            }
            .footer-text {
                font-size: 14px;
                color: #64748b;
                margin: 24px 0 0 0;
                line-height: 1.7;
            }
            .footer-copyright {
                font-size: 12px;
                color: #94a3b8;
                margin-top: 28px;
                padding-top: 28px;
                border-top: 1px solid #e2e8f0;
            }
            @media only screen and (max-width: 640px) {
                .email-wrapper {
                    padding: 20px 12px;
                }
                .content-wrapper {
                    padding: 32px 24px;
                }
                .header {
                    padding: 36px 24px;
                }
                .logo {
                    font-size: 32px;
                }
                .logo-tagline {
                    font-size: 14px;
                }
                .icon-circle {
                    width: 96px;
                    height: 96px;
                }
                .icon-symbol {
                    font-size: 48px;
                }
                .greeting {
                    font-size: 24px;
                }
                .highlight-box,
                .info-card {
                    padding: 20px;
                }
                .detail-row {
                    flex-direction: column;
                    align-items: flex-start;
                }
                .detail-icon {
                    margin-bottom: 8px;
                    margin-right: 0;
                }
                .footer {
                    padding: 32px 24px 24px;
                }
                .button-group .action-button {
                    display: block;
                    margin: 12px 0;
                    width: 100%;
                }
                .action-button {
                    padding: 14px 32px;
                    font-size: 15px;
                }
            }
        </style>
    </head>
    <body>
        <div class="email-wrapper">
            <div class="email-container">
                <div class="header">
                    <div class="logo">SafeIn</div>
                    <div class="logo-tagline">Professional Visitor Management System</div>
                </div>
                
                <div class="content-wrapper">
                    <div class="icon-container">
                        <div class="icon-circle">
                            <div class="icon-symbol">🔒</div>
                        </div>
                    </div>
                    
                    ${content}
                </div>
                
                <div class="footer">
                    <div class="footer-signature">Best Regards,</div>
                    <div class="footer-company">SafeIn Security Team</div>
                    <div class="footer-tagline">Professional Visitor Management Solutions</div>
                    
                    <div class="footer-links">
                        <a href="mailto:support@safein.com">Support</a>
                        <a href="#">Help Center</a>
                        <a href="#">Privacy Policy</a>
                    </div>
                    
                    <div class="footer-text">
                        If you have any questions or need assistance, please don't hesitate to contact our support team at 
                        <a href="mailto:support@safein.com">support@safein.com</a>
                    </div>
                    
                    <div class="footer-copyright">
                        © ${new Date().getFullYear()} SafeIn. All rights reserved.<br>
                        This is an automated message. Please do not reply to this email.
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
}
