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
        <title>${title}</title>
        <style>
            body {
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                background-color: #ffffff;
            }
            .header {
                background-color: #1A73E8;
                width: 100%;
                text-align: center;
                padding: 20px 0;
            }
            .logo {
                color: #ffffff;
                font-size: 24px;
                font-weight: 500;
                letter-spacing: 0.5px;
            }
            .content-container {
                max-width: 500px;
                margin: 0 auto;
                padding: 40px 20px;
                text-align: center;
            }
            .icon-container {
                margin: 30px 0;
            }
            .cloud-icon {
                width: 80px;
                height: 80px;
                background: linear-gradient(135deg, #E0E0E0 0%, #BDBDBD 100%);
                border-radius: 50%;
                margin: 0 auto 15px;
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .lock-icon {
                width: 20px;
                height: 26px;
                background-color: #333333;
                border-radius: 3px;
                position: relative;
                margin-left: 15px;
            }
            .lock-icon::before {
                content: '';
                position: absolute;
                width: 15px;
                height: 15px;
                border: 3px solid #333;
                border-top: none;
                border-radius: 0 0 3px 3px;
                top: -12px;
                left: 50%;
                transform: translateX(-50%);
            }
            .greeting {
                font-size: 16px;
                color: #333333;
                margin: 20px 0;
            }
            .message {
                font-size: 14px;
                color: #666666;
                margin: 20px 0;
                line-height: 1.5;
                text-align: left;
            }
            .footer-text {
                font-size: 13px;
                color: #999999;
                margin-top: 30px;
                line-height: 1.4;
            }
            .security-note {
                font-size: 13px;
                color: #666666;
                margin: 20px 0;
                padding: 10px;
                background-color: #F5F5F5;
                border-radius: 5px;
            }
            .action-button {
                display: inline-block;
                padding: 12px 24px;
                background-color: #1A73E8;
                color: #ffffff;
                text-decoration: none;
                border-radius: 5px;
                margin: 15px 0;
                font-weight: 500;
            }
            .action-button:hover {
                background-color: #1565C0;
            }
            .highlight-box {
                background-color: #E3F2FD;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
                text-align: left;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo">SafeIn</div>
        </div>
        
        <div class="content-container">
            <div class="icon-container">
                <div class="cloud-icon">
                    <div class="lock-icon"></div>
                </div>
            </div>
            
            ${content}
            
            <div class="footer-text">
                Thanks
            </div>
        </div>
    </body>
    </html>
  `;
}

