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
            visitors: 5,
            appointments: 10,
            spotPasses: 100
        },
        modules: {
            visitorInvite: false,
            message: false
        }
    },
    {
        name: "Starter",
        description: "For small offices and startups",
        planType: 'monthly',
        amount: 1499,
        currency: 'inr',
        features: [
            "150 Appointments/month",
            "Manage 30 Active Employees",
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
            employees: 30,
            visitors: -1,
            appointments: 150,
            spotPasses: 200
        },
        modules: {
            visitorInvite: true,
            message: false
        }
    },
    {
        name: "Growth",
        description: "For growing teams and businesses",
        planType: 'monthly',
        amount: 2999,
        currency: 'inr',
        features: [
            "250 Appointments/month",
            "Manage 50 Active Employees",
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
            employees: 50,
            visitors: -1,
            appointments: 250,
            spotPasses: 300
        },
        modules: {
            visitorInvite: true,
            message: true
        }
    },
    {
        name: "Business",
        description: "For busy corporate hubs",
        planType: 'monthly',
        amount: 4999,
        currency: 'inr',
        features: [
            "400 Appointments/month",
            "Manage 80 Active Employees",
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
            employees: 80,
            visitors: -1,
            appointments: 400,
            spotPasses: 400
        },
        modules: {
            visitorInvite: true,
            message: true
        }
    },
    {
        name: "Enterprise",
        description: "For large organizations with high volume",
        planType: 'monthly',
        amount: 6999,
        currency: 'inr',
        features: [
            "Unlimited Appointments",
            "Manage 150 Active Employees",
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
            employees: 150,
            visitors: -1,
            appointments: -1, // Unlimited
            spotPasses: -1 // Unlimited
        },
        modules: {
            visitorInvite: true,
            message: true
        }
    }
];

async function seedSubscriptionPlans() {
    try {
        console.log('🌱 Starting subscription plans seeding...');
        await connectDatabase();
        console.log('✅ Connected to database');

        const shouldClear = process.argv.includes('--clear');
        if (shouldClear) {
            const existingCount = await SubscriptionPlan.countDocuments();
            if (existingCount > 0) {
                await SubscriptionPlan.deleteMany({});
                console.log(`🗑️  Cleared ${existingCount} existing subscription plans`);
            }
        }

        console.log('🔄 Syncing plans (Upserting)...');

        let upsertedCount = 0;
        for (const plan of defaultPlans) {
            await SubscriptionPlan.findOneAndUpdate(
                { name: plan.name },
                plan,
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            upsertedCount++;
        }

        console.log(`✅ Successfully synced ${upsertedCount} subscription plans.`);
        console.log('\n📋 Current Subscription Plans:');

        const allPlans = await SubscriptionPlan.find({}).sort({ sortOrder: 1 });
        allPlans.forEach((plan, index) => {
            console.log(`${index + 1}. ${plan.name} (${plan.planType}) - ₹${plan.amount.toFixed(2)}`);
        });

        console.log('\n🎉 Subscription plans seeding completed successfully!');
    } catch (error) {
        console.error('❌ Error seeding subscription plans:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
}

// Run the seeding function
if (require.main === module) {
    seedSubscriptionPlans();
}

