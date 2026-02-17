import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { SubscriptionAddon } from '../src/models/subscription/subscriptionAddon.model';
import { connectDatabase } from '../src/config/database.config';

const defaultAddons = [
    {
        name: "Extra 5 Employees",
        description: "Increase your employee limit by 5",
        type: 'employee',
        unitQuantity: 5,
        amount: 499,
        currency: 'inr',
        isActive: true,
        sortOrder: 1,
    },
    {
        name: "Extra 10 Employees",
        description: "Increase your employee limit by 10",
        type: 'employee',
        unitQuantity: 10,
        amount: 899,
        currency: 'inr',
        isActive: true,
        sortOrder: 2,
    },
    {
        name: "Extra 25 Appointments",
        description: "Add 25 more appointment/invites to your monthly quota",
        type: 'appointment',
        unitQuantity: 25,
        amount: 499,
        currency: 'inr',
        isActive: true,
        sortOrder: 3,
    },
    {
        name: "Extra 50 Appointments",
        description: "Add 50 more appointment/invites to your monthly quota",
        type: 'appointment',
        unitQuantity: 50,
        amount: 899,
        currency: 'inr',
        isActive: true,
        sortOrder: 4,
    },
    {
        name: "Extra 100 Appointments",
        description: "Add 100 more appointment/invites to your monthly quota",
        type: 'appointment',
        unitQuantity: 100,
        amount: 1599,
        currency: 'inr',
        isActive: true,
        sortOrder: 5,
    }
];

async function seedSubscriptionAddons() {
    try {
        console.log('🌱 Starting subscription addons seeding...');
        await connectDatabase();
        const mongoUri = process.env.MONGODB_URI;
        console.log('✅ Connected to database: ' + (mongoUri ? mongoUri.split('@')[1] : 'local'));

        const shouldClear = process.argv.includes('--clear');
        if (shouldClear) {
            await SubscriptionAddon.deleteMany({});
            console.log('🗑️  Cleared existing subscription addons');
        }

        for (const addon of defaultAddons) {
            await SubscriptionAddon.findOneAndUpdate(
                { name: addon.name },
                addon,
                { upsert: true, new: true }
            );
        }

        console.log('✅ Successfully seeded subscription addons');
    } catch (error) {
        console.error('❌ Error seeding subscription addons:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

if (require.main === module) {
    seedSubscriptionAddons();
}
