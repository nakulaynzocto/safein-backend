import mongoose from 'mongoose';
import { User } from '../../models/user/user.model';
import { SubscriptionPlan } from '../../models/subscription/subscription.model';
import { Settings } from '../../models/settings/settings.model';
import { UserSubscription } from '../../models/userSubscription/userSubscription.model';
import { SubscriptionHistory } from '../../models/subscriptionHistory/subscriptionHistory.model';
import { Visitor } from '../../models/visitor/visitor.model';
import { Appointment } from '../../models/appointment/appointment.model';
import { Inquiry } from '../../models/inquiry/inquiry.model';
import { EmailService } from '../../services/email/email.service';
import { AppError } from '../../middlewares/errorHandler';
import { ERROR_CODES } from '../../utils/constants';
import { UserService } from '../user/user.service';
import { SubscriptionPlanService } from '../subscription/subscription.service';
import { UserSubscriptionService } from '../userSubscription/userSubscription.service';
import { AuditLog } from '../../models/auditLog/auditLog.model';
import * as crypto from 'crypto';
import { getRedisClient } from '../../config/redis.config';
import { mapSubscriptionHistoryItem } from '../../utils/subscriptionFormatters';

export class SuperAdminService {

    static async getDashboardStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const firstDayOfYear = new Date(today.getFullYear(), 0, 1);


        const totalUsers = await User.countDocuments({ isDeleted: false, roles: { $ne: 'superadmin' } });
        const activeUsers = await User.countDocuments({ isDeleted: false, isActive: true, roles: { $ne: 'superadmin' } });
        const activeSubs = await User.countDocuments({ isDeleted: false, activeSubscriptionId: { $ne: null }, roles: { $ne: 'superadmin' } });
        const newUsersToday = await User.countDocuments({
            isDeleted: false,
            roles: { $ne: 'superadmin' },
            createdAt: { $gte: today }
        });


        const visitorsToday = await Visitor.countDocuments({
            createdAt: { $gte: today },
            isDeleted: false
        });
        const appointmentsToday = await Appointment.countDocuments({
            createdAt: { $gte: today },
            isDeleted: false
        });


        const getTopUsers = async (startDate: Date) => {
            return await Appointment.aggregate([
                { $match: { createdAt: { $gte: startDate }, isDeleted: false } },
                { $group: { _id: '$createdBy', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                { $unwind: '$user' },
                {
                    $project: {
                        _id: 1,
                        name: '$user.companyName',
                        email: '$user.email',
                        count: 1,
                        logo: '$user.companyLogo'
                    }
                }
            ]);
        };

        const [topUsersToday, topUsersMonth, topUsersYear] = await Promise.all([
            getTopUsers(today),
            getTopUsers(firstDayOfMonth),
            getTopUsers(firstDayOfYear)
        ]);


        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
        twelveMonthsAgo.setDate(1);
        twelveMonthsAgo.setHours(0, 0, 0, 0);

        const userGrowth = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: twelveMonthsAgo },
                    isDeleted: false,
                    roles: { $ne: 'superadmin' }
                }
            },
            {
                $group: {
                    _id: {
                        month: { $month: '$createdAt' },
                        year: { $year: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // Fill in missing months with 0
        const finalUserGrowth = [];
        let currentMonth = new Date(twelveMonthsAgo);
        const endMonth = new Date();
        endMonth.setMonth(endMonth.getMonth() + 1); // Go until next month to cover current

        while (currentMonth < endMonth) {
            const month = currentMonth.getMonth() + 1;
            const year = currentMonth.getFullYear();

            const existingData = userGrowth.find(d => d._id.month === month && d._id.year === year);

            // Format format: "Jan 2024"
            const monthName = currentMonth.toLocaleString('default', { month: 'short' });

            finalUserGrowth.push({
                name: `${monthName} ${year}`,
                users: existingData ? existingData.count : 0
            });

            currentMonth.setMonth(currentMonth.getMonth() + 1);
        }


        // --- Revenue Stats ---
        const revenueStats = await SubscriptionHistory.aggregate([
            {
                $match: {
                    paymentStatus: 'succeeded',
                    isDeleted: false
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$amount' },
                    revenueThisMonth: {
                        $sum: {
                            $cond: [
                                { $gte: ['$createdAt', firstDayOfMonth] },
                                '$amount',
                                0
                            ]
                        }
                    }
                }
            },
            {
                $project: {
                    totalRevenue: { $divide: ['$totalRevenue', 100] },
                    revenueThisMonth: { $divide: ['$revenueThisMonth', 100] }
                }
            }
        ]);

        const totalRevenue = revenueStats[0]?.totalRevenue || 0;
        const revenueThisMonth = revenueStats[0]?.revenueThisMonth || 0;

        // --- Revenue Growth Chart (Last 12 Months) ---
        const revenueGrowth = await SubscriptionHistory.aggregate([
            {
                $match: {
                    createdAt: { $gte: twelveMonthsAgo },
                    paymentStatus: 'succeeded',
                    isDeleted: false
                }
            },
            {
                $group: {
                    _id: {
                        month: { $month: '$createdAt' },
                        year: { $year: '$createdAt' }
                    },
                    totalAmount: { $sum: '$amount' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
            {
                $project: {
                    _id: 1,
                    totalAmount: { $divide: ['$totalAmount', 100] }
                }
            }
        ]);

        // Fill in missing months for Revenue Growth
        const finalRevenueGrowth = [];
        currentMonth = new Date(twelveMonthsAgo); // Reset currentMonth

        while (currentMonth < endMonth) {
            const month = currentMonth.getMonth() + 1;
            const year = currentMonth.getFullYear();

            const existingData = revenueGrowth.find(d => d._id.month === month && d._id.year === year);
            const monthName = currentMonth.toLocaleString('default', { month: 'short' });

            finalRevenueGrowth.push({
                name: `${monthName} ${year}`,
                revenue: existingData ? existingData.totalAmount : 0
            });

            currentMonth.setMonth(currentMonth.getMonth() + 1);
        }

        return {
            totalUsers,
            activeUsers,
            activeSubs,
            newUsersToday,
            financials: {
                totalRevenue,
                revenueThisMonth
            },
            systemUsage: {
                visitorsToday,
                appointmentsToday
            },
            topUsers: {
                today: topUsersToday,
                month: topUsersMonth,
                year: topUsersYear
            },
            userGrowth: finalUserGrowth,
            revenueGrowth: finalRevenueGrowth
        };
    }

    static async getAllUsers(page: number, limit: number, search?: string) {
        const skip = (page - 1) * limit;
        const query: any = { roles: { $ne: 'superadmin' }, isDeleted: false };

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { companyName: searchRegex },
                { email: searchRegex }
            ];
        }

        const total = await User.countDocuments(query);
        const users = await User.find(query)
            .select('-password')
            .populate('activeSubscriptionId')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return {
            users,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    static async createUser(payload: any, createdBy?: string) {
        const { companyName, email, password, role } = payload;

        if (!email || !companyName) {
            throw new AppError('Please provide all required fields', ERROR_CODES.BAD_REQUEST);
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            throw new AppError('User already exists', ERROR_CODES.BAD_REQUEST);
        }

        // Generate random password if not provided
        const finalPassword = password || Math.random().toString(36).slice(-8);
        const finalRole = role || 'admin';

        const user = await User.create({
            companyName,
            email,
            password: finalPassword,
            roles: [finalRole],
            isEmailVerified: true,
            isActive: true,
            createdBy: createdBy || undefined
        });

        await EmailService.sendSafeinUserCredentialsEmail(email, finalPassword, companyName);

        return user;
    }

    // Get Subscription Plans - Reusing SubscriptionPlanService
    static async getSubscriptionPlans() {
        const result = await SubscriptionPlanService.getAllSubscriptionPlans({
            limit: 100, // Fetch all reasonable
            isPublic: 'all', // Fetch ALL public and private plans
            isActive: 'all', // Fetch ALL active and inactive plans
            sortBy: 'sortOrder',
            sortOrder: 'asc'
        });
        return result.plans; // Transform back to array to match controller expectation
    }

    static async createSubscriptionPlan(payload: any) {
        // Direct storage in Rupees as per request
        const plan = await SubscriptionPlan.create(payload);

        return plan;
    }

    // Update Subscription Plan
    static async updateSubscriptionPlan(id: string, payload: any) {
        const plan = await SubscriptionPlan.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
        if (!plan) {
            throw new AppError('Subscription Plan not found', ERROR_CODES.NOT_FOUND);
        }

        return plan;
    }

    // Get Audit Logs
    static async getAuditLogs() {
        // Return actual logs from DB
        return await AuditLog.find().sort({ createdAt: -1 }).limit(100);
    }

    // Toggle Feature
    static async toggleFeature(payload: any) {
        const { feature, enabled } = payload;

        return `Feature ${feature} set to ${enabled}`;
    }

    static async getUserById(id: string) {
        let user: any;
        try {
            user = await UserService.getUserById(id);
        } catch (e) {
            throw new AppError('User not found', ERROR_CODES.NOT_FOUND);
        }

        const settings = await Settings.findOne({ userId: id });

        const subscription = await UserSubscription.findOne({ userId: id, isActive: true })
            .sort({ createdAt: -1 });

        const subscriptionHistory = await SubscriptionHistory.find({ userId: id })
            .sort({ createdAt: -1 })
            .populate('planId', 'name');

        return {
            user,
            settings,
            subscription,
            subscriptionHistory
        };
    }

    static async updateUserProfile(id: string, payload: any, updatedBy?: string) {
        const { companyName, designation, department, notifications, bio, address, socialLinks } = payload;

        if (companyName || designation || department || payload.profilePicture || bio || address || socialLinks) {
            await UserService.updateUser(id, {
                companyName,
                designation,
                department,
                bio,
                address,
                socialLinks,
                profilePicture: payload.profilePicture,
                updatedBy: updatedBy || undefined
            });
        }

        // Specific Settings logic (not in UserService)
        if (notifications) {
            await Settings.findOneAndUpdate(
                { userId: id },
                {
                    $set: {
                        'notifications.emailEnabled': notifications.emailEnabled,
                        'notifications.whatsappEnabled': notifications.whatsappEnabled,
                        'notifications.smsEnabled': notifications.smsEnabled
                    }
                },
                { new: true, upsert: true, setDefaultsOnInsert: true }
            );
        }

        return 'Profile updated successfully';
    }

    // Assign Subscription
    static async assignSubscription(id: string, payload: any) {
        const { planId, startDate } = payload;

        const user = await User.findById(id);
        if (!user) {
            throw new AppError('User not found', ERROR_CODES.NOT_FOUND);
        }

        const plan = await SubscriptionPlan.findById(planId);
        if (!plan) {
            throw new AppError('Subscription Plan not found', ERROR_CODES.NOT_FOUND);
        }

        // Find currently active subscription BEFORE deactivating it
        const activeSub = await UserSubscription.findOne({
            userId: id,
            isActive: true,
            endDate: { $gt: new Date() }
        });

        // Determine effective start date for the NEW SEGMENT
        // If active subscription exists and is valid, the new segment starts after it ends.
        let segmentStart = startDate ? new Date(startDate) : new Date();
        const isExtension = activeSub && activeSub.endDate > new Date();

        if (!startDate && isExtension && activeSub) {
            segmentStart = activeSub.endDate;
        }

        if (isNaN(segmentStart.getTime())) {
            throw new AppError("Invalid Start Date", ERROR_CODES.BAD_REQUEST);
        }

        const segmentEnd = new Date(segmentStart);

        // Calculate base duration based on plan type
        if (plan.planType === 'monthly') segmentEnd.setMonth(segmentStart.getMonth() + 1);
        else if (plan.planType === 'yearly') segmentEnd.setFullYear(segmentStart.getFullYear() + 1);
        else if (plan.planType === 'weekly') segmentEnd.setDate(segmentStart.getDate() + 7);
        else if (plan.planType === 'quarterly') segmentEnd.setMonth(segmentStart.getMonth() + 3);
        else segmentEnd.setDate(segmentStart.getDate() + 30); // Default 30 days

        // Subtract 1 day so it expires the day before renewal
        segmentEnd.setDate(segmentEnd.getDate() - 1);

        // NOTE: We don't add remaining days anymore because we are chaining the dates sequentially.
        // The "remaining days" are implicitly covered by starting relative to the old end date.

        let resultSubscriptionId;

        if (activeSub) {
            // UPDATE existing subscription
            activeSub.planType = plan.planType as any;

            // Only update start date if we are resetting/overwriting (not extending)
            if (!isExtension) {
                activeSub.startDate = segmentStart;
            }

            // End date is always extended to the new segment end
            activeSub.endDate = segmentEnd;
            activeSub.isActive = true;
            activeSub.paymentStatus = 'succeeded';
            activeSub.source = 'admin';

            await activeSub.save();
            resultSubscriptionId = activeSub._id;
        } else {
            // CREATE new subscription if none existed
            const newSubscription = await UserSubscription.create({
                userId: id,
                planType: plan.planType,
                startDate: segmentStart,
                endDate: segmentEnd,
                isActive: true,
                paymentStatus: 'succeeded',
                trialDays: plan.trialDays || 0,
                source: 'admin'
            });
            resultSubscriptionId = newSubscription._id;
        }

        // Add history record for the specific purchased segment
        const taxPercentage = plan.taxPercentage || 0;
        const taxAmount = (plan.amount * taxPercentage) / 100;

        await UserSubscriptionService.createSubscriptionHistoryWithInvoice({
            userId: user._id,
            subscriptionId: resultSubscriptionId as mongoose.Types.ObjectId,
            planType: plan.planType,
            planId: plan._id as mongoose.Types.ObjectId,
            startDate: segmentStart,
            endDate: segmentEnd,
            amount: plan.amount || 0,
            currency: 'INR',
            taxAmount,
            taxPercentage,
            paymentStatus: 'succeeded',
            source: 'admin',
            billingDetails: payload.billingDetails
        });

        user.activeSubscriptionId = resultSubscriptionId as any;
        await user.save();

        return { _id: resultSubscriptionId };
    }

    // Update User - Reuse UserService
    static async updateUser(id: string, payload: any) {
        const { isActive, ...otherPayload } = payload;

        let updatedUser;
        if (Object.keys(otherPayload).length > 0) {
            updatedUser = await UserService.updateUser(id, otherPayload);
        }

        if (typeof isActive === 'boolean') {
            updatedUser = await User.findByIdAndUpdate(id, { isActive }, { new: true });
        }

        return updatedUser;
    }

    static async deleteUser(id: string) {
        await UserService.deleteUser(id, 'superadmin');

        return 'User deleted successfully';
    }

    // Get Subscription History
    // Get Subscription History with Pagination
    static async getSubscriptionHistory(userId: string, page: number = 1, limit: number = 5) {
        const skip = (page - 1) * limit;

        const [history, total] = await Promise.all([
            SubscriptionHistory.find({ userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('planId', 'name')
                .select('+billingDetails') // Explicitly include billingDetails
                .lean(),
            SubscriptionHistory.countDocuments({ userId })
        ]);

        return {
            docs: history.map(mapSubscriptionHistoryItem),
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
        };
    }

    // Cancel Subscription
    static async cancelSubscription(userId: string) {
        const activeSub = await UserSubscription.findOne({ userId, isActive: true });
        if (!activeSub) {
            throw new AppError('No active subscription found', ERROR_CODES.NOT_FOUND);
        }

        activeSub.isActive = false;
        activeSub.endDate = new Date(); // Expire immediately
        await activeSub.save();

        // Update User status
        await User.findByIdAndUpdate(userId, { activeSubscriptionId: null });

        // Add history record for cancellation
        await SubscriptionHistory.create({
            userId,
            subscriptionId: activeSub._id,
            planType: activeSub.planType,
            planId: null, // UserSubscription does not store planId currently
            purchaseDate: new Date(),
            startDate: activeSub.startDate,
            endDate: new Date(),
            amount: 0,
            currency: 'INR',
            paymentStatus: 'cancelled',
            source: 'admin',
            isDeleted: false
        });

        return { message: 'Subscription cancelled successfully' };
    }
    // Impersonate User - Generate OTC
    static async impersonateUser(userId: string) {
        const user = await User.findById(userId);
        if (!user) {
            throw new AppError('User not found', ERROR_CODES.NOT_FOUND);
        }

        // Generate random 32-byte code
        const code = crypto.randomBytes(32).toString('hex');

        // Store in Redis with 60s expiration (Atomic operation)
        const redisKey = `impersonate_code:${code}`;
        const redisClient = getRedisClient();

        // Store userId as value
        await redisClient.set(redisKey, user._id.toString(), 'EX', 60);

        return {
            code // Return ONLY the code, not the token
        };
    }

    // Get Support Inquiries
    static async getInquiries(page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;
        const [inquiries, total] = await Promise.all([
            Inquiry.find({ isDeleted: false })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Inquiry.countDocuments({ isDeleted: false })
        ]);

        return {
            inquiries,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    // Update Inquiry Status
    static async updateInquiryStatus(id: string, status: string, viewedBy?: { userId?: string; userName?: string }) {
        const updateData: any = { status };
        if (viewedBy && status === 'read') {
            updateData.viewedBy = viewedBy;
            updateData.viewedAt = new Date();
        }

        const inquiry = await Inquiry.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!inquiry) {
            throw new AppError('Inquiry not found', ERROR_CODES.NOT_FOUND);
        }

        return inquiry;
    }

    // Mark Inquiry as Viewed
    static async markInquiryAsViewed(id: string, userId: string, userName: string) {
        const inquiry = await Inquiry.findByIdAndUpdate(
            id,
            {
                status: 'read',
                viewedBy: { userId, userName },
                viewedAt: new Date()
            },
            { new: true, runValidators: true }
        );

        if (!inquiry) {
            throw new AppError('Inquiry not found', ERROR_CODES.NOT_FOUND);
        }

        return inquiry;
    }

    // Delete (Archive) Inquiry
    static async deleteInquiry(id: string) {
        const inquiry = await Inquiry.findByIdAndUpdate(
            id,
            { isDeleted: true },
            { new: true }
        );

        if (!inquiry) {
            throw new AppError('Inquiry not found', ERROR_CODES.NOT_FOUND);
        }

        return inquiry;
    }
}
