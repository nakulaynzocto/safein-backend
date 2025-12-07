# Render Production Setup Guide

## Email Configuration for Render

### Problem
Email verification emails are not being sent in production on Render, even though SMTP works locally.

### Solution

#### Option 1: Use SKIP_SMTP_VERIFY (REQUIRED for Render)

**IMPORTANT**: Render's network environment causes SMTP verification to timeout (Connection timeout error), even though actual email sending works. You MUST set this environment variable in Render:

```env
SKIP_SMTP_VERIFY=true
```

This tells the application to skip SMTP connection verification entirely and attempt to send emails directly. The verification step consistently fails on Render due to network restrictions and timeouts, but the actual email sending works fine when verification is skipped.

**Without this setting, you will see "Connection timeout" errors in logs and emails will not be sent.**

#### Option 2: Use Resend API (Alternative)

If SMTP continues to have issues, you can use Resend API as a fallback:

1. Sign up at https://resend.com
2. Get your API key
3. Set in Render environment variables:
```env
RESEND_API_KEY=re_your_api_key_here
```

The system will automatically use Resend if SMTP verification fails.

### Required Environment Variables for Render

Make sure these are set in your Render dashboard:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_NAME=SafeIn Security Management
SMTP_FROM_EMAIL=your-email@gmail.com

# Skip SMTP verification (recommended for Render)
SKIP_SMTP_VERIFY=true

# Optional: Resend API fallback
RESEND_API_KEY=re_your_api_key_here
```

### Gmail App Password Setup

1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Go to Security → App Passwords
4. Generate a new app password for "Mail"
5. Use this 16-character password as `SMTP_PASS` (not your regular Gmail password)

### Testing Email in Production

After deploying to Render:

1. Check Render logs for email service initialization messages
2. Try registering a new user
3. Check logs for email sending attempts
4. Verify the email arrives in the user's inbox

### Common Issues

**Issue**: "SMTP connection verification failed"
- **Solution**: Set `SKIP_SMTP_VERIFY=true` in Render environment variables

**Issue**: "Failed to send OTP email"
- **Check**: SMTP credentials are correct
- **Check**: Gmail App Password is used (not regular password)
- **Check**: All SMTP environment variables are set in Render

**Issue**: Emails work locally but not on Render
- **Solution**: Set `SKIP_SMTP_VERIFY=true` - Render's network can block SMTP verification

### Logs to Check

In Render logs, look for:
- `✓ Email service initialized and verified` - Success
- `⚠ Email service verification failed` - Verification failed but will still attempt to send
- `OTP email sent via SMTP` - Email was sent successfully
- `Failed to send OTP email` - Check SMTP credentials

### Alternative Email Services

If Gmail continues to have issues, consider:
- **SendGrid**: Professional email service with better deliverability
- **AWS SES**: Cost-effective for high volume
- **Mailgun**: Developer-friendly API
- **Resend**: Modern API-first email service

Update `SMTP_HOST`, `SMTP_PORT`, and credentials accordingly.

