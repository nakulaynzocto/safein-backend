import { Appointment } from '../../models/appointment/appointment.model';
import { Employee } from '../../models/employee/employee.model';
import { Visitor } from '../../models/visitor/visitor.model';
import { EmailService } from '../email/email.service';
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

        // Verify employee exists
        const employee = await Employee.findOne({ _id: appointmentData.employeeId, isDeleted: false }).session(session);
        if (!employee) {
            throw new AppError(ERROR_MESSAGES.EMPLOYEE_NOT_FOUND, ERROR_CODES.NOT_FOUND);
        }

        // Check for scheduling conflicts
        const conflictAppointment = await Appointment.findOne({
            employeeId: appointmentData.employeeId,
            'appointmentDetails.scheduledDate': appointmentData.appointmentDetails.scheduledDate,
            'appointmentDetails.scheduledTime': appointmentData.appointmentDetails.scheduledTime,
            status: { $in: ['scheduled', 'checked_in', 'in_meeting'] },
            isDeleted: false
        }).session(session);

        if (conflictAppointment) {
            throw new AppError('Employee already has an appointment at this time', ERROR_CODES.CONFLICT);
        }

        // Create new appointment
        const appointment = new Appointment({
            ...appointmentData,
            createdBy
        });

        await appointment.save({ session });

        // Populate appointment data for email notification
        const populatedAppointment = await Appointment.findById(appointment._id)
            .populate('employeeId', 'name email phone department')
            .populate('visitorId', 'name email phone company designation address idProof photo visitorId')
            .session(session);

        // Send notification email to employee about new appointment request
        try {
            if (populatedAppointment) {
                await EmailService.sendNewAppointmentRequestEmail(
                    (populatedAppointment.employeeId as any).email,
                    (populatedAppointment.employeeId as any).name,
                    populatedAppointment.visitorId as any,
                    populatedAppointment.appointmentDetails.scheduledDate,
                    populatedAppointment.appointmentDetails.scheduledTime,
                    populatedAppointment.appointmentDetails.purpose,
                    (populatedAppointment._id as any).toString()
                );
            }
        } catch (error) {
            console.error('Failed to send new appointment request email to employee:', error);
            // Don't throw error - appointment is still created
        }

        return appointment.toObject() as unknown as IAppointmentResponse;
    }

    /**
     * Get appointment by ID
     */
    static async getAppointmentById(appointmentId: string): Promise<IAppointmentResponse> {
        const appointment = await Appointment.findOne({ _id: appointmentId, isDeleted: false })
            .populate('employeeId', 'name email department designation phone')
            .populate('visitorId', 'name email phone company purposeOfVisit')
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
            .populate('visitorId', 'name email phone company purposeOfVisit')
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

        // Build filter object - only show appointments created by the current user
        const filter: any = { isDeleted: false };
        
        // Filter by user if provided (for user-specific access)
        if (userId) {
            filter.createdBy = userId;
        }

        if (search) {
            // Create a more comprehensive search that works with populated data
            const searchRegex = { $regex: search, $options: 'i' };
            
            // First, try to find visitors that match the search criteria
            const matchingVisitors = await Visitor.find({
                $or: [
                    { name: searchRegex },
                    { phone: searchRegex },
                    { email: searchRegex },
                    { company: searchRegex }
                ]
            }).select('_id').lean();
            
            const visitorIds = matchingVisitors.map((v: any) => v._id);
            
            // Also search for employees that match
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
            
            // Add visitor and employee ID searches if we found matches
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
            // Interpret startDate/endDate as local-date (yyyy-mm-dd) and include full end day
            const start = new Date(startDate)
            const endExclusive = new Date(endDate)
            endExclusive.setDate(endExclusive.getDate() + 1)

            filter['appointmentDetails.scheduledDate'] = {
                $gte: start,
                $lt: endExclusive
            };
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Build sort object
        const sort: any = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Execute queries
        const [appointments, totalAppointments] = await Promise.all([
            Appointment.find(filter)
                .populate('employeeId', 'name email department designation phone')
                .populate('visitorId', 'name email phone company purposeOfVisit')
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
        
        // Remove session from updateData if it exists to prevent circular reference
        const cleanUpdateData = { ...updateData };
        delete (cleanUpdateData as any).session;

        // Check for scheduling conflicts if updating time/date
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

        // Accept custom appointmentId string (e.g., "APT1760335163234DWU4Z")
        const appointment = await Appointment.findOne({ appointmentId, isDeleted: false }).session(session);
        if (!appointment) {
            throw new AppError('Appointment not found', ERROR_CODES.NOT_FOUND);
        }

        if (appointment.status !== 'pending') {
            throw new AppError('Appointment is not in pending status', ERROR_CODES.BAD_REQUEST);
        }

        // Update appointment
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

        // Accept custom appointmentId string (e.g., "APT1760335163234DWU4Z")
        const appointment = await Appointment.findOne({ appointmentId, isDeleted: false }).session(session);
        if (!appointment) {
            throw new AppError('Appointment not found', ERROR_CODES.NOT_FOUND);
        }

        // Allow check-out for any status

        // Update appointment
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
     */
    static async getAppointmentStats(userId?: string): Promise<IAppointmentStats> {
        // Build base filter - only show appointments created by the current user
        const baseFilter: any = {};
        if (userId) {
            baseFilter.createdBy = userId;
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
            Appointment.countDocuments({ ...baseFilter, isDeleted: false }),
            Appointment.countDocuments({ ...baseFilter, isDeleted: false, status: 'scheduled' }),
            Appointment.countDocuments({ ...baseFilter, isDeleted: false, status: 'checked_in' }),
            Appointment.countDocuments({ ...baseFilter, isDeleted: false, status: 'completed' }),
            Appointment.countDocuments({ ...baseFilter, isDeleted: false, status: 'cancelled' }),
            Appointment.countDocuments({ ...baseFilter, isDeleted: false, status: 'no_show' }),
            Appointment.aggregate([
                { $match: { ...baseFilter, isDeleted: false } },
                { $group: { _id: '$status', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            Appointment.aggregate([
                { $match: { ...baseFilter, isDeleted: false } },
                { $group: { _id: '$employeeId', count: { $sum: 1 } } },
                { $lookup: { from: 'employees', localField: '_id', foreignField: '_id', as: 'employee' } },
                { $unwind: '$employee' },
                { $project: { employeeId: '$_id', employeeName: '$employee.name', count: 1 } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]),
            Appointment.aggregate([
                { $match: { ...baseFilter, isDeleted: false } },
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

        // Group appointments by date
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
                // This would require a more complex query with population
                filter['employeeId'] = { $exists: true };
                break;
        }

        const skip = (page - 1) * limit;

        const [appointments, totalAppointments] = await Promise.all([
            Appointment.find(filter)
                .populate('employeeId', 'name email department designation phone')
                .populate('visitorId', 'name email phone company purposeOfVisit')
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

        // Remove empty values
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

        // Check if appointment can be cancelled (only pending or approved appointments can be cancelled)
        if (appointment.status === 'completed') {
            throw new AppError('Cannot cancel a completed appointment', ERROR_CODES.BAD_REQUEST);
        }

        if (appointment.status === 'rejected') {
            throw new AppError('Appointment is already cancelled', ERROR_CODES.BAD_REQUEST);
        }

        // Update status to rejected (cancelled)
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
            .populate('visitorId', 'name email phone')
            .session(session);
            
        if (!appointment) {
            throw new AppError('Appointment not found', ERROR_CODES.NOT_FOUND);
        }

        // Check if appointment can be approved (only pending appointments can be approved)
        if (appointment.status !== 'pending') {
            throw new AppError('Only pending appointments can be approved', ERROR_CODES.BAD_REQUEST);
        }

        // Update status to approved
        appointment.status = 'approved';
        await appointment.save({ session });

        // Send notification to visitor
        try {
            await EmailService.sendAppointmentApprovalEmail(
                (appointment.visitorId as any).email,
                (appointment.visitorId as any).name,
                (appointment.employeeId as any).name,
                appointment.appointmentDetails.scheduledDate,
                appointment.appointmentDetails.scheduledTime
            );
        } catch (error) {
            console.error('Failed to send approval email to visitor:', error);
            // Don't throw error - appointment is still approved
        }

        // Send notification to employee
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
            // Don't throw error - appointment is still approved
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
            .populate('visitorId', 'name email phone')
            .session(session);
            
        if (!appointment) {
            throw new AppError('Appointment not found', ERROR_CODES.NOT_FOUND);
        }

        // Check if appointment can be rejected (only pending appointments can be rejected)
        if (appointment.status !== 'pending') {
            throw new AppError('Only pending appointments can be rejected', ERROR_CODES.BAD_REQUEST);
        }

        // Update status to rejected
        appointment.status = 'rejected';
        await appointment.save({ session });

        // Send notification to visitor
        try {
            await EmailService.sendAppointmentRejectionEmail(
                (appointment.visitorId as any).email,
                (appointment.visitorId as any).name,
                (appointment.employeeId as any).name,
                appointment.appointmentDetails.scheduledDate,
                appointment.appointmentDetails.scheduledTime
            );
        } catch (error) {
            console.error('Failed to send rejection email to visitor:', error);
            // Don't throw error - appointment is still rejected
        }

        // Send notification to employee
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
            // Don't throw error - appointment is still rejected
        }

        return appointment.toObject() as unknown as IAppointmentResponse;
    }
}
