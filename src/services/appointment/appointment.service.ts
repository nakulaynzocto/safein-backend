import { Appointment } from '../../models/appointment/appointment.model';
import { Employee } from '../../models/employee/employee.model';
import { Visitor } from '../../models/visitor/visitor.model';
import { EmailService } from '../email/email.service';
import { ApprovalLinkService } from '../approvalLink/approvalLink.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { SettingsService } from '../settings/settings.service';
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

export class AppointmentService {
    @Transaction('Failed to create appointment')
    static async createAppointment(appointmentData: ICreateAppointmentDTO, createdBy: string, options: { session?: any; sendNotifications?: boolean } = {}): Promise<IAppointmentResponse> {
        const { session, sendNotifications = false } = options;

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
            .populate('visitorId', 'name email phone company designation address idProof photo')
            .session(session);

        let approvalLink = null;
        try {
            const appointmentId = (appointment._id as any).toString();
            approvalLink = await ApprovalLinkService.createApprovalLink(appointmentId);
        } catch {
            // Approval link creation failed, continue without it
        }

        const emailEnabled = await SettingsService.isEmailEnabled(createdBy);
        const whatsappEnabled = await SettingsService.isWhatsAppEnabled(createdBy);
        const smsEnabled = await SettingsService.isSmsEnabled(createdBy);

        // 📧 Handle Email Notifications (Always send if enabled in settings)
        try {
            if (populatedAppointment && emailEnabled && approvalLink?.token) {
                await EmailService.sendNewAppointmentRequestEmail(
                    (populatedAppointment.employeeId as any).email,
                    (populatedAppointment.employeeId as any).name,
                    populatedAppointment.visitorId as any,
                    populatedAppointment.appointmentDetails.scheduledDate,
                    populatedAppointment.appointmentDetails.scheduledTime,
                    populatedAppointment.appointmentDetails.purpose,
                    approvalLink.token
                );
                appointment.notifications.emailSent = true;
            } else {
                appointment.notifications.emailSent = false;
            }
        } catch (error) {
            appointment.notifications.emailSent = false;
        }

        // 📧 Send confirmation email to visitor (if enabled in settings)
        try {
            if (populatedAppointment && emailEnabled && (populatedAppointment.visitorId as any)?.email) {
                await EmailService.sendAppointmentConfirmationEmail(
                    (populatedAppointment.visitorId as any).email,
                    (populatedAppointment.visitorId as any).name,
                    (populatedAppointment.employeeId as any).name,
                    populatedAppointment.appointmentDetails.scheduledDate,
                    populatedAppointment.appointmentDetails.scheduledTime,
                    populatedAppointment.appointmentDetails.purpose
                );
            }
        } catch (error) {
            // Visitor confirmation email failed, continue
        }

        // 📱 Send WhatsApp notification to employee (if enabled in settings)
        try {
            if (populatedAppointment && approvalLink?.link && whatsappEnabled) {
                const employeePhone = (populatedAppointment.employeeId as any).phone;
                const employeeName = (populatedAppointment.employeeId as any).name;

                if (employeePhone) {
                    const whatsappSent = await WhatsAppService.sendAppointmentNotification(
                        employeePhone,
                        employeeName,
                        {
                            name: (populatedAppointment.visitorId as any).name,
                            email: (populatedAppointment.visitorId as any).email,
                            phone: (populatedAppointment.visitorId as any).phone,
                            company: (populatedAppointment.visitorId as any).company,
                            _id: (populatedAppointment.visitorId as any)._id?.toString()
                        },
                        populatedAppointment.appointmentDetails.scheduledDate,
                        populatedAppointment.appointmentDetails.scheduledTime,
                        populatedAppointment.appointmentDetails.purpose,
                        approvalLink.link,
                        (populatedAppointment._id as any).toString()
                    );

                    // Mark WhatsApp as sent only if notification is enabled and sent successfully
                    appointment.notifications.whatsappSent = whatsappSent;
                } else {
                    appointment.notifications.whatsappSent = false;
                }
            } else {
                appointment.notifications.whatsappSent = false;
            }
        } catch (error) {
            appointment.notifications.whatsappSent = false;
        }

        appointment.notifications.smsSent = false;
        if (smsEnabled) {
            // TODO: Implement SMS service when available
        }

        await appointment.save({ session });

        try {
            if (sendNotifications && populatedAppointment) {
                const appointmentObj = populatedAppointment.toObject ? populatedAppointment.toObject({ virtuals: true }) : populatedAppointment;
                const serializedAppointment = JSON.parse(JSON.stringify(appointmentObj));
                const userId = (createdBy as any)?.toString() || createdBy;

                if (userId) {
                    socketService.emitAppointmentCreated(userId, {
                        appointmentId: (appointment._id as any).toString(),
                        appointment: serializedAppointment,
                        status: appointment.status,
                        createdAt: appointment.createdAt,
                    }, sendNotifications);
                }
            }
        } catch {
            // Socket notification failed, continue
        }

        const appointmentResponse = appointment.toObject() as unknown as IAppointmentResponse;
        return {
            ...appointmentResponse,
            approvalLink: approvalLink?.link || null
        } as IAppointmentResponse;
    }

    static async getAppointmentById(appointmentId: string): Promise<IAppointmentResponse> {
        const appointment = await Appointment.findOne({ _id: appointmentId, isDeleted: false })
            .populate('employeeId', 'name email department designation phone')
            .populate('visitorId', 'name email phone company purposeOfVisit photo designation address idProof')
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
            .populate('visitorId', 'name email phone company purposeOfVisit photo designation address idProof')
            .populate('createdBy', 'firstName lastName email')
            .populate('deletedBy', 'firstName lastName email');

        if (!appointment) {
            throw new AppError('Appointment not found', ERROR_CODES.NOT_FOUND);
        }

        return appointment.toObject() as unknown as IAppointmentResponse;
    }

    /**
     * Get all appointments with pagination and filtering (user-specific)
     */
    static async getAllAppointments(query: IGetAppointmentsQuery = {}, userId?: string): Promise<IAppointmentListResponse> {
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

        if (userId) {
            filter.createdBy = userId;
        }

        if (search) {
            const escapedSearch = escapeRegex(search);
            const searchRegex = { $regex: escapedSearch, $options: 'i' };

            const matchingVisitors = await Visitor.find({
                $or: [
                    { name: searchRegex },
                    { phone: searchRegex },
                    { email: searchRegex },
                    { company: searchRegex }
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

        if (employeeId) {
            filter.employeeId = employeeId;
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
                .populate('visitorId', 'name email phone company purposeOfVisit photo designation address idProof')
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
     */
    @Transaction('Failed to update appointment')
    static async updateAppointment(appointmentId: string, updateData: IUpdateAppointmentDTO, options: { session?: any } = {}): Promise<IAppointmentResponse> {
        const { session } = options;

        const cleanUpdateData = { ...updateData };
        delete (cleanUpdateData as any).session;

        if (updateData.appointmentDetails?.scheduledDate || updateData.appointmentDetails?.scheduledTime) {
            const appointment = await Appointment.findById(appointmentId).session(session);
            if (!appointment) {
                throw new AppError('Appointment not found', ERROR_CODES.NOT_FOUND);
            }

            const scheduledDate = updateData.appointmentDetails?.scheduledDate || appointment.appointmentDetails.scheduledDate;
            const scheduledTime = updateData.appointmentDetails?.scheduledTime || appointment.appointmentDetails.scheduledTime;
            const employeeId = updateData.employeeId || appointment.employeeId.toString();

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
                .populate('visitorId', 'name email phone company designation address idProof photo')
                .session(session)
                .lean();

            socketService.emitAppointmentStatusChange(userId, {
                appointmentId: (appointment._id as any).toString(),
                status: appointment.status,
                updatedAt: new Date(),
                appointment: populatedAppointment
            }, false);
        }

        return appointment.toObject() as unknown as IAppointmentResponse;
    }

    /**
     * Check out appointment
     */
    @Transaction('Failed to check out appointment')
    static async checkOutAppointment(request: ICheckOutRequest, options: { session?: any } = {}): Promise<IAppointmentResponse> {
        const { session } = options;
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

        // 🔔 Emit background socket event for data refresh (no notification popup)
        const userId = (appointment.createdBy as any)?.toString() || appointment.createdBy;
        if (userId) {
            const populatedAppointment = await Appointment.findById(appointment._id as any)
                .populate('employeeId', 'name email phone department')
                .populate('visitorId', 'name email phone company designation address idProof photo')
                .session(session)
                .lean();

            socketService.emitAppointmentStatusChange(userId, {
                appointmentId: (appointment._id as any).toString(),
                status: 'completed',
                updatedAt: new Date(),
                appointment: populatedAppointment
            }, false);
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
     */
    static async approveAppointment(appointmentId: string, options: { session?: any; sendNotifications?: boolean } = {}): Promise<IAppointmentResponse> {
        const { session, sendNotifications = false } = options;

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
            .populate('visitorId', 'name email phone company designation address idProof photo')
            .session(session);

        // Get user ID who created the appointment (for settings check)
        const userId = (appointment.createdBy as any)?.toString() || appointment.createdBy;

        // Check settings for notifications
        const emailEnabled = userId ? await SettingsService.isEmailEnabled(userId) : true;
        const whatsappEnabled = userId ? await SettingsService.isWhatsAppEnabled(userId) : true;
        const smsEnabled = userId ? await SettingsService.isSmsEnabled(userId) : false;

        // Send email notification to visitor (if enabled)
        try {
            if (emailEnabled) {
                await EmailService.sendAppointmentApprovalEmail(
                    (appointment.visitorId as any).email,
                    (appointment.visitorId as any).name,
                    (appointment.employeeId as any).name,
                    appointment.appointmentDetails.scheduledDate,
                    appointment.appointmentDetails.scheduledTime
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
            // TODO: Implement SMS service when available
        }

        try {
            await EmailService.sendEmployeeAppointmentApprovalEmail(
                (appointment.employeeId as any).email,
                (appointment.employeeId as any).name,
                (appointment.visitorId as any).name,
                appointment.appointmentDetails.scheduledDate,
                appointment.appointmentDetails.scheduledTime
            );
        } catch {
            // Email sending failed, continue
        }

        if (populatedAppointment && userId) {
            socketService.emitAppointmentStatusChange(userId, {
                appointmentId: (appointment._id as any).toString(),
                status: 'approved',
                updatedAt: new Date(),
                appointment: populatedAppointment
            }, sendNotifications);
        }

        return appointment.toObject() as unknown as IAppointmentResponse;
    }

    static async rejectAppointment(appointmentId: string, options: { session?: any; sendNotifications?: boolean } = {}): Promise<IAppointmentResponse> {
        const { session, sendNotifications = false } = options;

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
        const userId = (appointment.createdBy as any)?.toString() || appointment.createdBy;

        // Re-populate after save to ensure populated fields are available for socket emission
        const populatedAppointment = await Appointment.findById(appointment._id)
            .populate('employeeId', 'name email phone department')
            .populate('visitorId', 'name email phone company designation address idProof photo')
            .session(session);

        // Check settings for notifications
        const emailEnabled = userId ? await SettingsService.isEmailEnabled(userId) : true;
        const whatsappEnabled = userId ? await SettingsService.isWhatsAppEnabled(userId) : true;
        const smsEnabled = userId ? await SettingsService.isSmsEnabled(userId) : false;

        // Send email notification to visitor (if enabled)
        try {
            if (emailEnabled) {
                await EmailService.sendAppointmentRejectionEmail(
                    (appointment.visitorId as any).email,
                    (appointment.visitorId as any).name,
                    (appointment.employeeId as any).name,
                    appointment.appointmentDetails.scheduledDate,
                    appointment.appointmentDetails.scheduledTime
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
            // TODO: Implement SMS service when available
        }

        try {
            await EmailService.sendEmployeeAppointmentRejectionEmail(
                (appointment.employeeId as any).email,
                (appointment.employeeId as any).name,
                (appointment.visitorId as any).name,
                appointment.appointmentDetails.scheduledDate,
                appointment.appointmentDetails.scheduledTime
            );
        } catch {
            // Email sending failed, continue
        }

        if (populatedAppointment && userId) {
            socketService.emitAppointmentStatusChange(userId, {
                appointmentId: (appointment._id as any).toString(),
                status: 'rejected',
                updatedAt: new Date(),
                appointment: populatedAppointment
            }, sendNotifications);
        }

        return appointment.toObject() as unknown as IAppointmentResponse;
    }
}
