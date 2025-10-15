import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { SubscriptionPlan } from '../src/models/subscription/subscription.model';
import { connectDatabase } from '../src/config/database.config';

// Default subscription plans data
const defaultPlans = [
    {
        name: 'Free Plan',
        description: 'Perfect for small businesses getting started with visitor management',
        planType: 'free',
        amount: 0,
        currency: 'usd',
        features: [
            'Up to 10 visitors per month',
            'Basic visitor registration',
            'Email notifications',
            'Basic reporting',
            'Mobile app access',
            'Email support'
        ],
        isActive: true,
        isPopular: false,
        trialDays: 0,
        sortOrder: 1,
        metadata: {
            stripePriceId: '',
            stripeProductId: ''
        }
    },
    {
        name: 'Starter Plan',
        description: 'Ideal for growing businesses that need more visitor capacity',
        planType: 'monthly',
        amount: 2900, // $29.00 in cents
        currency: 'usd',
        features: [
            'Up to 100 visitors per month',
            'Advanced visitor registration',
            'SMS & Email notifications',
            'Advanced reporting & analytics',
            'Mobile app access',
            'Priority email support',
            'Custom visitor badges',
            'Visitor photo capture',
            'Appointment scheduling'
        ],
        isActive: true,
        isPopular: false,
        trialDays: 14,
        sortOrder: 2,
        metadata: {
            stripePriceId: 'price_starter_monthly',
            stripeProductId: 'prod_starter'
        }
    },
    {
        name: 'Professional Plan',
        description: 'Best for established businesses with high visitor traffic',
        planType: 'monthly',
        amount: 5900, // $59.00 in cents
        currency: 'usd',
        features: [
            'Up to 500 visitors per month',
            'Advanced visitor registration',
            'SMS, Email & WhatsApp notifications',
            'Advanced reporting & analytics',
            'Mobile app access',
            'Priority email support',
            'Custom visitor badges',
            'Visitor photo capture',
            'Appointment scheduling',
            'Bulk visitor import',
            'Custom fields',
            'Integration APIs',
            'Advanced security features'
        ],
        isActive: true,
        isPopular: true,
        trialDays: 14,
        sortOrder: 3,
        metadata: {
            stripePriceId: 'price_professional_monthly',
            stripeProductId: 'prod_professional'
        }
    },
    {
        name: 'Enterprise Plan',
        description: 'For large organizations with unlimited visitor needs',
        planType: 'monthly',
        amount: 9900, // $99.00 in cents
        currency: 'usd',
        features: [
            'Unlimited visitors',
            'Advanced visitor registration',
            'SMS, Email & WhatsApp notifications',
            'Advanced reporting & analytics',
            'Mobile app access',
            '24/7 phone support',
            'Custom visitor badges',
            'Visitor photo capture',
            'Appointment scheduling',
            'Bulk visitor import',
            'Custom fields',
            'Integration APIs',
            'Advanced security features',
            'White-label options',
            'Custom integrations',
            'Dedicated account manager',
            'SLA guarantee'
        ],
        isActive: true,
        isPopular: false,
        trialDays: 30,
        sortOrder: 4,
        metadata: {
            stripePriceId: 'price_enterprise_monthly',
            stripeProductId: 'prod_enterprise'
        }
    },
    {
        name: 'Professional Plan (Quarterly)',
        description: 'Professional plan with quarterly billing - Save 10%',
        planType: 'quarterly',
        amount: 15930, // $159.30 in cents (10% discount)
        currency: 'usd',
        features: [
            'Up to 500 visitors per month',
            'Advanced visitor registration',
            'SMS, Email & WhatsApp notifications',
            'Advanced reporting & analytics',
            'Mobile app access',
            'Priority email support',
            'Custom visitor badges',
            'Visitor photo capture',
            'Appointment scheduling',
            'Bulk visitor import',
            'Custom fields',
            'Integration APIs',
            'Advanced security features'
        ],
        isActive: true,
        isPopular: false,
        trialDays: 14,
        sortOrder: 5,
        metadata: {
            stripePriceId: 'price_professional_quarterly',
            stripeProductId: 'prod_professional'
        }
    },
    {
        name: 'Professional Plan (Yearly)',
        description: 'Professional plan with yearly billing - Save 20%',
        planType: 'yearly',
        amount: 56640, // $566.40 in cents (20% discount)
        currency: 'usd',
        features: [
            'Up to 500 visitors per month',
            'Advanced visitor registration',
            'SMS, Email & WhatsApp notifications',
            'Advanced reporting & analytics',
            'Mobile app access',
            'Priority email support',
            'Custom visitor badges',
            'Visitor photo capture',
            'Appointment scheduling',
            'Bulk visitor import',
            'Custom fields',
            'Integration APIs',
            'Advanced security features'
        ],
        isActive: true,
        isPopular: false,
        trialDays: 14,
        sortOrder: 6,
        metadata: {
            stripePriceId: 'price_professional_yearly',
            stripeProductId: 'prod_professional'
        }
    },
    {
        name: 'Enterprise Plan (Quarterly)',
        description: 'Enterprise plan with quarterly billing - Save 10%',
        planType: 'quarterly',
        amount: 26730, // $267.30 in cents (10% discount)
        currency: 'usd',
        features: [
            'Unlimited visitors',
            'Advanced visitor registration',
            'SMS, Email & WhatsApp notifications',
            'Advanced reporting & analytics',
            'Mobile app access',
            '24/7 phone support',
            'Custom visitor badges',
            'Visitor photo capture',
            'Appointment scheduling',
            'Bulk visitor import',
            'Custom fields',
            'Integration APIs',
            'Advanced security features',
            'White-label options',
            'Custom integrations',
            'Dedicated account manager',
            'SLA guarantee'
        ],
        isActive: true,
        isPopular: false,
        trialDays: 30,
        sortOrder: 7,
        metadata: {
            stripePriceId: 'price_enterprise_quarterly',
            stripeProductId: 'prod_enterprise'
        }
    },
    {
        name: 'Enterprise Plan (Yearly)',
        description: 'Enterprise plan with yearly billing - Save 20%',
        planType: 'yearly',
        amount: 95040, // $950.40 in cents (20% discount)
        currency: 'usd',
        features: [
            'Unlimited visitors',
            'Advanced visitor registration',
            'SMS, Email & WhatsApp notifications',
            'Advanced reporting & analytics',
            'Mobile app access',
            '24/7 phone support',
            'Custom visitor badges',
            'Visitor photo capture',
            'Appointment scheduling',
            'Bulk visitor import',
            'Custom fields',
            'Integration APIs',
            'Advanced security features',
            'White-label options',
            'Custom integrations',
            'Dedicated account manager',
            'SLA guarantee'
        ],
        isActive: true,
        isPopular: false,
        trialDays: 30,
        sortOrder: 8,
        metadata: {
            stripePriceId: 'price_enterprise_yearly',
            stripeProductId: 'prod_enterprise'
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
            console.log(`${index + 1}. ${plan.name} (${plan.planType}) - $${(plan.amount / 100).toFixed(2)}`);
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
