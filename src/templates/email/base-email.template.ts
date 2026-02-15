/**
 * Base Email Template
 * Minimalist, Professional, and Responsive Design
 */

/**
 * Format 24-hour time string (HH:mm) to 12-hour format with AM/PM
 */
export function formatTo12Hour(time: string): string {
    if (!time) return '';
    try {
        const [hours, minutes] = time.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return time;
        const period = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours % 12 || 12;
        return `${hours12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch (e) {
        return time;
    }
}

export function getBaseEmailTemplate(content: string, title: string = 'SafeIn', companyName: string = 'SafeIn', _companyLogo?: string): string {
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
                font-family: 'Google Sans', Roboto, 'Helvetica Neue', Arial, sans-serif;
                background-color: #ffffff;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }
            .email-wrapper {
                width: 100%;
                background-color: #ffffff;
                padding: 40px 20px;
            }
            .email-container {
                max-width: 580px;
                margin: 0 auto;
                background-color: #ffffff;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                overflow: hidden;
            }
            .content-wrapper {
                padding: 32px;
                color: #3c4043;
            }
            .greeting {
                font-size: 24px;
                color: #202124;
                margin: 0 0 16px 0;
                font-weight: 500;
                line-height: 1.3;
                text-align: center;
            }
            .message {
                font-size: 16px;
                color: #3c4043;
                margin: 24px 0;
                line-height: 1.6;
                text-align: left;
            }
            .message strong {
                color: #202124;
                font-weight: 500;
            }
            .action-button-container {
                text-align: center;
                margin: 32px 0;
            }
            .action-button {
                display: inline-block;
                padding: 12px 32px;
                background-color: #1a73e8;
                color: #ffffff !important;
                text-decoration: none;
                border-radius: 24px;
                font-weight: 500;
                font-size: 16px;
                text-align: center;
                transition: background-color 0.2s;
            }
            .action-button:hover {
                background-color: #1557b0;
            }
            .highlight-box {
                background-color: #f8f9fa;
                padding: 24px;
                border-radius: 8px;
                margin: 24px 0;
                text-align: left;
                border: 1px solid #f1f3f4;
            }
            .highlight-box h3 {
                margin: 0 0 12px 0;
                color: #202124;
                font-size: 18px;
                font-weight: 500;
            }
            .highlight-box p {
                margin: 8px 0;
                color: #5f6368;
                font-size: 14px;
                line-height: 1.5;
            }
            .info-card {
                background-color: #f8f9fa;
                padding: 24px;
                border-radius: 8px;
                margin: 24px 0;
                border-left: 4px solid #1a73e8;
            }
            .info-card h3 {
                margin: 0 0 16px 0;
                color: #202124;
                font-size: 18px;
                font-weight: 500;
            }
            .info-card p {
                margin: 8px 0;
                color: #5f6368;
                font-size: 14px;
                line-height: 1.5;
            }
            .detail-row {
                display: flex;
                padding: 12px 0;
                border-bottom: 1px solid #f1f3f4;
            }
            .detail-row:last-child {
                border-bottom: none;
            }
            .detail-label {
                font-size: 13px;
                color: #70757a;
                width: 120px;
                flex-shrink: 0;
            }
            .detail-value {
                font-size: 14px;
                color: #202124;
                font-weight: 500;
                flex-grow: 1;
            }
            .security-note {
                font-size: 13px;
                color: #5f6368;
                margin: 24px 0;
                padding: 12px 16px;
                background-color: #f1f3f4;
                border-radius: 4px;
                line-height: 1.5;
            }
            .footer {
                padding: 24px 32px;
                text-align: center;
                border-top: 1px solid #f1f3f4;
                background-color: #ffffff;
            }
            .footer-signature {
                font-size: 14px;
                color: #5f6368;
                margin: 0;
            }
            .footer-company {
                font-size: 14px;
                font-weight: 500;
                color: #202124;
                margin-top: 4px;
            }
            .footer-copyright {
                font-size: 11px;
                color: #bdc1c6;
                margin-top: 24px;
            }
            @media only screen and (max-width: 600px) {
                .email-wrapper {
                    padding: 20px 10px;
                }
                .content-wrapper {
                    padding: 24px 16px;
                }
                .detail-row {
                    flex-direction: column;
                }
                .detail-label {
                    width: 100%;
                    margin-bottom: 4px;
                }
                .greeting {
                    font-size: 20px;
                }
            }
        </style>
    </head>
    <body>
        <div class="email-wrapper">
            <div class="email-container">
                <div class="content-wrapper">
                    ${content}
                </div>
                
                <div class="footer">
                    <p class="footer-signature">Best Regards,</p>
                    <p class="footer-company">${companyName} Team</p>
                    <p class="footer-copyright">&copy; 2026 ${companyName}. All rights reserved.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
}

