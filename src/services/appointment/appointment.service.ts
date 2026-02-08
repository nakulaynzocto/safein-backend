import { Appointment } from '../../models/appointment/appointment.model';
import { Employee } from '../../models/employee/employee.model';
import { Visitor } from '../../models/visitor/visitor.model';
import { User } from '../../models/user/user.model';
import { EmailService } from '../email/email.service';
import { ApprovalLinkService } from '../approvalLink/approvalLink.service';
import { ApprovalLink } from '../../models/approvalLink/approvalLink.model';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { SettingsService } from '../settings/settings.service';
import { UserSubscriptionService } from '../userSubscription/userSubscription.service';
import { socketService } from '../socket/socket.service';
import {
    ICreateAppointmentDTO,
    IUpdateAppointmentDTO,
    IAppointmentResponse,
    IGetAppointmentsQuery,
    IAppointmentListResponse,
    ICheckInRequest,
    ICheckOutRequest
} from '../../types/appointment/appointment.types';
import { ERROR_MESSAGES, ERROR_CODES } from '../../utils/constants';
import { AppError } from '../../middlewares/errorHandler';
import { Transaction } from '../../decorators';
import { toObjectId } from '../../utils/idExtractor.util';
import { escapeRegex } from '../../utils/string.util';

export interface IDashboardStats {
    totalAppointments: number;
    pendingAppointments: number;
    approvedAppointments: number;
    rejectedAppointments: number;
    completedAppointments: number;
    upcomingAppointments: number;
    todayAppointments: number;
}

export class AppointmentService {
    /**
     * Helper function to send socket notifications to admin and/or employee
     * Notification Rules:
     * 1. Admin approve/reject → Only Employee gets notification (admin performed action, so admin doesn't need notification)
     * 2. Employee approve/reject/completed → Only Admin gets notification (employee performed action, so employee doesn't need notification)
     * 3. Admin creates appointment → Only Employee gets notification (admin already knows they created it)
     * 4. Visitor creates appointment via link → Both admin and employee get notification
     * 
     * @param actionBy - 'admin' if admin is performing the action, 'employee' if employee is performing the action, 'visitor' if visitor created via link
     */
    static async sendSocketNotificationToAdminAndEmployee(
        _appointment: any,
        populatedAppointment: any,
        adminUserId: string,
        eventType: 'created' | 'statusChange',
        appointmentData: any,
        showNotification: boolean = true,
        actionBy: 'admin' | 'employee' | 'visitor' = 'admin'
    ): Promise<void> {
        try {
            // Normalize adminUserId to string for consistent comparison and socket room naming
            const adminUserIdString = adminUserId
                ? (typeof adminUserId === 'string' ? adminUserId : (adminUserId as any)?.toString() || String(adminUserId))
                : null;

            // Send to admin only if:
            // - Employee performed the action (admin needs to know employee approved/rejected/completed)
            // - Visitor created appointment via link (admin should know about new appointments from visitors)
            // - NOT if admin created the appointment (admin already knows they created it)
            if (adminUserIdString && (actionBy === 'employee' || (eventType === 'created' && actionBy === 'visitor'))) {
                try {
                    if (eventType === 'created') {
                        await socketService.emitAppointmentCreated(adminUserIdString, appointmentData, showNotification);
                    } else {
                        await socketService.emitAppointmentStatusChange(adminUserIdString, appointmentData, showNotification);
                    }
                } catch (socketError: any) {
                    console.warn('Failed to send socket notification to admin:', socketError?.message || socketError);
                }
            }

            // Send to employee only if:
            // - Admin performed the action (employee needs to know admin approved/rejected)
            // - Appointment was created (employee should know about new appointments for them - whether by admin or visitor)
            if (actionBy === 'admin' || eventType === 'created') {
                try {
                    const employee = populatedAppointment?.employeeId as any;
                    if (employee && employee.email) {
                        const employeeUser = await User.findOne({
                            email: employee.email.toLowerCase().trim(),
                            isDeleted: false,
                            isActive: true
                        }).select('_id').lean();

                        if (employeeUser && employeeUser._id) {
                            const employeeUserId = (employeeUser._id as any).toString();
                            // Only send if employee user is different from admin (compare as strings)
                            if (employeeUserId !== adminUserIdString) {
                                if (eventType === 'created') {
                                    await socketService.emitAppointmentCreated(employeeUserId, appointmentData, showNotification);
                                } else {
                                    await socketService.emitAppointmentStatusChange(employeeUserId, appointmentData, showNotification);
                                }
                            }
                        }
                    }
                } catch (employeeSocketError: any) {
                    console.warn('Failed to send socket notification to employee:', employeeSocketError?.message || employeeSocketError);
                }
            }
            // If actionBy === 'employee' and eventType === 'statusChange', only admin gets notification (employee already knows they performed the action)
        } catch (socketError: any) {
            console.error('Failed to send socket notification:', socketError?.message || socketError);
        }
    }

    @Transaction('Failed to create appointment')
    static async createAppointment(appointmentData: ICreateAppointmentDTO, createdBy: string, options: { session?: any; sendNotifications?: boolean; createdByVisitor?: boolean; adminUserId?: string; suppressEmails?: boolean } = {}): Promise<IAppointmentResponse> {
        const { session, sendNotifications = false, createdByVisitor = false, adminUserId, suppressEmails = false } = options;

        // Check plan limits before creating appointment
        // Use adminUserId if visitor is creating (from appointment link), otherwise use createdBy
        const userIdForLimitCheck = adminUserId || createdBy;
        try {
            await UserSubscriptionService.checkPlanLimits(userIdForLimitCheck, 'appointments', false);
        } catch (error: any) {
            // Re-throw the error from checkPlanLimits
            throw error;
        }

        const employee = await Employee.findOne({ _id: appointmentData.employeeId, isDeleted: false }).session(session);
        if (!employee) {
            throw new AppError(ERROR_MESSAGES.EMPLOYEE_NOT_FOUND, ERROR_CODES.NOT_FOUND);
        }
        if (employee.status === 'Inactive') {
            throw new AppError('Employee is inactive. Please select an active employee.', ERROR_CODES.BAD_REQUEST);
        }

        const conflictAppointment = await Appointment.findOne({
            employeeId: appointmentData.employeeId,
            'appointmentDetails.scheduledDate': appointmentData.appointmentDetails.scheduledDate,
            'appointmentDetails.scheduledTime': appointmentData.appointmentDetails.scheduledTime,
            status: 'approved',
            isDeleted: false
        }).session(session);

        if (conflictAppointment) {
            throw new AppError('Employee already has an appointment at this time', ERROR_CODES.CONFLICT);
        }

        const appointment = new Appointment({
            ...appointmentData,
            createdBy
        });

        await appointment.save({ session });

        const populatedAppointment = await Appointment.findById(appointment._id)
            .populate('employeeId', 'name email phone department')
            .populate('visitorId', 'name email phone address idProof photo')
            .session(session);

        // Only create approval link if appointment status is 'pending'
        // If status is 'approved' (e.g., created via employee's appointment link), no approval needed
        let approvalLink = null;
        if (appointment.status === 'pending') {
            try {
                const appointmentId = (appointment._id as any).toString();
                approvalLink = await ApprovalLinkService.createApprovalLink(appointmentId);
            } catch (error: any) {
                // Log error for debugging but continue without approval link
                console.error('Failed to create approval link for appointment:', appointment._id, error?.message || error);
                // Approval link creation failed, continue without it
            }
        }

        const emailEnabled = await SettingsService.isEmailEnabled(createdBy);
        const whatsappEnabled = await SettingsService.isWhatsAppEnabled(createdBy);
        const smsEnabled = await SettingsService.isSmsEnabled(createdBy);

        // Get company name and profile picture (used as company logo) from user (createdBy) for email fromName and branding
        let companyName: string | undefined;
        let companyLogo: string | undefined;
        try {
            const user = await User.findById(createdBy).select('companyName profilePicture').lean();
            companyName = user?.companyName;
            companyLogo = user?.profilePicture || undefined; // Use profilePicture as company logo
        } catch (error) {
            // If user not found or error, companyName and companyLogo will remain undefined
            console.warn('Failed to fetch company name and logo for email:', error);
        }

        // 🔔 Process all notifications (Email, WhatsApp, Socket) in background to reduce API latency
        this.processBackgroundNotifications(
            (appointment._id as any).toString(),
            appointment.status,
            populatedAppointment,
            createdBy,
            approvalLink,
            {
                emailEnabled,
                whatsappEnabled,
                smsEnabled,
                sendNotifications,
                createdByVisitor,
                adminUserId,
                companyName,
                companyLogo,
                suppressEmails
            }
        ).catch(err => console.error('Background notification processing failed:', err));

        // Socket notification also moved to background process

        const appointmentResponse = appointment.toObject() as unknown as IAppointmentResponse;
        return {
            ...appointmentResponse,
            approvalLink: approvalLink?.link || null
        } as IAppointmentResponse;
    }

    /**
     * Process notifications (Email, WhatsApp, SMS, Socket) in background
     * Does NOT use the original transaction session
     */
    private static async processBackgroundNotifications(
        appointmentId: string,
        status: string,
        populatedAppointment: any,
        createdBy: string,
        approvalLink: any,
        options: {
            emailEnabled: boolean;
            whatsappEnabled: boolean;
            smsEnabled: boolean;
            sendNotifications: boolean;
            createdByVisitor?: boolean;
            adminUserId?: string;
            companyName?: string;
            companyLogo?: string;
            suppressEmails?: boolean;
        }
    ) {
        const {
            emailEnabled,
            whatsappEnabled,
            sendNotifications,
            createdByVisitor,
            adminUserId,
            companyName,
            companyLogo,
            suppressEmails
        } = options;

        let emailSent = false;
        let whatsappSent = false;

        // 📧 Handle Email Notifications
        try {
            if (populatedAppointment && emailEnabled && !suppressEmails) {
                const employeeEmail = (populatedAppointment.employeeId as any)?.email;
                const employeeName = (populatedAppointment.employeeId as any)?.name;

                if (status === 'approved') {
                    if (employeeEmail) {
                        const visitorName = (populatedAppointment.visitorId as any)?.name || 'Visitor';
                        await EmailService.sendAppointmentConfirmationEmail(
                            employeeEmail,
                            employeeName,
                            visitorName,
                            populatedAppointment.appointmentDetails.scheduledDate,
                            populatedAppointment.appointmentDetails.scheduledTime,
                            populatedAppointment.appointmentDetails.purpose,
                            companyName,
                            companyLogo
                        );
                        emailSent = true;
                    }
                } else if (employeeEmail && approvalLink?.token) {
                    await EmailService.sendNewAppointmentRequestEmail(
                        employeeEmail,
                        employeeName,
                        populatedAppointment.visitorId as any,
                        populatedAppointment.appointmentDetails.scheduledDate,
                        populatedAppointment.appointmentDetails.scheduledTime,
                        populatedAppointment.appointmentDetails.purpose,
                        approvalLink.token,
                        companyName,
                        companyLogo
                    );
                    emailSent = true;
                }
            }
        } catch (error: any) {
            console.error('Failed to send appointment notification email (background):', error?.message || error);
        }

        // 📱 Send WhatsApp notification
        try {
            if (populatedAppointment && whatsappEnabled) {
                const employeePhone = (populatedAppointment.employeeId as any)?.phone;
                const employeeName = (populatedAppointment.employeeId as any)?.name;

                if (status === 'pending' && employeePhone && approvalLink?.link) {
                    const sent = await WhatsAppService.sendAppointmentNotification(
                        employeePhone,
                        employeeName,
                        {
                            name: (populatedAppointment.visitorId as any).name,
                            email: (populatedAppointment.visitorId as any).email,
                            phone: (populatedAppointment.visitorId as any).phone,
                            _id: (populatedAppointment.visitorId as any)._id?.toString()
                        },
                        populatedAppointment.appointmentDetails.scheduledDate,
                        populatedAppointment.appointmentDetails.scheduledTime,
                        populatedAppointment.appointmentDetails.purpose,
                        approvalLink.link,
                        (populatedAppointment._id as any).toString()
                    );
                    whatsappSent = sent;
                }
            }
        } catch (error: any) {
            console.error('Failed to send WhatsApp notification (background):', error?.message || error);
        }

        // Update DB with notification status (New operation, no session)
        if (emailSent || whatsappSent) {
            try {
                await Appointment.updateOne(
                    { _id: appointmentId },
                    {
                        $set: {
                            'notifications.emailSent': emailSent,
                            'notifications.whatsappSent': whatsappSent,
                            'notifications.smsSent': false
                        }
                    }
                );
            } catch (dbError) {
                console.error('Failed to update notification status in DB:', dbError);
            }
        }

        // 🔔 Send Socket Notification
        try {
            if (sendNotifications && populatedAppointment) {
                const appointmentObj = populatedAppointment.toObject ? populatedAppointment.toObject({ virtuals: true }) : populatedAppointment;
                const serializedAppointment = JSON.parse(JSON.stringify(appointmentObj));

                const userIdForNotification = adminUserId || ((createdBy as any)?.toString() || createdBy);

                const appointmentData = {
                    appointmentId: appointmentId,
                    appointment: serializedAppointment,
                    status: status,
                    createdAt: new Date(),
                };

                const actionBy = createdByVisitor ? 'visitor' : 'admin';
                await this.sendSocketNotificationToAdminAndEmployee(
                    null, // Pass null as we don't have the mongoose document in this context easily, or use populatedAppointment if compatible
                    populatedAppointment,
                    userIdForNotification,
                    'created',
                    appointmentData,
                    sendNotifications,
                    actionBy
                );
            }
        } catch (socketError: any) {
            console.error('Failed to send socket notification (background):', socketError?.message || socketError);
        }
    }

    static async getAppointmentById(appointmentId: string): Promise<IAppointmentResponse> {
        const appointment = await Appointment.findOne({ _id: appointmentId, isDeleted: false })
            .populate('employeeId', 'name email department designation phone')
            .populate('visitorId', 'name email phone photo address idProof')
            .populate('createdBy', 'firstName lastName email')
            .populate('deletedBy', 'firstName lastName email');

        if (!appointment) {
            throw new AppError('Appointment not found', ERROR_CODES.NOT_FOUND);
        }

        return appointment.toObject() as unknown as IAppointmentResponse;
    }

    /**
     * Get appointment by appointment ID
     */
    static async getAppointmentByAppointmentId(appointmentId: string): Promise<IAppointmentResponse> {
        const appointmentIdObjectId = toObjectId(appointmentId);
        if (!appointmentIdObjectId) {
            throw new AppError('Invalid appointment ID format', ERROR_CODES.BAD_REQUEST);
        }
        const appointment = await Appointment.findOne({ _id: appointmentIdObjectId, isDeleted: false })
            .populate('employeeId', 'name email department designation phone')
            .populate('visitorId', 'name email phone photo address idProof')
            .populate('createdBy', 'firstName lastName email')
            .populate('deletedBy', 'firstName lastName email');

        if (!appointment) {
            throw new AppError('Appointment not found', ERROR_CODES.NOT_FOUND);
        }

        return appointment.toObject() as unknown as IAppointmentResponse;
    }

    /**
     * Get all appointments with pagination and filtering (user-specific)
     * @param query - Query parameters including filters
     * @param adminUserId - Optional admin user ID for filtering admin's appointments
     * Filter logic:
     * - If employeeId is in query → filter by employeeId only (employee sees only their appointments)
     * - If adminUserId is provided → filter by admin's employees (admin sees only appointments with their employees)
     */
    static async getAllAppointments(query: IGetAppointmentsQuery = {}, adminUserId?: string): Promise<IAppointmentListResponse> {
        const {
            page = 1,
            limit = 10,
            search = '',
            employeeId = '',
            status = '',
            scheduledDate = '',
            startDate = '',
            endDate = '',
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = query;

        const filter: any = { isDeleted: false };

        // SECURITY FIX: Filter appointments by admin's employees
        // - Admin sees only appointments where employees belong to them (createdBy = adminUserId)
        if (adminUserId) {
            // Get all employees created by this admin
            const adminEmployees = await Employee.find({
                createdBy: adminUserId,
                isDeleted: false
            }).select('_id').lean();

            const adminEmployeeIds = adminEmployees.map((e: any) => e._id.toString());

            if (adminEmployeeIds.length > 0) {
                if (employeeId) {
                    // If a specific employeeId is requested, verify they belong to this admin
                    if (adminEmployeeIds.includes(employeeId.toString())) {
                        filter.employeeId = toObjectId(employeeId);
                    } else {
                        // Employee doesn't belong to this admin, return empty result
                        filter._id = null;
                    }
                } else {
                    // No specific employee requested, show all admin's employees
                    filter.employeeId = { $in: adminEmployeeIds.map(id => toObjectId(id)) };
                }
            } else {
                // Admin has no employees, return empty result
                filter._id = null;
            }
        } else if (employeeId) {
            // Employee case: they only see their own appointments (id already filtered in controller)
            const employeeIdObjectId = toObjectId(employeeId);
            if (employeeIdObjectId) {
                filter.employeeId = employeeIdObjectId;
            }
        }

        if (search) {
            const escapedSearch = escapeRegex(search);
            const searchRegex = { $regex: escapedSearch, $options: 'i' };

            const matchingVisitors = await Visitor.find({
                $or: [
                    { name: searchRegex },
                    { phone: searchRegex },
                    { email: searchRegex }
                ]
            }).select('_id').lean();

            const visitorIds = matchingVisitors.map((v: any) => v._id);

            const matchingEmployees = await Employee.find({
                $or: [
                    { name: searchRegex },
                    { email: searchRegex },
                    { department: searchRegex }
                ]
            }).select('_id').lean();

            const employeeIds = matchingEmployees.map((e: any) => e._id);

            filter.$or = [
                { 'appointmentDetails.purpose': searchRegex },
                { 'appointmentDetails.meetingRoom': searchRegex },
                { 'appointmentDetails.notes': searchRegex }
            ];

            // If it's a valid ObjectId, search by ID directly
            const searchId = toObjectId(search);
            if (searchId) {
                filter.$or.push({ _id: searchId });
            }

            if (visitorIds.length > 0) {
                filter.$or.push({ visitorId: { $in: visitorIds } });
            }

            if (employeeIds.length > 0) {
                filter.$or.push({ employeeId: { $in: employeeIds } });
            }
        }

        if (status) {
            filter.status = status;
        }

        if (scheduledDate) {
            const date = new Date(scheduledDate);
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);

            filter['appointmentDetails.scheduledDate'] = {
                $gte: date,
                $lt: nextDay
            };
        }

        if (startDate && endDate) {
            const start = new Date(startDate);
            const endExclusive = new Date(endDate);
            endExclusive.setDate(endExclusive.getDate() + 1);

            filter['appointmentDetails.scheduledDate'] = {
                $gte: start,
                $lt: endExclusive
            };
        } else if (startDate && !endDate) {
            const start = new Date(startDate);
            const endExclusive = new Date(startDate);
            endExclusive.setDate(endExclusive.getDate() + 1);
            filter['appointmentDetails.scheduledDate'] = {
                $gte: start,
                $lt: endExclusive
            };
        } else if (!startDate && endDate) {
            const endExclusive = new Date(endDate);
            endExclusive.setDate(endExclusive.getDate() + 1);
            filter['appointmentDetails.scheduledDate'] = {
                $lt: endExclusive
            };
        }

        const skip = (page - 1) * limit;

        const sort: any = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const [appointments, totalAppointments] = await Promise.all([
            Appointment.find(filter)
                .populate('employeeId', 'name email department designation phone')
                .populate('visitorId', 'name email phone photo address idProof')
                .populate('createdBy', 'firstName lastName email')
                .populate('deletedBy', 'firstName lastName email')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            Appointment.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(totalAppointments / limit);

        return {
            appointments: appointments as unknown as IAppointmentResponse[],
            pagination: {
                currentPage: page,
                totalPages,
                totalAppointments,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        };
    }

    /**
     * Update appointment
     * @param options.actionBy - 'admin' if admin is updating, 'employee' if employee is updating
     * @param options.sendNotifications - Whether to send socket notifications (only for status changes)
     */
    @Transaction('Failed to update appointment')
    static async updateAppointment(appointmentId: string, updateData: IUpdateAppointmentDTO, options: { session?: any; actionBy?: 'admin' | 'employee'; sendNotifications?: boolean } = {}): Promise<IAppointmentResponse> {
        const { session, actionBy = 'admin', sendNotifications = false } = options;

        // Get old appointment to detect status changes
        const oldAppointment = await Appointment.findById(appointmentId).session(session);
        if (!oldAppointment) {
            throw new AppError('Appointment not found', ERROR_CODES.NOT_FOUND);
        }

        const oldStatus = oldAppointment.status;
        const isStatusChange = updateData.status && updateData.status !== oldStatus;
        const isApprovalOrRejection = isStatusChange && (updateData.status === 'approved' || updateData.status === 'rejected');

        const cleanUpdateData = { ...updateData };
        delete (cleanUpdateData as any).session;

        if (updateData.appointmentDetails?.scheduledDate || updateData.appointmentDetails?.scheduledTime) {
            const scheduledDate = updateData.appointmentDetails?.scheduledDate || oldAppointment.appointmentDetails.scheduledDate;
            const scheduledTime = updateData.appointmentDetails?.scheduledTime || oldAppointment.appointmentDetails.scheduledTime;
            const employeeId = updateData.employeeId || oldAppointment.employeeId.toString();

            const conflictAppointment = await Appointment.findOne({
                _id: { $ne: appointmentId },
                employeeId,
                'appointmentDetails.scheduledDate': scheduledDate,
                'appointmentDetails.scheduledTime': scheduledTime,
                status: { $in: ['scheduled', 'checked_in', 'in_meeting'] },
                isDeleted: false
            }).session(session);

            if (conflictAppointment) {
                throw new AppError('Employee already has an appointment at this time', ERROR_CODES.CONFLICT);
            }
        }

        const appointment = await Appointment.findOneAndUpdate(
            { _id: appointmentId, isDeleted: false },
            cleanUpdateData,
            { new: true, runValidators: true, session }
        )
            .populate('employeeId', 'name email department designation')
            .populate('createdBy', 'firstName lastName email')
            .populate('deletedBy', 'firstName lastName email');

        if (!appointment) {
            throw new AppError('Appointment not found', ERROR_CODES.NOT_FOUND);
        }

        // If status changed to approved/rejected, send notifications
        if (isApprovalOrRejection && sendNotifications) {
            // Mark approval link as used (expired) when status changes via dashboard
            try {
                await ApprovalLink.updateOne(
                    { appointmentId: appointment._id },
                    { isUsed: true }
                ).session(session);
            } catch (error) {
                console.warn('Failed to mark approval link as used:', error);
                // Don't throw - this is not critical
            }

            // Get user ID who created the appointment
            let userId: string | null = null;
            if (appointment.createdBy) {
                if (typeof appointment.createdBy === 'string') {
                    userId = appointment.createdBy;
                } else if (typeof appointment.createdBy === 'object' && appointment.createdBy !== null) {
                    userId = (appointment.createdBy as any)._id?.toString() || (appointment.createdBy as any).toString();
                }
            }

            if (userId) {
                // Re-populate with full details for socket emission
                const populatedAppointment = await Appointment.findById(appointment._id)
                    .populate('employeeId', 'name email phone department')
                    .populate('visitorId', 'name email phone address idProof photo')
                    .session(session);

                if (populatedAppointment) {
                    const appointmentData = {
                        appointmentId: (appointment._id as any).toString(),
                        status: appointment.status,
                        updatedAt: new Date(),
                        appointment: populatedAppointment
                    };

                    await this.sendSocketNotificationToAdminAndEmployee(
                        appointment,
                        populatedAppointment,
                        userId,
                        'statusChange',
                        appointmentData,
                        sendNotifications,
                        actionBy
                    );
                }
            }
        }

        return appointment.toObject() as unknown as IAppointmentResponse;
    }

    /**
     * Soft delete appointment
     */
    @Transaction('Failed to delete appointment')
    static async deleteAppointment(appointmentId: string, deletedBy: string, options: { session?: any } = {}): Promise<void> {
        const { session } = options;

        const appointment = await Appointment.findOne({ _id: appointmentId, isDeleted: false }).session(session);
        if (!appointment) {
            throw new AppError('Appointment not found', ERROR_CODES.NOT_FOUND);
        }

        await (appointment as any).softDelete(deletedBy);
    }

    /**
     * Check in appointment
     */
    @Transaction('Failed to check in appointment')
    static async checkInAppointment(request: ICheckInRequest, options: { session?: any } = {}): Promise<IAppointmentResponse> {
        const { session } = options;
        const { appointmentId, badgeNumber, securityNotes } = request;

        const appointmentIdObjectId = toObjectId(appointmentId);
        if (!appointmentIdObjectId) {
            throw new AppError('Invalid appointment ID format', ERROR_CODES.BAD_REQUEST);
        }
        const appointment = await Appointment.findOne({ _id: appointmentIdObjectId, isDeleted: false }).session(session);
        if (!appointment) {
            throw new AppError('Appointment not found', ERROR_CODES.NOT_FOUND);
        }

        if (appointment.status !== 'pending') {
            throw new AppError('Appointment is not in pending status', ERROR_CODES.BAD_REQUEST);
        }

        appointment.status = 'approved';
        appointment.checkInTime = new Date();

        if (badgeNumber) {
            appointment.securityDetails.badgeIssued = true;
            appointment.securityDetails.badgeNumber = badgeNumber;
        }

        if (securityNotes) {
            appointment.securityDetails.securityNotes = securityNotes;
        }

        await appointment.save({ session });

        // 🔔 Emit background socket event for data refresh (no notification popup)
        const userId = (appointment.createdBy as any)?.toString() || appointment.createdBy;
        if (userId) {
            const populatedAppointment = await Appointment.findById(appointment._id as any)
                .populate('employeeId', 'name email phone department')
                .populate('visitorId', 'name email phone address idProof photo')
                .session(session)
                .lean();

            const appointmentData = {
                appointmentId: (appointment._id as any).toString(),
                status: appointment.status,
                updatedAt: new Date(),
                appointment: populatedAppointment
            };

            // Send socket notification to both admin and employee (background refresh, no popup)
            await this.sendSocketNotificationToAdminAndEmployee(
                appointment,
                populatedAppointment,
                userId,
                'statusChange',
                appointmentData,
                false // No notification popup for check-in
            );
        }

        return appointment.toObject() as unknown as IAppointmentResponse;
    }

    /**
     * Check out appointment
     * @param options.actionBy - 'admin' if admin/security is completing, 'employee' if employee is completing
     */
    @Transaction('Failed to check out appointment')
    static async checkOutAppointment(request: ICheckOutRequest, options: { session?: any; actionBy?: 'admin' | 'employee'; sendNotifications?: boolean } = {}): Promise<IAppointmentResponse> {
        const { session, actionBy = 'admin', sendNotifications = false } = options;
        const { appointmentId, notes } = request;

        const appointmentIdObjectId = toObjectId(appointmentId);
        if (!appointmentIdObjectId) {
            throw new AppError('Invalid appointment ID format', ERROR_CODES.BAD_REQUEST);
        }
        const appointment = await Appointment.findOne({ _id: appointmentIdObjectId, isDeleted: false }).session(session);
        if (!appointment) {
            throw new AppError('Appointment not found', ERROR_CODES.NOT_FOUND);
        }

        appointment.status = 'completed';
        appointment.checkOutTime = new Date();

        if (appointment.checkInTime) {
            appointment.actualDuration = Math.floor(
                (appointment.checkOutTime.getTime() - appointment.checkInTime.getTime()) / (1000 * 60)
            );
        }

        if (notes) {
            appointment.appointmentDetails.notes = notes;
        }

        await appointment.save({ session });

        // 🔔 Send socket notification for live updates
        // If employee completes → notify admin
        // If admin/security completes → notify employee (optional, based on sendNotifications)
        const userId = (appointment.createdBy as any)?.toString() || appointment.createdBy;
        if (userId) {
            const populatedAppointment = await Appointment.findById(appointment._id as any)
                .populate('employeeId', 'name email phone department')
                .populate('visitorId', 'name email phone address idProof photo')
                .session(session)
                .lean();

            const appointmentData = {
                appointmentId: (appointment._id as any).toString(),
                status: 'completed',
                updatedAt: new Date(),
                appointment: populatedAppointment
            };

            // Send socket notification
            // If employee completes → admin gets notification
            // If admin completes → employee gets notification (if sendNotifications is true)
            await this.sendSocketNotificationToAdminAndEmployee(
                appointment,
                populatedAppointment,
                userId,
                'statusChange',
                appointmentData,
                sendNotifications, // Show notification popup if requested
                actionBy
            );
        }

        return appointment.toObject() as unknown as IAppointmentResponse;
    }









    /**
     * Cancel appointment
     */
    @Transaction('Failed to cancel appointment')
    static async cancelAppointment(appointmentId: string, options: { session?: any } = {}): Promise<IAppointmentResponse> {
        const { session } = options;

        const appointment = await Appointment.findOne({ _id: appointmentId, isDeleted: false }).session(session);
        if (!appointment) {
            throw new AppError('Appointment not found', ERROR_CODES.NOT_FOUND);
        }

        if (appointment.status === 'completed') {
            throw new AppError('Cannot cancel a completed appointment', ERROR_CODES.BAD_REQUEST);
        }

        if (appointment.status === 'rejected') {
            throw new AppError('Appointment is already cancelled', ERROR_CODES.BAD_REQUEST);
        }

        appointment.status = 'rejected';
        await appointment.save({ session });

        return appointment.toObject() as unknown as IAppointmentResponse;
    }

    /**
     * Approve appointment
     * @param options.actionBy - 'admin' if admin is approving, 'employee' if employee is approving
     */
    static async approveAppointment(appointmentId: string, options: { session?: any; sendNotifications?: boolean; actionBy?: 'admin' | 'employee' } = {}): Promise<IAppointmentResponse> {
        const { session, sendNotifications = false, actionBy = 'admin' } = options;

        const appointment = await Appointment.findOne({ _id: appointmentId, isDeleted: false })
            .populate('employeeId', 'name email')
            .populate('visitorId', 'name email phone photo')
            .session(session);

        if (!appointment) {
            throw new AppError('Appointment not found', ERROR_CODES.NOT_FOUND);
        }

        if (appointment.status !== 'pending') {
            throw new AppError('Only pending appointments can be approved', ERROR_CODES.BAD_REQUEST);
        }

        appointment.status = 'approved';
        await appointment.save({ session });

        // Re-populate after save to ensure populated fields are available for socket emission
        const populatedAppointment = await Appointment.findById(appointment._id)
            .populate('employeeId', 'name email phone department')
            .populate('visitorId', 'name email phone address idProof photo')
            .session(session);

        // Get user ID who created the appointment (for settings check)
        // Handle both ObjectId and string formats
        let userId: string | null = null;
        if (appointment.createdBy) {
            if (typeof appointment.createdBy === 'string') {
                userId = appointment.createdBy;
            } else if (typeof appointment.createdBy === 'object' && appointment.createdBy !== null) {
                // Handle ObjectId or populated object
                userId = (appointment.createdBy as any)._id?.toString() || (appointment.createdBy as any).toString();
            }
        }

        // Check settings for notifications
        const emailEnabled = userId ? await SettingsService.isEmailEnabled(userId) : true;
        const whatsappEnabled = userId ? await SettingsService.isWhatsAppEnabled(userId) : true;
        const smsEnabled = userId ? await SettingsService.isSmsEnabled(userId) : false;

        // Get company name from user (createdBy) for email fromName
        let companyName: string | undefined;
        if (userId) {
            try {
                const user = await User.findById(userId).select('companyName').lean();
                companyName = user?.companyName;
            } catch (error) {
                // If user not found or error, companyName will remain undefined
                console.warn('Failed to fetch company name for email fromName:', error);
            }
        }

        // Send email notification to visitor (if enabled)
        try {
            if (emailEnabled) {
                await EmailService.sendAppointmentApprovalEmail(
                    (appointment.visitorId as any).email,
                    (appointment.visitorId as any).name,
                    (appointment.employeeId as any).name,
                    appointment.appointmentDetails.scheduledDate,
                    appointment.appointmentDetails.scheduledTime,
                    companyName
                );
            }
        } catch {
            // Email sending failed, continue
        }

        // Send WhatsApp notification to visitor (if enabled)
        try {
            if (whatsappEnabled) {
                const visitorPhone = (appointment.visitorId as any).phone;
                if (visitorPhone) {
                    await WhatsAppService.sendAppointmentStatusUpdate(
                        visitorPhone,
                        (appointment.visitorId as any).name,
                        (appointment.employeeId as any).name,
                        appointment.appointmentDetails.scheduledDate,
                        appointment.appointmentDetails.scheduledTime,
                        'approved'
                    );
                }
            }
        } catch {
            // WhatsApp sending failed, continue
        }

        if (smsEnabled) {
            // NOTE: SMS service integration pending
            // Will send appointment approval notification via SMS provider
        }

        // try {
        //     await EmailService.sendEmployeeAppointmentApprovalEmail(
        //         (appointment.employeeId as any).email,
        //         (appointment.employeeId as any).name,
        //         (appointment.visitorId as any).name,
        //         appointment.appointmentDetails.scheduledDate,
        //         appointment.appointmentDetails.scheduledTime,
        //         companyName
        //     );
        // } catch {
        //     // Email sending failed, continue
        // }

        // Send socket notification to both admin and employee
        if (populatedAppointment && userId) {
            const appointmentData = {
                appointmentId: (appointment._id as any).toString(),
                status: 'approved',
                updatedAt: new Date(),
                appointment: populatedAppointment
            };

            await this.sendSocketNotificationToAdminAndEmployee(
                appointment,
                populatedAppointment,
                userId,
                'statusChange',
                appointmentData,
                sendNotifications,
                actionBy
            );
        }

        return appointment.toObject() as unknown as IAppointmentResponse;
    }

    /**
     * Reject appointment
     * @param options.actionBy - 'admin' if admin is rejecting, 'employee' if employee is rejecting
     */
    static async rejectAppointment(appointmentId: string, options: { session?: any; sendNotifications?: boolean; actionBy?: 'admin' | 'employee' } = {}): Promise<IAppointmentResponse> {
        const { session, sendNotifications = false, actionBy = 'admin' } = options;

        const appointment = await Appointment.findOne({ _id: appointmentId, isDeleted: false })
            .populate('employeeId', 'name email')
            .populate('visitorId', 'name email phone photo')
            .session(session);

        if (!appointment) {
            throw new AppError('Appointment not found', ERROR_CODES.NOT_FOUND);
        }

        if (appointment.status !== 'pending') {
            throw new AppError('Only pending appointments can be rejected', ERROR_CODES.BAD_REQUEST);
        }

        appointment.status = 'rejected';
        await appointment.save({ session });

        // Get user ID who created the appointment (for settings check)
        // Handle both ObjectId and string formats
        let userId: string | null = null;
        if (appointment.createdBy) {
            if (typeof appointment.createdBy === 'string') {
                userId = appointment.createdBy;
            } else if (typeof appointment.createdBy === 'object' && appointment.createdBy !== null) {
                // Handle ObjectId or populated object
                userId = (appointment.createdBy as any)._id?.toString() || (appointment.createdBy as any).toString();
            }
        }

        // Re-populate after save to ensure populated fields are available for socket emission
        const populatedAppointment = await Appointment.findById(appointment._id)
            .populate('employeeId', 'name email phone department')
            .populate('visitorId', 'name email phone address idProof photo')
            .session(session);

        // Check settings for notifications
        const emailEnabled = userId ? await SettingsService.isEmailEnabled(userId) : true;
        const whatsappEnabled = userId ? await SettingsService.isWhatsAppEnabled(userId) : true;
        const smsEnabled = userId ? await SettingsService.isSmsEnabled(userId) : false;

        // Get company name from user (createdBy) for email fromName
        let companyName: string | undefined;
        if (userId) {
            try {
                const user = await User.findById(userId).select('companyName').lean();
                companyName = user?.companyName;
            } catch (error) {
                // If user not found or error, companyName will remain undefined
                console.warn('Failed to fetch company name for email fromName:', error);
            }
        }

        // Send email notification to visitor (if enabled)
        try {
            if (emailEnabled) {
                await EmailService.sendAppointmentRejectionEmail(
                    (appointment.visitorId as any).email,
                    (appointment.visitorId as any).name,
                    (appointment.employeeId as any).name,
                    appointment.appointmentDetails.scheduledDate,
                    appointment.appointmentDetails.scheduledTime,
                    companyName
                );
            }
        } catch {
            // Email sending failed, continue
        }

        // Send WhatsApp notification to visitor (if enabled)
        try {
            if (whatsappEnabled) {
                const visitorPhone = (appointment.visitorId as any).phone;
                if (visitorPhone) {
                    await WhatsAppService.sendAppointmentStatusUpdate(
                        visitorPhone,
                        (appointment.visitorId as any).name,
                        (appointment.employeeId as any).name,
                        appointment.appointmentDetails.scheduledDate,
                        appointment.appointmentDetails.scheduledTime,
                        'rejected'
                    );
                }
            }
        } catch {
            // WhatsApp sending failed, continue
        }

        if (smsEnabled) {
            // NOTE: SMS service integration pending
            // Will send appointment rejection notification via SMS provider
        }

        // try {
        //     await EmailService.sendEmployeeAppointmentRejectionEmail(
        //         (appointment.employeeId as any).email,
        //         (appointment.employeeId as any).name,
        //         (appointment.visitorId as any).name,
        //         appointment.appointmentDetails.scheduledDate,
        //         appointment.appointmentDetails.scheduledTime,
        //         companyName
        //     );
        // } catch {
        //     // Email sending failed, continue
        // }

        // Send socket notification to both admin and employee
        if (populatedAppointment && userId) {
            const appointmentData = {
                appointmentId: (appointment._id as any).toString(),
                status: 'rejected',
                updatedAt: new Date(),
                appointment: populatedAppointment
            };

            await this.sendSocketNotificationToAdminAndEmployee(
                appointment,
                populatedAppointment,
                userId,
                'statusChange',
                appointmentData,
                sendNotifications,
                actionBy
            );
        }

        return appointment.toObject() as unknown as IAppointmentResponse;
    }

    /**
     * Get dashboard statistics (unified for admin and employee)
     * @param employeeId - Optional. If provided, filters by employee (for employees)
     * @param adminUserId - Optional. If provided, filters by admin's employees (for admin)
     * @returns Dashboard statistics
     */
    static async getDashboardStats(employeeId?: string, adminUserId?: string): Promise<IDashboardStats> {
        // Get today's date range
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // Get future date for upcoming appointments
        const now = new Date();

        // Build match filter
        const matchFilter: any = { isDeleted: false };

        // If employeeId is provided, filter by employee (for employees)
        // If adminUserId is provided, filter by admin's employees (for admin)
        if (employeeId) {
            const employeeIdObjectId = toObjectId(employeeId);
            if (!employeeIdObjectId) {
                throw new AppError('Invalid employee ID format', ERROR_CODES.BAD_REQUEST);
            }
            matchFilter.employeeId = employeeIdObjectId;
        } else if (adminUserId) {
            // SECURITY FIX: Filter stats by admin's employees
            const adminEmployees = await Employee.find({
                createdBy: adminUserId,
                isDeleted: false
            }).select('_id').lean();

            const adminEmployeeIds = adminEmployees.map((e: any) => e._id);

            if (adminEmployeeIds.length > 0) {
                matchFilter.employeeId = { $in: adminEmployeeIds };
            } else {
                // Admin has no employees, return zero stats
                matchFilter._id = null; // This will return no results
            }
        }

        // OPTIMIZED: Use single aggregation pipeline instead of 7 separate countDocuments
        // This is 10-50x faster on large datasets (10+ lakhs records)
        const statsResult = await Appointment.aggregate([
            {
                $match: matchFilter
            },
            {
                $facet: {
                    total: [{ $count: 'count' }],
                    pending: [
                        { $match: { status: 'pending' } },
                        { $count: 'count' }
                    ],
                    approved: [
                        { $match: { status: 'approved' } },
                        { $count: 'count' }
                    ],
                    rejected: [
                        { $match: { status: 'rejected' } },
                        { $count: 'count' }
                    ],
                    completed: [
                        { $match: { status: 'completed' } },
                        { $count: 'count' }
                    ],
                    upcoming: [
                        {
                            $match: {
                                status: 'approved',
                                'appointmentDetails.scheduledDate': { $gte: now }
                            }
                        },
                        { $count: 'count' }
                    ],
                    today: [
                        {
                            $match: {
                                'appointmentDetails.scheduledDate': {
                                    $gte: todayStart,
                                    $lte: todayEnd
                                }
                            }
                        },
                        { $count: 'count' }
                    ]
                }
            }
        ]);

        // Extract counts from aggregation result
        const stats = statsResult[0];
        const total = stats.total[0]?.count || 0;
        const pending = stats.pending[0]?.count || 0;
        const approved = stats.approved[0]?.count || 0;
        const rejected = stats.rejected[0]?.count || 0;
        const completed = stats.completed[0]?.count || 0;
        const upcoming = stats.upcoming[0]?.count || 0;
        const today = stats.today[0]?.count || 0;

        return {
            totalAppointments: total,
            pendingAppointments: pending,
            approvedAppointments: approved,
            rejectedAppointments: rejected,
            completedAppointments: completed,
            upcomingAppointments: upcoming,
            todayAppointments: today
        };
    }
}
