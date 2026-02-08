import mongoose, { Document } from 'mongoose';
import { UserSubscription } from '../../models/userSubscription/userSubscription.model';
import { User } from '../../models/user/user.model';
import { Employee } from '../../models/employee/employee.model';
import { Visitor } from '../../models/visitor/visitor.model';
import { Appointment } from '../../models/appointment/appointment.model';
import { AppError } from '../../middlewares/errorHandler';
import { ERROR_CODES, CONSTANTS } from '../../utils/constants';
import { ICreateUserSubscriptionDTO, IGetUserSubscriptionsQuery, IUserSubscription, IUserSubscriptionResponse, IUpdateUserSubscriptionDTO, IUserSubscriptionListResponse, IUserSubscriptionStats, ITrialLimitsStatus } from '../../types/userSubscription/userSubscription.types';
import { SubscriptionPlan } from '../../models/subscription/subscription.model';
import { SubscriptionHistory } from '../../models/subscriptionHistory/subscriptionHistory.model';
import { SafeinProfileService } from '../safeinProfile/safeinProfile.service';
import { mapSubscriptionHistoryItem } from '../../utils/subscriptionFormatters';
import { generateInvoiceNumber } from '../../utils/invoiceNumber.util';
import { toObjectId } from '../../utils/idExtractor.util';
import { EmployeeUtil } from '../../utils/employee.util';


export class UserSubscriptionService {

    /**
     * Get user's active subscription
     */
    static async getUserActiveSubscription(userId: string): Promise<IUserSubscriptionResponse | null> {
        try {
            const subscription = await UserSubscription.findOne({
                userId: toObjectId(userId),
                isDeleted: false,
            }).sort({ createdAt: -1 });

            if (!subscription) {
                return null;
            }

            return this.formatUserSubscriptionResponse(subscription);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Common helper to create subscription history with invoice number
     * Used by both user payment flow and admin assignment
     * Made public so SuperAdminService can also use it
     */
    public static async createSubscriptionHistoryWithInvoice(params: {
        userId: string | mongoose.Types.ObjectId;
        subscriptionId: mongoose.Types.ObjectId;
        planType: string;
        planId: string | mongoose.Types.ObjectId;
        startDate: Date;
        endDate: Date;
        amount: number;
        currency?: string;
        taxAmount?: number;
        taxPercentage?: number;
        paymentStatus: string;
        razorpayOrderId?: string;
        razorpayPaymentId?: string;
        source: 'user' | 'admin';
        billingDetails?: any;
        session?: mongoose.ClientSession;
    }) {
        try {
            // Use provided billing details or fetch from SafeinProfile
            let billingDetails = params.billingDetails;
            if (!billingDetails) {
                billingDetails = await this.getBillingDetailsFromSafeinProfile();
            }

            // Generate invoice number from billing details
            const invoicePrefix = billingDetails?.invoiceConfig?.invoicePrefix || 'INV';
            const invoiceSequence = (billingDetails?.invoiceConfig?.nextInvoiceNumber || 0) + 1;
            const invoiceNumber = generateInvoiceNumber(invoicePrefix, invoiceSequence, new Date());

            const subscriptionHistory = new SubscriptionHistory({
                userId: toObjectId(String(params.userId)),
                subscriptionId: params.subscriptionId,
                planType: params.planType,
                planId: toObjectId(String(params.planId)),
                invoiceNumber,
                purchaseDate: new Date(),
                startDate: params.startDate,
                endDate: params.endDate,
                amount: params.amount,
                currency: params.currency || 'INR',
                paymentStatus: params.paymentStatus,
                razorpayOrderId: params.razorpayOrderId,
                razorpayPaymentId: params.razorpayPaymentId,
                source: params.source,
                taxAmount: params.taxAmount || 0,
                taxPercentage: params.taxPercentage || 0,
                billingDetails,
                isDeleted: false
            });

            await subscriptionHistory.save(params.session ? { session: params.session } : undefined);

            return subscriptionHistory;
        } catch (error) {
            console.error('Error creating subscription history with invoice:', error);
            throw error;
        }
    }

    /**
     * Create or update paid subscription after successful Razorpay payment
     * Updates existing subscription instead of creating new one (better approach)
     * Includes idempotency check to prevent duplicate processing
     */
    static async createPaidSubscriptionFromPlan(
        userId: string,
        planId: string,
        razorpayOrderId?: string,
        razorpayPaymentId?: string
    ): Promise<IUserSubscription & Document> {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            // IDEMPOTENCY CHECK: If paymentId exists, check if subscription already created for this payment
            if (razorpayPaymentId) {
                const existingSubscription = await UserSubscription.findOne({
                    razorpayPaymentId: razorpayPaymentId,
                    isDeleted: false,
                }).session(session);

                if (existingSubscription) {
                    await session.abortTransaction();
                    return existingSubscription; // Return existing subscription (idempotent)
                }
            }

            const plan = await SubscriptionPlan.findOne({
                _id: toObjectId(planId),
                isDeleted: false,
                isActive: true,
            }).session(session);

            if (!plan) {
                throw new AppError('Subscription plan not found or inactive', ERROR_CODES.NOT_FOUND);
            }

            // Find existing subscription and update it instead of creating new
            const existingSubscription = await UserSubscription.findOne({
                userId: toObjectId(userId),
                isDeleted: false,
            }).sort({ createdAt: -1 }).session(session);


            const now = new Date();
            let segmentStart = now;
            const isExtension = existingSubscription && existingSubscription.isActive && existingSubscription.endDate > now;

            if (isExtension && existingSubscription) {
                segmentStart = existingSubscription.endDate;
            }

            // Calculate base end date for new plan
            const baseEndDate = this.calculateEndDate(segmentStart, plan.planType);

            // Subtract 1 day so it expires the day before renewal
            const endDate = new Date(baseEndDate);
            endDate.setDate(endDate.getDate() - 1);

            // NOTE: We don't add remaining days anymore because we are chaining the dates sequentially.

            let subscription: IUserSubscription & Document;

            if (existingSubscription) {
                // UPDATE existing subscription instead of creating new
                existingSubscription.planType = plan.planType;

                // Only update start date if we are resetting/overwriting (not extending)
                if (!isExtension) {
                    existingSubscription.startDate = segmentStart;
                }

                // End date is always extended to the new segment end
                existingSubscription.endDate = endDate;
                existingSubscription.isActive = true;
                existingSubscription.paymentStatus = 'succeeded';
                existingSubscription.trialDays = plan.trialDays || 0;
                existingSubscription.razorpayOrderId = razorpayOrderId || undefined;
                existingSubscription.razorpayPaymentId = razorpayPaymentId || undefined;
                existingSubscription.updatedAt = new Date();

                await existingSubscription.save({ session });
                subscription = existingSubscription;
            } else {
                // Create new only if no existing subscription found
                subscription = new UserSubscription({
                    userId: toObjectId(userId),
                    planType: plan.planType,
                    startDate: segmentStart,
                    endDate,
                    isActive: true,
                    paymentStatus: 'succeeded',
                    trialDays: plan.trialDays || 0,
                    razorpayOrderId: razorpayOrderId || undefined,
                    razorpayPaymentId: razorpayPaymentId || undefined,
                });

                await subscription.save({ session });
            }

            // Store purchase history
            const taxPercentage = plan.taxPercentage || 0;
            const taxAmount = (plan.amount * taxPercentage) / 100;

            await UserSubscriptionService.createSubscriptionHistoryWithInvoice({
                userId,
                subscriptionId: subscription._id as mongoose.Types.ObjectId,
                planType: plan.planType,
                planId,
                startDate: segmentStart,
                endDate: endDate,
                amount: plan.amount,
                currency: plan.currency,
                taxAmount,
                taxPercentage,
                paymentStatus: 'succeeded',
                razorpayOrderId,
                razorpayPaymentId,
                source: 'user',
                billingDetails: undefined,
                session
            });

            // Update user's activeSubscriptionId
            const user = await User.findById(userId).session(session);
            if (user) {
                user.activeSubscriptionId = subscription._id as mongoose.Types.ObjectId;
                await user.save({ session });
            }

            await session.commitTransaction();
            return subscription;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    private static calculateEndDate(startDate: Date, planType: string): Date {
        const end = new Date(startDate);
        switch (planType) {
            case 'weekly':
                end.setDate(end.getDate() + 7);
                break;
            case 'monthly':
                end.setMonth(end.getMonth() + 1);
                break;
            case 'quarterly':
                end.setMonth(end.getMonth() + 3);
                break;
            case 'yearly':
                end.setFullYear(end.getFullYear() + 1);
                break;
            case 'free':
            default:
                end.setDate(end.getDate() + 30);
                break;
        }
        return end;
    }


    /**
     * Get all user subscriptions with pagination, filtering, and sorting.
     */
    static async getAllUserSubscriptions(
        query: IGetUserSubscriptionsQuery
    ): Promise<IUserSubscriptionListResponse> {
        try {
            const { page = 1, limit = 10, userId, planType, status, sortBy, sortOrder } = query;
            const skip = (page - 1) * limit;

            const filter: any = { isDeleted: false };
            if (userId) {
                filter.userId = toObjectId(userId);
            }
            if (planType) {
                filter.planType = planType;
            }
            if (status) { // This maps to paymentStatus in our model
                filter.paymentStatus = status;
            }

            const sort: any = {};
            if (sortBy && sortOrder) {
                sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
            } else {
                sort.createdAt = -1; // Default sort
            }

            const subscriptions = await UserSubscription.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate('userId', 'email companyId') // Populate user details if needed
                .exec();

            const totalSubscriptions = await UserSubscription.countDocuments(filter);

            const formattedSubscriptions = subscriptions.map(sub => this.formatUserSubscriptionResponse(sub));

            return {
                subscriptions: formattedSubscriptions,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalSubscriptions / limit),
                    totalSubscriptions,
                    hasNextPage: totalSubscriptions > skip + subscriptions.length,
                    hasPrevPage: page > 1,
                },
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get user subscription by ID.
     */
    static async getUserSubscriptionById(id: string): Promise<IUserSubscriptionResponse | null> {
        try {
            const subscription = await UserSubscription.findById(id).populate('userId', 'email companyId');

            if (!subscription) {
                throw new AppError('User subscription not found', ERROR_CODES.NOT_FOUND);
            }

            return this.formatUserSubscriptionResponse(subscription);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Helper to fetch billing details from SafeIn Profile
     */
    private static async getBillingDetailsFromSafeinProfile() {
        try {
            const profile = await SafeinProfileService.getSafeinProfile();

            // Map SafeIn Profile (connected to BusinessProfiles) to Billing Details structure
            const company = profile.companyDetails;

            const billingDetails = {
                companyDetails: {
                    name: company?.name || CONSTANTS.COMPANY_BILLING_DETAILS.name,
                    email: company?.email || CONSTANTS.COMPANY_BILLING_DETAILS.email,
                    phone: company?.phone || CONSTANTS.COMPANY_BILLING_DETAILS.phone,
                    cin: company?.cin,
                    gstin: company?.gstin,
                    pan: company?.pan,
                    tan: company?.tan,
                    address: company?.address || (CONSTANTS.COMPANY_BILLING_DETAILS.address as any).street,
                    city: company?.city,
                    state: company?.state,
                    country: company?.country,
                    postalCode: company?.postalCode,
                    logo: company?.logo,
                    signature: company?.signature,
                },
                bankDetails: profile.bankDetails,
                invoiceConfig: {
                    invoicePrefix: profile.documentSettings?.invoicePrefix,
                    nextInvoiceNumber: profile.documentSettings?.nextInvoiceNumber,
                    termsAndConditions: profile.defaults?.defaultTerms?.invoice
                }
            };
            return billingDetails;
        } catch (error) {
            console.error('Error fetching SafeIn profile for billing details:', error);
            // Return correctly structured fallback
            return {
                companyDetails: CONSTANTS.COMPANY_BILLING_DETAILS,
                bankDetails: {},
                invoiceConfig: {
                    invoicePrefix: 'INV',
                    nextInvoiceNumber: 0,
                    termsAndConditions: ''
                }
            };
        }
    }

    /**
     * Create a new user subscription.
     */
    static async createUserSubscription(
        subscriptionData: ICreateUserSubscriptionDTO
    ): Promise<IUserSubscriptionResponse> {
        try {
            const newSubscriptionData = {
                ...subscriptionData,
                userId: toObjectId(subscriptionData.userId),
            };

            const newSubscription = await UserSubscription.create(newSubscriptionData);

            // If subscription is active and has a planId, create history (Invoice)
            if (newSubscription.isActive && subscriptionData.planId) {
                try {
                    const plan = await SubscriptionPlan.findById(subscriptionData.planId);
                    if (plan) {
                        await UserSubscriptionService.createSubscriptionHistoryWithInvoice({
                            userId: subscriptionData.userId,
                            subscriptionId: newSubscription._id as mongoose.Types.ObjectId,
                            planType: plan.planType,
                            planId: subscriptionData.planId,
                            startDate: newSubscription.startDate,
                            endDate: newSubscription.endDate,
                            amount: plan.amount,
                            currency: plan.currency,
                            paymentStatus: 'succeeded',
                            source: 'admin',
                            billingDetails: undefined
                        });
                    }
                } catch (historyError) {
                    console.error('Error creating subscription history for admin assignment:', historyError);
                    // Don't fail the main request, but log error
                }
            }

            return this.formatUserSubscriptionResponse(newSubscription);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update an existing user subscription.
     */
    static async updateUserSubscription(
        id: string,
        updateData: IUpdateUserSubscriptionDTO
    ): Promise<IUserSubscriptionResponse> {
        try {
            const updatedSubscriptionData: any = { ...updateData };

            if (updatedSubscriptionData.userId) {
                updatedSubscriptionData.userId = toObjectId(updatedSubscriptionData.userId);
            }
            if (updatedSubscriptionData.deletedBy) {
                updatedSubscriptionData.deletedBy = toObjectId(updatedSubscriptionData.deletedBy);
            }

            const updatedSubscription = await UserSubscription.findByIdAndUpdate(
                id,
                updatedSubscriptionData,
                { new: true }
            );

            if (!updatedSubscription) {
                throw new AppError('User subscription not found', ERROR_CODES.NOT_FOUND);
            }

            return this.formatUserSubscriptionResponse(updatedSubscription);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Cancel a user subscription (soft delete).
     */
    static async cancelUserSubscription(id: string): Promise<IUserSubscriptionResponse> {
        try {
            const subscription = await UserSubscription.findById(id);

            if (!subscription) {
                throw new AppError('User subscription not found', ERROR_CODES.NOT_FOUND);
            }

            subscription.isDeleted = true;
            subscription.deletedAt = new Date();
            subscription.isActive = false;

            await subscription.save();

            return this.formatUserSubscriptionResponse(subscription);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get subscription statistics.
     */
    static async getSubscriptionStats(): Promise<IUserSubscriptionStats> {
        try {
            const totalSubscriptions = await UserSubscription.countDocuments({ isDeleted: false });
            const activeSubscriptions = await UserSubscription.countDocuments({ isActive: true, isDeleted: false });
            const canceledSubscriptions = await UserSubscription.countDocuments({ isDeleted: true });
            const expiredSubscriptions = await UserSubscription.countDocuments({ isActive: false, endDate: { $lte: new Date() }, isDeleted: false });
            const trialingSubscriptions = await UserSubscription.countDocuments({ planType: 'free', isActive: true, endDate: { $gt: new Date() }, isDeleted: false });

            const totalRevenue = 0;
            const averageSubscriptionValue = 0;

            return {
                totalSubscriptions,
                activeSubscriptions,
                canceledSubscriptions,
                expiredSubscriptions,
                trialingSubscriptions,
                subscriptionsByStatus: {
                    active: activeSubscriptions,
                    canceled: canceledSubscriptions,
                    expired: expiredSubscriptions,
                    pending: await UserSubscription.countDocuments({ paymentStatus: 'pending', isDeleted: false }),
                    past_due: 0, // Not explicitly handled yet
                    trialing: trialingSubscriptions,
                },
                totalRevenue,
                averageSubscriptionValue,
            };
        } catch (error) {
            throw error;
        }
    }

    static async getTrialLimitsCounts(userId: string, subscriptionStartDate?: Date): Promise<{
        employees: number;
        visitors: number;
        appointments: number;
    }> {
        // Resolve admin ID - employees share admin's limits
        const adminId = await EmployeeUtil.getAdminId(userId);
        const userObjectId = toObjectId(adminId);

        // Get all employees created by this user
        const employees = await Employee.find({
            createdBy: userObjectId,
            isDeleted: false
        }).select('_id').lean();

        const employeeIds = employees.map((emp: any) => emp._id);

        // Calculate current month's date range based on subscription start date
        // Monthly limits reset every month from subscription start date
        // Example: If subscription started on Jan 15, then:
        // - Month 1: Jan 15 - Feb 14
        // - Month 2: Feb 15 - Mar 14
        // - Month 3: Mar 15 - Apr 14
        let monthStart: Date;
        let monthEnd: Date;

        if (subscriptionStartDate) {
            const now = new Date();
            const startDate = new Date(subscriptionStartDate);
            startDate.setHours(0, 0, 0, 0);

            // Calculate which subscription month we're currently in
            // Monthly cycle is based on subscription start date's day
            // Example: If subscription started on Jan 15:
            // - Month 1: Jan 15 - Feb 14
            // - Month 2: Feb 15 - Mar 14
            // - Month 3: Mar 15 - Apr 14

            const startDay = startDate.getDate();
            const nowDay = now.getDate();

            // Calculate months difference
            let monthsDiff = (now.getFullYear() - startDate.getFullYear()) * 12 +
                (now.getMonth() - startDate.getMonth());

            // Adjust if current day is before subscription start day in the month
            // Example: Start on Jan 15, today is Feb 10 → still in Month 1
            if (nowDay < startDay) {
                monthsDiff -= 1;
            }

            // Calculate current subscription month start
            // Start from subscription start date + monthsDiff months
            monthStart = new Date(startDate);
            monthStart.setMonth(startDate.getMonth() + monthsDiff);
            monthStart.setHours(0, 0, 0, 0);

            // Calculate current subscription month end (start + 1 month - 1 day)
            monthEnd = new Date(monthStart);
            monthEnd.setMonth(monthEnd.getMonth() + 1);
            monthEnd.setDate(monthEnd.getDate() - 1); // Last day of current subscription month
            monthEnd.setHours(23, 59, 59, 999);
        } else {
            // For free/trial users without subscription, use current calendar month
            const now = new Date();
            monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            monthStart.setHours(0, 0, 0, 0);
            monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            monthEnd.setHours(23, 59, 59, 999);
        }

        // Count appointments for current month only:
        // 1. Directly created by user (createdBy = userId)
        // 2. Created by employees of this user (employeeId in employeeIds)
        // 3. Created within current month (based on subscription cycle)
        // This ensures all appointments (admin + employees) count towards admin's monthly subscription limit
        const [employeeCount, visitorCount, appointmentCount] = await Promise.all([
            Employee.countDocuments({ createdBy: userObjectId, isDeleted: false }),
            Visitor.countDocuments({ createdBy: userObjectId, isDeleted: false }),
            Appointment.countDocuments({
                isDeleted: false,
                createdAt: {
                    $gte: monthStart,
                    $lte: monthEnd
                },
                $or: [
                    { createdBy: userObjectId }, // Directly created by admin
                    ...(employeeIds.length > 0 ? [{ employeeId: { $in: employeeIds } }] : []) // Created for admin's employees
                ]
            }),
        ]);

        return {
            employees: employeeCount,
            visitors: visitorCount,
            appointments: appointmentCount,
        };
    }

    /**
     * Get a comprehensive subscription status for a user
     */
    static async getSubscriptionStatus(userId: string): Promise<ITrialLimitsStatus> {
        // Resolve admin ID - employees share admin's subscription
        const adminId = await EmployeeUtil.getAdminId(userId);
        const adminObjectId = toObjectId(adminId);
        const isEmployee = adminId !== userId;

        // Fetch necessary data in parallel
        const subDocPromise = UserSubscription.findOne({
            userId: adminObjectId,
            isDeleted: false
        }).sort({ createdAt: -1 });

        const [subDoc] = await Promise.all([subDocPromise]);

        // Get counts with subscription start date for monthly limit calculation
        const subscriptionStartDate = subDoc?.startDate;
        const countsPromise = this.getTrialLimitsCounts(userId, subscriptionStartDate);

        const counts = await countsPromise;

        const formattedSub = subDoc ? this.formatUserSubscriptionResponse(subDoc) : null;

        // Determine plan type to fetch limits
        const planType = formattedSub ? formattedSub.planType : 'free';

        // Fetch plan details to get limits
        const planDoc = await SubscriptionPlan.findOne({ planType: planType, isActive: true });

        const isActive = !!formattedSub && formattedSub.hasActiveSubscription;
        const isTrial = !formattedSub || formattedSub.planType === 'free' || formattedSub.isTrialing;
        const subscriptionStatus = formattedSub ? formattedSub.subscriptionStatus || 'none' : 'none';
        const isExpired = !isActive;

        const checkCreationLimit = (type: 'employees' | 'visitors' | 'appointments') => {
            // Default to -1 (unlimited) if plan not found
            // If plan found, use its limit. If limit is undefined in DB, default to -1.
            const limit = planDoc?.limits?.[type] ?? -1;
            const current = counts[type];

            // If limit is -1, it's unlimited.
            if (limit === -1) {
                const reached = isExpired; // Only reached if expired
                return { limit, current, reached, canCreate: !isExpired };
            }

            // If limit is set (> -1)
            const reached = isExpired || current >= limit;
            return { limit, current, reached, canCreate: !isExpired && !reached };
        };

        return {
            isTrial,
            planType,
            subscriptionStatus,
            isActive: isActive || false,
            isExpired,
            isEmployeeContext: isEmployee,
            limits: {
                employees: checkCreationLimit('employees'),
                visitors: checkCreationLimit('visitors'),
                appointments: checkCreationLimit('appointments'),
            }
        };
    }

    /**
     * Check if a user can create another resource based on their plan limits
     * This applies to both trial and paid subscriptions
     * 
     * Key points:
     * - Employee creation counts against the subscription owner's (createdBy) employee limit
     * - Employee's user account does NOT count as a separate subscription
     * - Employees share the subscription of the user who created them
     */
    /**
     * Check if a user can create another resource based on their plan limits
     * This applies to both trial and paid subscriptions
     * 
     * @param userId - User ID (for employees, this should be admin's userId)
     * @param type - Resource type to check
     * @param isEmployeeContext - Optional: true if called from employee context (for better error messages)
     */
    static async checkPlanLimits(userId: string, type: 'employees' | 'visitors' | 'appointments', isEmployeeContext: boolean = false): Promise<void> {
        const status = await this.getSubscriptionStatus(userId);

        // Use detected employee context from status if not provided
        const effectiveIsEmployeeContext = isEmployeeContext || (status as any).isEmployeeContext;

        // Check if subscription is expired
        if (status.isExpired) {
            const message = effectiveIsEmployeeContext
                ? "Your admin's subscription has expired. Please contact your administrator to renew the subscription."
                : 'Your subscription has expired. Please upgrade or recharge to create new items.';
            throw new AppError(message, ERROR_CODES.PAYMENT_REQUIRED);
        }

        const limitInfo = status.limits[type];

        // Check if limit is reached (applies to both trial and paid plans)
        // Unlimited plans have limit = -1, so they will never reach the limit
        // The limitInfo.reached already accounts for both expired and limit reached scenarios
        if (limitInfo.reached) {
            const limitText = limitInfo.limit === -1 ? 'unlimited' : limitInfo.limit.toString();
            const currentText = limitInfo.current.toString();

            let message: string;
            if (effectiveIsEmployeeContext) {
                if (status.isTrial) {
                    message = `Your admin's free ${type} limit (${limitText}) has been reached. Currently ${currentText} ${type} exist. Please contact your administrator to upgrade.`;
                } else {
                    message = `Your admin's ${type} limit (${limitText}) has been reached. Currently ${currentText} ${type} exist. Please contact your administrator to upgrade the plan.`;
                }
            } else {
                if (status.isTrial) {
                    message = `Your free ${type} limit (${limitText}) has been reached. You currently have ${currentText} ${type}. Please upgrade to continue.`;
                } else {
                    message = `You have reached your plan's ${type} limit (${limitText}). You currently have ${currentText} ${type}. Please upgrade to a higher plan to create more ${type}.`;
                }
            }

            throw new AppError(message, ERROR_CODES.PAYMENT_REQUIRED);
        }
    }

    /**
     * Process expired subscriptions (e.g., set to inactive, update payment status).
     * This method would typically be called by a cron job.
     */
    static async processExpiredSubscriptions(): Promise<void> {
        try {
            const now = new Date();
            const expiredSubscriptions = await UserSubscription.find({
                isActive: true,
                endDate: { $lte: now },
                isDeleted: false,
            });

            for (const subscription of expiredSubscriptions) {
                subscription.isActive = false;
                subscription.paymentStatus = 'failed'; // Assuming expiry due to failed payment/non-renewal
                await subscription.save();
            }

        } catch (error) {
            throw error;
        }
    }


    /**
     * Get subscription history for a user (all successful purchases)
     */
    static async getUserSubscriptionHistory(userId: string): Promise<any[]> {
        try {
            const history = await SubscriptionHistory.find({
                userId: toObjectId(userId),
                isDeleted: false,
                paymentStatus: 'succeeded', // Only successful payments
            })
                .sort({ purchaseDate: -1 }) // Most recent first
                .populate('planId', 'name amount currency')
                .select('+billingDetails') // Explicitly include billingDetails
                .exec();

            return history.map(mapSubscriptionHistoryItem);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Format user subscription response with permission flags
     */
    private static formatUserSubscriptionResponse(subscription: IUserSubscription & Document): IUserSubscriptionResponse {
        const now = new Date();
        const isTrialing = subscription.planType === 'free' && subscription.endDate > now;
        const isExpired = subscription.endDate <= now;

        // Calculate permission flags on backend for security
        const hasActiveSubscription =
            subscription.isActive &&
            !subscription.isDeleted &&
            subscription.paymentStatus === 'succeeded' &&
            !isExpired;

        const canAccessDashboard = hasActiveSubscription || isTrialing;

        // Determine subscription status
        let subscriptionStatus: 'active' | 'trialing' | 'cancelled' | 'expired' | 'pending';
        if (subscription.paymentStatus === 'cancelled') {
            subscriptionStatus = 'cancelled';
        } else if (isExpired) {
            subscriptionStatus = 'expired';
        } else if (isTrialing) {
            subscriptionStatus = 'trialing';
        } else if (subscription.paymentStatus === 'pending') {
            subscriptionStatus = 'pending';
        } else if (hasActiveSubscription) {
            subscriptionStatus = 'active';
        } else {
            subscriptionStatus = 'pending';
        }

        return {
            _id: (subscription._id as mongoose.Types.ObjectId).toString(),
            userId: subscription.userId.toString(),
            planType: subscription.planType,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            isActive: subscription.isActive,
            paymentStatus: subscription.paymentStatus,
            trialDays: subscription.trialDays || 0,
            isTrialing,
            isDeleted: subscription.isDeleted,
            deletedAt: subscription.deletedAt,
            deletedBy: subscription.deletedBy ? (subscription.deletedBy as mongoose.Types.ObjectId).toString() : undefined,
            createdAt: subscription.createdAt,
            updatedAt: subscription.updatedAt,
            // Permission flags calculated on backend
            canAccessDashboard,
            hasActiveSubscription,
            subscriptionStatus,
        };
    }
}
