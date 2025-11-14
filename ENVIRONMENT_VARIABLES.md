# Environment Variables Documentation

## Required Environment Variables for Subscription System

### Database Configuration
```env
MONGODB_URI=mongodb://localhost:27017/my-project-db
```
- **Required**: Yes
- **Description**: MongoDB connection string
- **Example**: `mongodb://localhost:27017/my-project-db` or MongoDB Atlas connection string

### JWT Authentication
```env
JWT_SECRET=your-jwt-secret-key-change-this-in-production
JWT_EXPIRATION=1d
```
- **Required**: Yes
- **Description**: 
  - `JWT_SECRET`: Secret key for signing JWT tokens (use a strong random string in production)
  - `JWT_EXPIRATION`: Token expiration time (e.g., `1d`, `7d`, `24h`)

### Server Configuration
```env
PORT=3000
NODE_ENV=development
```
- **Required**: Yes
- **Description**:
  - `PORT`: Server port number
  - `NODE_ENV`: Environment (`development`, `production`, `test`)

### CORS Configuration
```env
FRONTEND_URL=http://localhost:3000
FRONTEND_URLS=http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003
```
- **Required**: Yes
- **Description**: 
  - `FRONTEND_URL`: Primary frontend URL
  - `FRONTEND_URLS`: Comma-separated list of allowed frontend URLs for CORS

### Stripe Payment Configuration
```env
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```
- **Required**: Yes (for payment features)
- **Description**:
  - `STRIPE_SECRET_KEY`: Stripe secret key (use `sk_test_` for testing, `sk_live_` for production)
  - `STRIPE_PUBLISHABLE_KEY`: Stripe publishable key (use `pk_test_` for testing, `pk_live_` for production)
  - `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret (get from Stripe Dashboard → Webhooks)
- **How to Get**:
  1. Sign up at https://stripe.com
  2. Go to Developers → API Keys
  3. Copy Secret Key and Publishable Key
  4. For Webhook Secret: Go to Developers → Webhooks → Add endpoint → Copy signing secret

### Email Configuration (SMTP)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=info@aynzo.com
SMTP_PASS=your-app-password-here
SMTP_FROM_NAME=SafeIn Security Management
SMTP_FROM_EMAIL=info@aynzo.com
SKIP_SMTP_VERIFY=false
```
- **Required**: Yes (for email notifications)
- **Description**:
  - `SMTP_HOST`: SMTP server hostname (Gmail: `smtp.gmail.com`)
  - `SMTP_PORT`: SMTP port (587 for TLS, 465 for SSL)
  - `SMTP_SECURE`: Use SSL (`true` for port 465, `false` for port 587)
  - `SMTP_USER`: SMTP username/email
  - `SMTP_PASS`: SMTP password or App Password (for Gmail, use App Password)
  - `SMTP_FROM_NAME`: Display name for sent emails
  - `SMTP_FROM_EMAIL`: From email address
  - `SKIP_SMTP_VERIFY`: Skip SMTP verification (set to `true` if SMTP verify fails on Railway/deployment)
- **Gmail Setup**:
  1. Enable 2-Factor Authentication
  2. Go to Google Account → Security → App Passwords
  3. Generate App Password and use it as `SMTP_PASS`

### Optional: Resend API (Email Fallback)
```env
RESEND_API_KEY=re_your_resend_api_key_here
```
- **Required**: No
- **Description**: Resend API key for HTTP-based email fallback
- **When to Use**: If SMTP fails, system will use Resend API

---

## Frontend Environment Variables

### API Configuration
```env
NEXT_PUBLIC_API_URL=http://localhost:4010/api/v1
```
- **Required**: Yes
- **Description**: Backend API base URL
- **Note**: Must start with `NEXT_PUBLIC_` to be accessible in browser

---

## Environment Setup Checklist

### Backend (.env file in Gatekeeper-Visitor/)
- [ ] `MONGODB_URI` - Database connection
- [ ] `JWT_SECRET` - Strong random string
- [ ] `JWT_EXPIRATION` - Token expiration
- [ ] `PORT` - Server port
- [ ] `NODE_ENV` - Environment mode
- [ ] `FRONTEND_URL` - Primary frontend URL
- [ ] `FRONTEND_URLS` - Allowed CORS origins
- [ ] `STRIPE_SECRET_KEY` - Stripe secret key
- [ ] `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- [ ] `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- [ ] `SMTP_HOST` - Email server host
- [ ] `SMTP_PORT` - Email server port
- [ ] `SMTP_USER` - Email username
- [ ] `SMTP_PASS` - Email password/App Password
- [ ] `SMTP_FROM_EMAIL` - From email address
- [ ] `SMTP_FROM_NAME` - From display name

### Frontend (.env.local file in frontend-appointment-system/)
- [ ] `NEXT_PUBLIC_API_URL` - Backend API URL

---

## Production Checklist

### Security
- [ ] Use strong `JWT_SECRET` (at least 32 characters)
- [ ] Use production Stripe keys (`sk_live_` and `pk_live_`)
- [ ] Set `NODE_ENV=production`
- [ ] Use secure MongoDB connection (MongoDB Atlas recommended)
- [ ] Enable HTTPS for frontend and backend
- [ ] Set secure CORS origins (no wildcards)

### Stripe Production Setup
1. Complete Stripe account verification
2. Switch to live mode in Stripe Dashboard
3. Get live API keys
4. Set up production webhook endpoint
5. Configure webhook events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### Email Production Setup
1. Use professional email service (SendGrid, AWS SES, etc.)
2. Set up SPF, DKIM, and DMARC records
3. Use dedicated SMTP credentials
4. Monitor email delivery rates

---

## Testing Environment Variables

For local development/testing:
```env
# Use Stripe test keys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Use local MongoDB
MONGODB_URI=mongodb://localhost:27017/my-project-db

# Use Gmail with App Password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
```

---

## Troubleshooting

### Stripe Issues
- **Webhook not working**: Check `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
- **Payment fails**: Verify Stripe keys are correct and account is activated
- **Test mode**: Ensure using `sk_test_` and `pk_test_` keys

### Email Issues
- **Gmail not working**: Use App Password instead of regular password
- **SMTP verify fails**: Set `SKIP_SMTP_VERIFY=true` (not recommended for production)
- **Emails not sending**: Check SMTP credentials and firewall settings

### Database Issues
- **Connection fails**: Verify `MONGODB_URI` is correct and MongoDB is running
- **Atlas connection**: Ensure IP whitelist includes your server IP

---

*Last Updated: $(date)*


