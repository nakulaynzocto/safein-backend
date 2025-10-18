# 📋 Subscription Plans System

This document describes the subscription plans system integrated into the SafeIn Visitor Appointment System.

## 🎯 Overview

The subscription plans system provides a comprehensive solution for managing different pricing tiers and billing cycles for the visitor management platform. It supports multiple plan types, features, and billing periods.

## 🏗️ Architecture

### Models
- **SubscriptionPlan**: Core model for subscription plans with MongoDB integration
- **Features**: Array-based feature management
- **Metadata**: Stripe integration support
- **Soft Delete**: Data recovery capabilities

### Plan Types
- `free` - Free tier with limited features
- `weekly` - Weekly billing cycle
- `monthly` - Monthly billing cycle  
- `quarterly` - Quarterly billing cycle (3 months)
- `yearly` - Annual billing cycle (12 months)

## 📊 Default Plans

The system comes with 8 pre-configured subscription plans:

### 1. Free Plan
- **Price**: $0.00
- **Features**: Up to 10 visitors/month, basic features
- **Trial**: No trial period

### 2. Starter Plan (Monthly)
- **Price**: $29.00/month
- **Features**: Up to 100 visitors/month, advanced features
- **Trial**: 14 days

### 3. Professional Plan (Monthly) ⭐ Popular
- **Price**: $59.00/month
- **Features**: Up to 500 visitors/month, premium features
- **Trial**: 14 days

### 4. Enterprise Plan (Monthly)
- **Price**: $99.00/month
- **Features**: Unlimited visitors, enterprise features
- **Trial**: 30 days

### 5. Professional Plan (Quarterly)
- **Price**: $159.30/quarter (10% discount)
- **Features**: Same as monthly Professional plan
- **Trial**: 14 days

### 6. Professional Plan (Yearly)
- **Price**: $566.40/year (20% discount)
- **Features**: Same as monthly Professional plan
- **Trial**: 14 days

### 7. Enterprise Plan (Quarterly)
- **Price**: $267.30/quarter (10% discount)
- **Features**: Same as monthly Enterprise plan
- **Trial**: 30 days

### 8. Enterprise Plan (Yearly)
- **Price**: $950.40/year (20% discount)
- **Features**: Same as monthly Enterprise plan
- **Trial**: 30 days

## 🚀 Getting Started

### 1. Seed Default Plans

Run the seeding script to populate the database with default subscription plans:

```bash
# Seed plans (keeps existing data)
npm run seed:subscription-plans

# Clear existing plans and seed new ones
npm run seed:subscription-plans:clear
```

### 2. API Endpoints

All subscription plan endpoints are available under `/api/v1/subscription-plans`:

#### Core Operations
- `POST /api/v1/subscription-plans` - Create new plan
- `GET /api/v1/subscription-plans` - List all plans (paginated)
- `GET /api/v1/subscription-plans/:id` - Get plan by ID
- `PUT /api/v1/subscription-plans/:id` - Update plan
- `DELETE /api/v1/subscription-plans/:id` - Soft delete plan

#### Special Endpoints
- `GET /api/v1/subscription-plans/stats` - Get statistics
- `GET /api/v1/subscription-plans/popular` - Get popular plans
- `GET /api/v1/subscription-plans/type/:planType` - Get plans by type
- `PUT /api/v1/subscription-plans/:id/restore` - Restore deleted plan

### 3. Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 📝 API Usage Examples

### Create a New Plan

```bash
curl -X POST http://localhost:3000/api/v1/subscription-plans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Premium Plan",
    "description": "Premium features for large organizations",
    "planType": "monthly",
    "amount": 9900,
    "currency": "usd",
    "features": [
      "Unlimited visitors",
      "Advanced analytics",
      "Priority support"
    ],
    "isActive": true,
    "isPopular": false,
    "trialDays": 14,
    "sortOrder": 5
  }'
```

### Get All Plans with Filtering

```bash
curl -X GET "http://localhost:3000/api/v1/subscription-plans?planType=monthly&isActive=true&page=1&limit=10" \
  -H "Authorization: Bearer <token>"
```

### Get Popular Plans

```bash
curl -X GET http://localhost:3000/api/v1/subscription-plans/popular \
  -H "Authorization: Bearer <token>"
```

## 🔧 Configuration

### Environment Variables

Ensure these environment variables are set in your `.env` file:

```env
MONGODB_URI=mongodb://localhost:27017/my-project-db
JWT_SECRET=your-jwt-secret-key
```

### Database Indexes

The system automatically creates these indexes for optimal performance:

- `{ isActive: 1, isDeleted: 1, sortOrder: 1 }`
- `{ planType: 1, isActive: 1 }`
- `{ amount: 1 }`
- `{ createdAt: -1 }`
- `{ isPopular: 1 }`

## 📊 Features

### Virtual Fields
- `formattedPrice`: Human-readable price (e.g., "$59.00")
- `monthlyEquivalent`: Monthly equivalent for yearly/quarterly plans
- `savingsPercentage`: Savings percentage for discounted plans

### Methods
- `hasTrial()`: Check if plan has trial period
- `getFormattedFeatures()`: Get features with checkmarks
- `softDelete()`: Soft delete with audit trail
- `restore()`: Restore deleted plan

### Static Methods
- `findActive()`: Find all active plans
- `findPopular()`: Find all popular plans
- `findByType()`: Find plans by type

## 🛡️ Security

- **Authentication**: JWT-based authentication required
- **Validation**: Comprehensive input validation with Joi
- **Soft Delete**: Data recovery capabilities
- **Audit Trail**: Track who created/deleted plans

## 📈 Analytics

The system provides comprehensive statistics:

```json
{
  "totalPlans": 8,
  "activePlans": 6,
  "popularPlans": 1,
  "plansByType": {
    "free": 1,
    "weekly": 0,
    "monthly": 3,
    "quarterly": 2,
    "yearly": 2
  },
  "averagePrice": 5500,
  "totalRevenue": 0
}
```

## 🔄 Integration

### Stripe Integration

The system is designed to work with Stripe for payment processing:

```typescript
metadata: {
  stripePriceId: 'price_professional_monthly',
  stripeProductId: 'prod_professional'
}
```

### Frontend Integration

Plans can be easily consumed by frontend applications:

```typescript
// Get plans for pricing page
const response = await fetch('/api/v1/subscription-plans?isActive=true');
const { data } = await response.json();
const plans = data.plans;
```

## 🧪 Testing

### Manual Testing

1. **Seed Plans**: Run the seeding script
2. **Create Plan**: Test plan creation via API
3. **List Plans**: Test pagination and filtering
4. **Update Plan**: Test plan updates
5. **Delete Plan**: Test soft delete functionality
6. **Restore Plan**: Test restoration functionality

### API Testing

Use the Swagger documentation at `http://localhost:3000/api-docs` to test all endpoints interactively.

## 🚀 Deployment

### Production Considerations

1. **Environment Variables**: Set production MongoDB URI and JWT secret
2. **Database**: Ensure MongoDB is running and accessible
3. **Seeding**: Run seeding script in production environment
4. **Monitoring**: Monitor plan usage and performance

### Scaling

- **Database**: Use MongoDB replica sets for high availability
- **Caching**: Consider Redis for plan caching
- **CDN**: Use CDN for static plan data

## 📚 Documentation

- **API Docs**: Available at `/api-docs` endpoint
- **Swagger**: Complete OpenAPI 3.0 specification
- **TypeScript**: Full type definitions available

## 🤝 Contributing

When adding new features:

1. Update the model schema if needed
2. Add validation rules
3. Update API documentation
4. Add tests
5. Update this README

## 📞 Support

For questions or issues:

- Check the API documentation
- Review the Swagger specs
- Contact the development team
- Open an issue on GitHub

---

**Note**: This subscription system is designed to be flexible and extensible. You can easily add new plan types, features, or billing cycles as needed for your business requirements.
