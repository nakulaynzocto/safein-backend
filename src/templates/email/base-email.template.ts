/**
 * Base Email Template
 * Provides the common Cloudinary-style structure for all emails
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
                background-color: #f5f7fa;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }
            .email-wrapper {
                width: 100%;
                background-color: #f5f7fa;
                padding: 40px 20px;
            }
            .email-container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            .header {
                background: linear-gradient(135deg, #1A73E8 0%, #0d47a1 100%);
                padding: 40px 30px;
                text-align: center;
            }
            .logo {
                color: #ffffff;
                font-size: 32px;
                font-weight: 700;
                letter-spacing: 1px;
                margin: 0;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .logo-tagline {
                color: #e3f2fd;
                font-size: 14px;
                margin-top: 8px;
                font-weight: 400;
            }
            .content-wrapper {
                padding: 50px 40px;
            }
            .icon-container {
                text-align: center;
                margin-bottom: 30px;
            }
            .icon-circle {
                width: 100px;
                height: 100px;
                background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
                border-radius: 50%;
                margin: 0 auto;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 12px rgba(26, 115, 232, 0.15);
            }
            .icon-symbol {
                font-size: 48px;
                color: #1A73E8;
                font-weight: 300;
            }
            .greeting {
                font-size: 20px;
                color: #1a1a1a;
                margin: 0 0 25px 0;
                font-weight: 600;
                line-height: 1.4;
            }
            .message {
                font-size: 16px;
                color: #4a4a4a;
                margin: 20px 0;
                line-height: 1.7;
                text-align: left;
            }
            .action-button {
                display: inline-block;
                padding: 16px 32px;
                background: linear-gradient(135deg, #1A73E8 0%, #1565C0 100%);
                color: #ffffff !important;
                text-decoration: none;
                border-radius: 6px;
                margin: 25px 0;
                font-weight: 600;
                font-size: 16px;
                text-align: center;
                box-shadow: 0 4px 12px rgba(26, 115, 232, 0.3);
                transition: all 0.3s ease;
            }
            .action-button:hover {
                background: linear-gradient(135deg, #1565C0 0%, #0d47a1 100%);
                box-shadow: 0 6px 16px rgba(26, 115, 232, 0.4);
                transform: translateY(-2px);
            }
            .action-button-secondary {
                background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%);
                box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
            }
            .action-button-secondary:hover {
                background: linear-gradient(135deg, #1e7e34 0%, #155724 100%);
                box-shadow: 0 6px 16px rgba(40, 167, 69, 0.4);
            }
            .action-button-danger {
                background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
                box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
            }
            .action-button-danger:hover {
                background: linear-gradient(135deg, #c82333 0%, #bd2130 100%);
                box-shadow: 0 6px 16px rgba(220, 53, 69, 0.4);
            }
            .button-group {
                text-align: center;
                margin: 30px 0;
            }
            .button-group .action-button {
                margin: 8px;
            }
            .highlight-box {
                background: linear-gradient(135deg, #e3f2fd 0%, #f5f9ff 100%);
                padding: 25px;
                border-radius: 8px;
                margin: 25px 0;
                text-align: left;
                border-left: 4px solid #1A73E8;
            }
            .highlight-box h3 {
                margin: 0 0 15px 0;
                color: #1A73E8;
                font-size: 18px;
                font-weight: 600;
            }
            .highlight-box p {
                margin: 8px 0;
                color: #4a4a4a;
                font-size: 15px;
                line-height: 1.6;
            }
            .highlight-box ul {
                margin: 10px 0;
                padding-left: 25px;
            }
            .highlight-box li {
                margin: 8px 0;
                color: #4a4a4a;
                font-size: 15px;
                line-height: 1.6;
            }
            .security-note {
                font-size: 14px;
                color: #666666;
                margin: 25px 0;
                padding: 18px;
                background-color: #f8f9fa;
                border-radius: 8px;
                border-left: 4px solid #6c757d;
                line-height: 1.6;
            }
            .security-note strong {
                color: #333333;
                font-weight: 600;
            }
            .security-warning {
                background-color: #fff3cd;
                border-left-color: #ffc107;
            }
            .security-success {
                background-color: #d4edda;
                border-left-color: #28a745;
            }
            .info-box {
                background-color: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin: 25px 0;
                font-size: 14px;
                color: #666666;
                line-height: 1.6;
            }
            .info-box strong {
                color: #333333;
                font-weight: 600;
            }
            .info-box a {
                color: #1A73E8;
                word-break: break-all;
                text-decoration: none;
            }
            .info-box a:hover {
                text-decoration: underline;
            }
            .footer {
                background-color: #f8f9fa;
                padding: 40px 40px 30px;
                text-align: center;
                border-top: 1px solid #e9ecef;
            }
            .footer-text {
                font-size: 15px;
                color: #6c757d;
                margin: 0 0 20px 0;
                line-height: 1.6;
            }
            .footer-signature {
                font-size: 16px;
                color: #4a4a4a;
                margin: 0 0 10px 0;
                font-weight: 600;
            }
            .footer-company {
                font-size: 14px;
                color: #6c757d;
                margin: 15px 0 5px 0;
                font-weight: 500;
            }
            .footer-tagline {
                font-size: 13px;
                color: #999999;
                margin: 5px 0 20px 0;
            }
            .footer-links {
                margin: 20px 0;
                padding-top: 20px;
                border-top: 1px solid #e9ecef;
            }
            .footer-links a {
                color: #1A73E8;
                text-decoration: none;
                font-size: 14px;
                margin: 0 15px;
            }
            .footer-links a:hover {
                text-decoration: underline;
            }
            .footer-copyright {
                font-size: 12px;
                color: #999999;
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #e9ecef;
            }
            @media only screen and (max-width: 600px) {
                .email-wrapper {
                    padding: 20px 10px;
                }
                .content-wrapper {
                    padding: 30px 20px;
                }
                .header {
                    padding: 30px 20px;
                }
                .logo {
                    font-size: 28px;
                }
                .footer {
                    padding: 30px 20px 20px;
                }
                .button-group .action-button {
                    display: block;
                    margin: 10px 0;
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
                        <a href="mailto:support@safein.com" style="color: #1A73E8; text-decoration: none;">support@safein.com</a>
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

