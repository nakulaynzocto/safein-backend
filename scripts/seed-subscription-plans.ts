import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { SubscriptionPlan } from '../src/models/subscription/subscription.model';
import { connectDatabase } from '../src/config/database.config';

// Default subscription plans data
const defaultPlans = [
    {
        name: "3 Day Trial",
        description: "Experience full SafeIn features for 3 days",
        planType: 'free',
        amount: 200, // ₹2 (200 paise) for card verification
        currency: 'inr',
        features: [
            "Full SafeIn features access",
            "Test visitor tracking",
            "Photo capture & ID verification",
            "Real-time notifications",
            "Create only 5 appointments",
            "3 days trial period"
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
        description: "Monthly billing at ₹6,999/month",
        planType: 'monthly',
        amount: 699900, // ₹6,999.00 in paise
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
        amount: 1991700, // ₹19,917.00 in paise (3 * 6999 * 0.95 = 19,917)
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
        amount: 7558900, // ₹75,589.00 in paise (12 * 6999 * 0.90 = 75,589)
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

        // Clear existing plans if --clear flag is provided
        const shouldClear = process.argv.includes('--clear');
        if (shouldClear) {
            const existingCount = await SubscriptionPlan.countDocuments();
            if (existingCount > 0) {
                await SubscriptionPlan.deleteMany({});
                console.log(`🗑️  Cleared ${existingCount} existing subscription plans`);
            }
        }

        // Check for existing plans and prevent duplicates
        const existingPlans = await SubscriptionPlan.find({});
        const existingPlanTypes = new Set(existingPlans.map(p => p.planType as string));
        const existingNames = new Set(existingPlans.map(p => p.name));

        // Filter out plans that already exist (by planType or name)
        const plansToInsert = defaultPlans.filter(plan => {
            const existsByType = existingPlanTypes.has(plan.planType as string);
            const existsByName = existingNames.has(plan.name);
            return !existsByType && !existsByName;
        });

        if (plansToInsert.length === 0) {
            console.log('ℹ️  All subscription plans already exist. No new plans to insert.');
            console.log('\n📋 Existing Subscription Plans:');
            existingPlans.forEach((plan, index) => {
                console.log(`${index + 1}. ${plan.name} (${plan.planType}) - ₹${(plan.amount / 100).toFixed(2)}`);
            });
        } else {
            // Insert only new plans (no duplicates)
            const insertedPlans = await SubscriptionPlan.insertMany(plansToInsert);
            console.log(`✅ Successfully inserted ${insertedPlans.length} new subscription plans`);

            // Display inserted plans
            console.log('\n📋 Newly Inserted Subscription Plans:');
            insertedPlans.forEach((plan, index) => {
                console.log(`${index + 1}. ${plan.name} (${plan.planType}) - ₹${(plan.amount / 100).toFixed(2)}`);
            });

            // Display skipped (duplicate) plans
            const skippedPlans = defaultPlans.filter(plan => {
                const existsByType = existingPlanTypes.has(plan.planType as string);
                const existsByName = existingNames.has(plan.name);
                return existsByType || existsByName;
            });

            if (skippedPlans.length > 0) {
                console.log('\n⏭️  Skipped (Already Exists):');
                skippedPlans.forEach((plan, index) => {
                    console.log(`${index + 1}. ${plan.name} (${plan.planType}) - Already exists`);
                });
            }
        }

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
