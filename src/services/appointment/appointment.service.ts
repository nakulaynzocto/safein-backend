import { Appointment } from '../../models/appointment/appointment.model';
import { Employee } from '../../models/employee/employee.model';
import { Visitor } from '../../models/visitor/visitor.model';
import { EmailService } from '../email/email.service';
import { ApprovalLinkService } from '../approvalLink/approvalLink.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { SettingsService } from '../settings/settings.service';
import {
    ICreateAppointmentDTO,
    IUpdateAppointmentDTO,
    IAppointmentResponse,
    IGetAppointmentsQuery,
    IAppointmentListResponse,
    ICheckInRequest,
    ICheckOutRequest,
    IAppointmentStats,
    IBulkUpdateAppointmentsDTO,
    IAppointmentCalendarResponse,
    IAppointmentSearchRequest
} from '../../types/appointment/appointment.types';
import { ERROR_MESSAGES, ERROR_CODES } from '../../utils/constants';
import { AppError } from '../../middlewares/errorHandler';
import { Transaction } from '../../decorators';

export class AppointmentService {
    /**
     * Create a new appointment
     */
    @Transaction('Failed to create appointment')
    static async createAppointment(appointmentData: ICreateAppointmentDTO, createdBy: string, options: { session?: any } = {}): Promise<IAppointmentResponse> {
        const { session } = options;

        const employee = await Employee.findOne({ _id: appointmentData.employeeId, isDeleted: false }).session(session);
        if (!employee) {
            throw new AppError(ERROR_MESSAGES.EMPLOYEE_NOT_FOUND, ERROR_CODES.NOT_FOUND);
        }
        if (employee.status === 'Inactive') {
            throw new AppError('Employee is inactive. Please select an active employee.', ERROR_CODES.BAD_REQUEST);
        }

        // Prevent double booking for the same employee, date, and time while an earlier appointment is pending/approved
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
            .populate('visitorId', 'name email phone company designation address idProof photo visitorId')
            .session(session);

        // Generate approval link for the appointment
        let approvalLink = null;
        try {
            const appointmentId = (appointment._id as any).toString();
            approvalLink = await ApprovalLinkService.createApprovalLink(appointmentId);
        } catch (error) {
            console.error('Failed to create approval link:', error);
        }

        // Check settings for notifications
        const emailEnabled = await SettingsService.isEmailEnabled(createdBy);
        const whatsappEnabled = await SettingsService.isWhatsAppEnabled(createdBy);
        const smsEnabled = await SettingsService.isSmsEnabled(createdBy);

        // Send email notification to employee (if enabled and approval link exists)
        try {
            if (populatedAppointment && emailEnabled && approvalLink?.token) {
                await EmailService.sendNewAppointmentRequestEmail(
                    (populatedAppointment.employeeId as any).email,
                    (populatedAppointment.employeeId as any).name,
                    populatedAppointment.visitorId as any,
                    populatedAppointment.appointmentDetails.scheduledDate,
                    populatedAppointment.appointmentDetails.scheduledTime,
                    populatedAppointment.appointmentDetails.purpose,
                    approvalLink.token // Pass the approval token instead of appointment ID
                );
                
                // Mark email as sent only if notification is enabled and sent successfully
                appointment.notifications.emailSent = true;
            } else {
                // Mark as not sent if disabled or no approval link
                appointment.notifications.emailSent = false;
            }
        } catch (error) {
            console.error('Failed to send new appointment request email to employee:', error);
            appointment.notifications.emailSent = false;
        }

        // Send WhatsApp notification to employee (if enabled)
        try {
            if (populatedAppointment && approvalLink?.link && whatsappEnabled) {
                const employeePhone = (populatedAppointment.employeeId as any).phone;
                const employeeName = (populatedAppointment.employeeId as any).name;
                
                if (employeePhone) {
                    console.log(`Sending WhatsApp notification to employee: ${employeeName} (${employeePhone})`);
                    
                    const whatsappSent = await WhatsAppService.sendAppointmentNotification(
                        employeePhone,
                        employeeName,
                        {
                            name: (populatedAppointment.visitorId as any).name,
                            email: (populatedAppointment.visitorId as any).email,
                            phone: (populatedAppointment.visitorId as any).phone,
                            company: (populatedAppointment.visitorId as any).company,
                            visitorId: (populatedAppointment.visitorId as any).visitorId
                        },
                        populatedAppointment.appointmentDetails.scheduledDate,
                        populatedAppointment.appointmentDetails.scheduledTime,
                        populatedAppointment.appointmentDetails.purpose,
                        approvalLink.link,
                        (populatedAppointment._id as any).toString()
                    );
                    
                    // Mark WhatsApp as sent only if notification is enabled and sent successfully
                    appointment.notifications.whatsappSent = whatsappSent;
                    
                    if (whatsappSent) {
                        console.log(`WhatsApp notification sent successfully to employee: ${employeeName}`);
                    } else {
                        console.warn(`Failed to send WhatsApp notification to employee: ${employeeName}. Check WhatsApp Cloud API configuration.`);
                    }
                } else {
                    console.warn(`Employee ${employeeName} does not have a phone number. WhatsApp notification not sent.`);
                    appointment.notifications.whatsappSent = false;
                }
            } else {
                if (!whatsappEnabled) {
                    console.log('WhatsApp notifications are disabled in settings');
                } else if (!approvalLink?.link) {
                    console.warn('Approval link not generated. WhatsApp notification not sent.');
                }
                // Mark as not sent if disabled
                appointment.notifications.whatsappSent = false;
            }
        } catch (error: any) {
            console.error('Failed to send WhatsApp notification to employee:', error?.message || error);
            appointment.notifications.whatsappSent = false;
        }

        // SMS notifications (if SMS service is implemented)
        // For now, mark as not sent if disabled
        appointment.notifications.smsSent = false;
        if (smsEnabled) {
            // TODO: Implement SMS service when available
            // const smsSent = await SmsService.sendAppointmentNotification(...);
            // appointment.notifications.smsSent = smsSent;
        }

        // Save notification status
        await appointment.save({ session });

        const appointmentResponse = appointment.toObject() as unknown as IAppointmentResponse;
        
        // Add approval link to response
        return {
            ...appointmentResponse,
            approvalLink: approvalLink?.link || null
        } as IAppointmentResponse;
    }

    /**
     * Get appointment by ID
     */
    static async getAppointmentById(appointmentId: string): Promise<IAppointmentResponse> {
        const appointment = await Appointment.findOne({ _id: appointmentId, isDeleted: false })
            .populate('employeeId', 'name email department designation phone')
            .populate('visitorId', 'name email phone company purposeOfVisit photo visitorId designation address idProof')
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
        const appointment = await Appointment.findOne({ appointmentId, isDeleted: false })
            .populate('employeeId', 'name email department designation phone')
            .populate('visitorId', 'name email phone company purposeOfVisit photo visitorId designation address idProof')
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
            const searchRegex = { $regex: search, $options: 'i' };
            
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
                { appointmentId: searchRegex },
                { 'appointmentDetails.purpose': searchRegex },
                { 'appointmentDetails.meetingRoom': searchRegex },
                { 'appointmentDetails.notes': searchRegex }
            ];
            
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
                .populate('visitorId', 'name email phone company purposeOfVisit photo visitorId designation address idProof')
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

        const appointment = await Appointment.findOne({ appointmentId, isDeleted: false }).session(session);
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

        return appointment.toObject() as unknown as IAppointmentResponse;
    }

    /**
     * Check out appointment
     */
    @Transaction('Failed to check out appointment')
    static async checkOutAppointment(request: ICheckOutRequest, options: { session?: any } = {}): Promise<IAppointmentResponse> {
        const { session } = options;
        const { appointmentId, notes } = request;

        const appointment = await Appointment.findOne({ appointmentId, isDeleted: false }).session(session);
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

        return appointment.toObject() as unknown as IAppointmentResponse;
    }

    /**
     * Get appointment statistics (user-specific)
     * @param userId - Optional user ID to filter by creator
     * @param startDate - Optional start date for filtering (YYYY-MM-DD)
     * @param endDate - Optional end date for filtering (YYYY-MM-DD)
     */
    static async getAppointmentStats(userId?: string, startDate?: string, endDate?: string): Promise<IAppointmentStats> {
        const baseFilter: any = { isDeleted: false };
        if (userId) {
            baseFilter.createdBy = userId;
        }

        // Build date range filter
        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const endExclusive = new Date(endDate);
            endExclusive.setDate(endExclusive.getDate() + 1);
            endExclusive.setHours(0, 0, 0, 0);
            
            baseFilter['appointmentDetails.scheduledDate'] = {
                $gte: start,
                $lt: endExclusive
            };
        } else if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const endExclusive = new Date(startDate);
            endExclusive.setDate(endExclusive.getDate() + 1);
            endExclusive.setHours(0, 0, 0, 0);
            
            baseFilter['appointmentDetails.scheduledDate'] = {
                $gte: start,
                $lt: endExclusive
            };
        } else if (endDate) {
            const endExclusive = new Date(endDate);
            endExclusive.setDate(endExclusive.getDate() + 1);
            endExclusive.setHours(0, 0, 0, 0);
            
            baseFilter['appointmentDetails.scheduledDate'] = {
                $lt: endExclusive
            };
        }

        const [
            totalAppointments,
            scheduledAppointments,
            checkedInAppointments,
            completedAppointments,
            cancelledAppointments,
            noShowAppointments,
            appointmentsByStatus,
            appointmentsByEmployee,
            appointmentsByDate
        ] = await Promise.all([
            Appointment.countDocuments(baseFilter),
            Appointment.countDocuments({ ...baseFilter, status: 'scheduled' }),
            Appointment.countDocuments({ ...baseFilter, status: 'checked_in' }),
            Appointment.countDocuments({ ...baseFilter, status: 'completed' }),
            Appointment.countDocuments({ ...baseFilter, status: 'cancelled' }),
            Appointment.countDocuments({ ...baseFilter, status: 'no_show' }),
            Appointment.aggregate([
                { $match: baseFilter },
                { $group: { _id: '$status', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            Appointment.aggregate([
                { $match: baseFilter },
                { $group: { _id: '$employeeId', count: { $sum: 1 } } },
                { $lookup: { from: 'employees', localField: '_id', foreignField: '_id', as: 'employee' } },
                { $unwind: '$employee' },
                { $project: { employeeId: '$_id', employeeName: '$employee.name', count: 1 } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]),
            Appointment.aggregate([
                { $match: baseFilter },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: '%Y-%m-%d',
                                date: '$appointmentDetails.scheduledDate'
                            }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: -1 } },
                { $limit: 30 }
            ])
        ]);

        return {
            totalAppointments,
            scheduledAppointments,
            checkedInAppointments,
            completedAppointments,
            cancelledAppointments,
            noShowAppointments,
            appointmentsByStatus: appointmentsByStatus.map(item => ({
                status: item._id,
                count: item.count
            })),
            appointmentsByEmployee: appointmentsByEmployee.map(item => ({
                employeeId: item.employeeId.toString(),
                employeeName: item.employeeName,
                count: item.count
            })),
            appointmentsByDate: appointmentsByDate.map(item => ({
                date: item._id,
                count: item.count
            }))
        };
    }

    /**
     * Get appointments calendar view
     */
    static async getAppointmentsCalendar(startDate: string, endDate: string): Promise<IAppointmentCalendarResponse[]> {
        const appointments = await Appointment.find({
            'appointmentDetails.scheduledDate': {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            },
            isDeleted: false
        })
            .populate('employeeId', 'name')
            .sort({ 'appointmentDetails.scheduledDate': 1, 'appointmentDetails.scheduledTime': 1 })
            .lean();

        const appointmentsByDate = appointments.reduce((acc: any, appointment: any) => {
            const date = appointment.appointmentDetails.scheduledDate.toISOString().split('T')[0];

            if (!acc[date]) {
                acc[date] = [];
            }

            acc[date].push({
                appointmentId: appointment.appointmentId,
                visitorName: appointment.visitorDetails.name,
                employeeName: appointment.employeeId.name,
                scheduledTime: appointment.appointmentDetails.scheduledTime,
                duration: appointment.appointmentDetails.duration,
                status: appointment.status,
                purpose: appointment.appointmentDetails.purpose
            });

            return acc;
        }, {});

        return Object.entries(appointmentsByDate).map(([date, appointments]) => ({
            date,
            appointments: appointments as any[]
        }));
    }

    /**
     * Search appointments
     */
    static async searchAppointments(request: IAppointmentSearchRequest): Promise<IAppointmentListResponse> {
        const { query, type, page = 1, limit = 10 } = request;

        const filter: any = { isDeleted: false };

        switch (type) {
            case 'visitor_name':
                filter['visitorDetails.name'] = { $regex: query, $options: 'i' };
                break;
            case 'visitor_phone':
                filter['visitorDetails.phone'] = { $regex: query, $options: 'i' };
                break;
            case 'visitor_email':
                filter['visitorDetails.email'] = { $regex: query, $options: 'i' };
                break;
            case 'appointment_id':
                filter.appointmentId = { $regex: query, $options: 'i' };
                break;
            case 'employee_name':
                filter['employeeId'] = { $exists: true };
                break;
        }

        const skip = (page - 1) * limit;

        const [appointments, totalAppointments] = await Promise.all([
            Appointment.find(filter)
                .populate('employeeId', 'name email department designation phone')
                .populate('visitorId', 'name email phone company purposeOfVisit photo visitorId designation address idProof')
                .populate('createdBy', 'firstName lastName email')
                .sort({ createdAt: -1 })
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
     * Bulk update appointments
     */
    @Transaction('Failed to bulk update appointments')
    static async bulkUpdateAppointments(bulkData: IBulkUpdateAppointmentsDTO, options: { session?: any } = {}): Promise<{ updatedCount: number }> {
        const { session } = options;
        const { appointmentIds, ...updateData } = bulkData;

        const cleanUpdateData = Object.fromEntries(
            Object.entries(updateData).filter(([_, value]) => value !== undefined && value !== '')
        );

        if (Object.keys(cleanUpdateData).length === 0) {
            throw new AppError('No update data provided', ERROR_CODES.BAD_REQUEST);
        }

        const result = await Appointment.updateMany(
            { _id: { $in: appointmentIds }, isDeleted: false },
            cleanUpdateData,
            { session }
        );

        if (result.matchedCount === 0) {
            throw new AppError('No appointments found', ERROR_CODES.NOT_FOUND);
        }

        return { updatedCount: result.modifiedCount };
    }

    /**
     * Restore appointment from trash
     */
    @Transaction('Failed to restore appointment')
    static async restoreAppointment(appointmentId: string, options: { session?: any } = {}): Promise<IAppointmentResponse> {
        const { session } = options;

        const appointment = await Appointment.findOne({ _id: appointmentId, isDeleted: true }).session(session);
        if (!appointment) {
            throw new AppError('Appointment not found', ERROR_CODES.NOT_FOUND);
        }

        await (appointment as any).restore();
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
    static async approveAppointment(appointmentId: string, options: { session?: any } = {}): Promise<IAppointmentResponse> {
        const { session } = options;

        const appointment = await Appointment.findOne({ _id: appointmentId, isDeleted: false })
            .populate('employeeId', 'name email')
            .populate('visitorId', 'name email phone photo visitorId')
            .session(session);
            
        if (!appointment) {
            throw new AppError('Appointment not found', ERROR_CODES.NOT_FOUND);
        }

        if (appointment.status !== 'pending') {
            throw new AppError('Only pending appointments can be approved', ERROR_CODES.BAD_REQUEST);
        }

        appointment.status = 'approved';
        await appointment.save({ session });

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
        } catch (error) {
            console.error('Failed to send approval email to visitor:', error);
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
        } catch (error) {
            console.error('Failed to send approval WhatsApp to visitor:', error);
        }

        // SMS notifications (if SMS service is implemented and enabled)
        if (smsEnabled) {
            // TODO: Implement SMS service when available
            // await SmsService.sendAppointmentStatusUpdate(...);
        }

        // Send email notification to employee
        try {
            await EmailService.sendEmployeeAppointmentApprovalEmail(
                (appointment.employeeId as any).email,
                (appointment.employeeId as any).name,
                (appointment.visitorId as any).name,
                appointment.appointmentDetails.scheduledDate,
                appointment.appointmentDetails.scheduledTime
            );
        } catch (error) {
            console.error('Failed to send approval email to employee:', error);
        }

        return appointment.toObject() as unknown as IAppointmentResponse;
    }

    /**
     * Reject appointment
     */
    static async rejectAppointment(appointmentId: string, options: { session?: any } = {}): Promise<IAppointmentResponse> {
        const { session } = options;

        const appointment = await Appointment.findOne({ _id: appointmentId, isDeleted: false })
            .populate('employeeId', 'name email')
            .populate('visitorId', 'name email phone photo visitorId')
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
        } catch (error) {
            console.error('Failed to send rejection email to visitor:', error);
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
        } catch (error) {
            console.error('Failed to send rejection WhatsApp to visitor:', error);
        }

        // SMS notifications (if SMS service is implemented and enabled)
        if (smsEnabled) {
            // TODO: Implement SMS service when available
            // await SmsService.sendAppointmentStatusUpdate(...);
        }

        // Send email notification to employee
        try {
            await EmailService.sendEmployeeAppointmentRejectionEmail(
                (appointment.employeeId as any).email,
                (appointment.employeeId as any).name,
                (appointment.visitorId as any).name,
                appointment.appointmentDetails.scheduledDate,
                appointment.appointmentDetails.scheduledTime
            );
        } catch (error) {
            console.error('Failed to send rejection email to employee:', error);
        }

        return appointment.toObject() as unknown as IAppointmentResponse;
    }
}
