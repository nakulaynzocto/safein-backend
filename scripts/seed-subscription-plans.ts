import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { SubscriptionPlan } from '../src/models/subscription/subscription.model';
import { connectDatabase } from '../src/config/database.config';

// Default subscription plans data
const defaultPlans = [
    {
        name: "Free Subscription",
        description: "Perfect for individuals and testing",
        planType: 'free',
        amount: 0,
        currency: 'inr',
        features: [
            "Up to 10 Appointments/month",
            "Manage 5 Employees",
            "Basic Visitor Tracking",
            "Real-time Notifications",
            "Email Support"
        ],
        isActive: true,
        isPopular: false,
        trialDays: 0,
        sortOrder: 1,
        discountPercentage: 0,
        metadata: {
            stripePriceId: '',
            stripeProductId: ''
        },
        limits: {
            employees: 5,
            visitors: -1, // Unlimited visitors (or set a limit if preferred)
            appointments: 10
        }
    },
    {
        name: "Starter",
        description: "For small offices and startups",
        planType: 'monthly',
        amount: 1999,
        currency: 'inr',
        features: [
            "150 Appointments/month",
            "Manage 20 Active Employees",
            "Visitor Photo Capture",
            "Digital Check-in/out",
            "Basic Reports",
            "Email & Chat Support"
        ],
        isActive: true,
        isPopular: false,
        trialDays: 0,
        sortOrder: 2,
        discountPercentage: 0,
        metadata: {
            stripePriceId: '',
            stripeProductId: ''
        },
        limits: {
            employees: 20,
            visitors: -1,
            appointments: 150
        }
    },
    {
        name: "Growth",
        description: "For growing teams and businesses",
        planType: 'monthly',
        amount: 3499,
        currency: 'inr',
        features: [
            "250 Appointments/month",
            "Manage 30 Active Employees",
            "Everything in Starter",
            "Advanced Visitor Badge Printing",
            "Custom Branding",
            "Priority Support"
        ],
        isActive: true,
        isPopular: false,
        trialDays: 0,
        sortOrder: 3,
        discountPercentage: 0,
        metadata: {
            stripePriceId: '',
            stripeProductId: ''
        },
        limits: {
            employees: 30,
            visitors: -1,
            appointments: 250
        }
    },
    {
        name: "Business",
        description: "For busy corporate hubs",
        planType: 'monthly',
        amount: 5499,
        currency: 'inr',
        features: [
            "400 Appointments/month",
            "Manage 40 Active Employees",
            "Everything in Growth",
            "Advanced Analytics",
            "Dedicated Account Manager",
            "SLA Support"
        ],
        isActive: true,
        isPopular: false,
        trialDays: 0,
        sortOrder: 4,
        discountPercentage: 0,
        metadata: {
            stripePriceId: '',
            stripeProductId: ''
        },
        limits: {
            employees: 40,
            visitors: -1,
            appointments: 400
        }
    },
    {
        name: "Enterprise",
        description: "For large organizations with high volume",
        planType: 'monthly',
        amount: 7999,
        currency: 'inr',
        features: [
            "Unlimited Appointments",
            "Manage 100 Active Employees",
            "Everything in Business",
            "Custom Integration Support",
            "On-Premise Options",
            "24/7 Premium Support"
        ],
        isActive: true,
        isPopular: true,
        trialDays: 0,
        sortOrder: 5,
        discountPercentage: 0,
        metadata: {
            stripePriceId: '',
            stripeProductId: ''
        },
        limits: {
            employees: 100,
            visitors: -1,
            appointments: -1 // Unlimited
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
        // We now check primarily by NAME because we have multiple monthly plans
        const existingNames = new Set(existingPlans.map(p => p.name));

        // Filter out plans that already exist (by name)
        const plansToInsert = defaultPlans.filter(plan => {
            const existsByName = existingNames.has(plan.name);
            return !existsByName;
        });

        if (plansToInsert.length === 0) {
            console.log('ℹ️  All subscription plans already exist (by name). No new plans to insert.');
            console.log('\n📋 Existing Subscription Plans:');
            existingPlans.forEach((plan, index) => {
                console.log(`${index + 1}. ${plan.name} (${plan.planType}) - ₹${plan.amount.toFixed(2)}`);
            });
        } else {
            // Insert only new plans (no duplicates)
            const insertedPlans = await SubscriptionPlan.insertMany(plansToInsert);
            console.log(`✅ Successfully inserted ${insertedPlans.length} new subscription plans`);

            // Display inserted plans
            console.log('\n📋 Newly Inserted Subscription Plans:');
            insertedPlans.forEach((plan, index) => {
                console.log(`${index + 1}. ${plan.name} (${plan.planType}) - ₹${plan.amount.toFixed(2)}`);
            });

            // Display skipped (duplicate) plans
            const skippedPlans = defaultPlans.filter(plan => {
                const existsByName = existingNames.has(plan.name);
                return existsByName;
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
