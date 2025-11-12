import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { SubscriptionPlan } from '../src/models/subscription/subscription.model';
import { connectDatabase } from '../src/config/database.config';

// Default subscription plans data
const defaultPlans = [
    {
        name: "Free Trial",
        description: "Experience full SafeIn features for 3 days",
        planType: 'free',
        amount: 0,
        currency: 'inr',
        features: [
            "Full SafeIn features access",
            "Test visitor tracking",
            "Photo capture & ID verification",
            "Real-time notifications",
            "No credit card required"
        ],
        isActive: true,
        isPopular: false,
        trialDays: 3,
        sortOrder: 1,
        discountPercentage: 0,
        metadata: {
            stripePriceId: '',
            stripeProductId: ''
        }
    },
    {
        name: "Premium - 1 Month",
        description: "Monthly billing at ₹8,499/month",
        planType: 'monthly',
        amount: 849900, // ₹8,499.00 in cents
        currency: 'inr',
        features: [
            'Unlimited visitor tracking',
            'Aadhaar & ID verification',
            'Real-time email & SMS alerts',
            'Photo capture & smart logs',
            'Secure cloud storage',
            '24/7 priority support',
            'Advanced analytics & reporting',
            'Custom branding options',
            'API access',
            'Multi-location support'
        ],
        isActive: true,
        isPopular: false,
        trialDays: 0,
        sortOrder: 2,
        discountPercentage: 0,
        metadata: {
            stripePriceId: '',
            stripeProductId: ''
        }
    },
    {
        name: "Premium - 3 Months",
        description: "Save 5% with 3-month billing",
        planType: 'quarterly',
        amount: 2422200, // ₹24,222.00 in cents
        currency: 'inr',
        features: [
            'Unlimited visitor tracking',
            'Aadhaar & ID verification',
            'Real-time email & SMS alerts',
            'Photo capture & smart logs',
            'Secure cloud storage',
            '24/7 priority support',
            'Advanced analytics & reporting',
            'Custom branding options',
            'API access',
            'Multi-location support'
        ],
        isActive: true,
        isPopular: true,
        trialDays: 0,
        sortOrder: 3,
        discountPercentage: 5,
        metadata: {
            stripePriceId: '',
            stripeProductId: ''
        }
    },
    {
        name: "Premium - 12 Months",
        description: "Save 10% with annual billing - Best value!",
        planType: 'yearly',
        amount: 9179000, // ₹91,790.00 in cents
        currency: 'inr',
        features: [
            'Unlimited visitor tracking',
            'Aadhaar & ID verification',
            'Real-time email & SMS alerts',
            'Photo capture & smart logs',
            'Secure cloud storage',
            '24/7 priority support',
            'Advanced analytics & reporting',
            'Custom branding options',
            'API access',
            'Multi-location support'
        ],
        isActive: true,
        isPopular: false,
        trialDays: 0,
        sortOrder: 4,
        discountPercentage: 10,
        metadata: {
            stripePriceId: '',
            stripeProductId: ''
        }
    }
];

async function seedSubscriptionPlans() {
    try {
        console.log('🌱 Starting subscription plans seeding...');
        
        // Connect to database
        await connectDatabase();
        console.log('✅ Connected to database');

        // Clear existing plans (optional - remove this if you want to keep existing data)
        const existingPlans = await SubscriptionPlan.countDocuments();
        if (existingPlans > 0) {
            console.log(`⚠️  Found ${existingPlans} existing subscription plans`);
            const shouldClear = process.argv.includes('--clear');
            if (shouldClear) {
                await SubscriptionPlan.deleteMany({});
                console.log('🗑️  Cleared existing subscription plans');
            } else {
                console.log('ℹ️  Use --clear flag to clear existing plans before seeding');
            }
        }

        // Insert default plans
        const insertedPlans = await SubscriptionPlan.insertMany(defaultPlans);
        console.log(`✅ Successfully inserted ${insertedPlans.length} subscription plans`);

        // Display inserted plans
        console.log('\n📋 Inserted Subscription Plans:');
        insertedPlans.forEach((plan, index) => {
            console.log(`${index + 1}. ${plan.name} (${plan.planType}) - ₹${(plan.amount / 100).toFixed(2)}`);
        });

        console.log('\n🎉 Subscription plans seeding completed successfully!');
        
    } catch (error) {
        console.error('❌ Error seeding subscription plans:', error);
        process.exit(1);
    } finally {
        // Close database connection
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
}

// Run the seeding function
if (require.main === module) {
    seedSubscriptionPlans();
}

export { seedSubscriptionPlans };
