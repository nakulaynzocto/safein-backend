import { SpecialVisitorBooking, SpecialBookingStatus } from '../../models/specialVisitorBooking/specialVisitorBooking.model';
import { Visitor } from '../../models/visitor/visitor.model';
import { Employee } from '../../models/employee/employee.model';
import { User } from '../../models/user/user.model';
import { AppointmentService } from '../appointment/appointment.service';
import { VisitorService } from '../visitor/visitor.service';
import { socketService, SocketEvents } from '../socket/socket.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { EmailService } from '../email/email.service';
import { AppError } from '../../middlewares/errorHandler';
import { ERROR_CODES } from '../../utils/constants';
import { toObjectId } from '../../utils/idExtractor.util';
import { EmployeeUtil } from '../../utils/employee.util';
import { escapeRegex } from '../../utils/string.util';
import mongoose from 'mongoose';
import { NotificationService } from '../notification/notification.service';
import { SettingsService } from '../settings/settings.service';

export class SpecialVisitorBookingService {
    /**
     * Create a special visitor booking and send OTP
     */
    static async createBooking(data: any, createdBy: string) {
        const {
            visitorName,
            visitorEmail,
            visitorPhone,
            employeeId,
            purpose,
            accompanyingCount,
            notes,
        } = data;

        // Generate 4-digit Entry Code (formerly OTP)
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        // Lifetime validity (100 years)
        const otpExpiresAt = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000);

        const booking = new SpecialVisitorBooking({
            visitorName,
            visitorEmail,
            visitorPhone,
            employeeId: toObjectId(employeeId),
            purpose,
            accompanyingCount,
            notes,
            otp,
            otpExpiresAt,
            createdBy: toObjectId(createdBy),
            status: SpecialBookingStatus.PENDING,
        });

        await booking.save();

        // Fetch Company Name (from Admin)
        const adminId = await EmployeeUtil.getAdminId(createdBy);
        const adminUser = await User.findById(adminId).select('companyName').lean();
        const companyName = adminUser?.companyName || 'SafeIn';

        // Fetch admin's WhatsApp config (same as appointment.service.ts)
        const whatsappConfig = await SettingsService.getWhatsAppConfig(adminId);

        // Send Entry Code via WhatsApp using admin's configured provider
        const whatsappMessage = `Hello ${visitorName}, Your Visitor Entry Code for ${companyName} is: ${otp}. Please show this at reception.`;
        try {
            await WhatsAppService.sendMessage(visitorPhone, whatsappMessage, whatsappConfig);
        } catch (error) {
            // Ignore error
        }

        // Send Entry Code via Email
        try {
            await EmailService.sendVisitorOtpEmail(visitorEmail, otp, visitorName, companyName);
        } catch (error) {
            // Ignore error
        }

        // Socket Notification
        await this.notifyRecipient(booking, createdBy, 'create');

        return booking;
    }

    /**
     * Verify OTP and complete booking
     */
    static async verifyOtp(bookingId: string, otp: string, userId: string) {
        const booking = await SpecialVisitorBooking.findById(bookingId).populate('employeeId');
        if (!booking) {
            throw new AppError('Booking not found', ERROR_CODES.NOT_FOUND);
        }

        if (booking.status !== SpecialBookingStatus.PENDING) {
            throw new AppError('Booking is already processed', ERROR_CODES.BAD_REQUEST);
        }

        const enteredOtp = String(otp).trim();
        const storedOtp = String(booking.otp).trim();

        if (storedOtp !== enteredOtp) {
            throw new AppError('Invalid OTP', ERROR_CODES.BAD_REQUEST);
        }

        if (booking.otpExpiresAt && booking.otpExpiresAt < new Date()) {
            throw new AppError('OTP expired', ERROR_CODES.BAD_REQUEST);
        }

        // 1. Get Admin ID
        const adminId = await EmployeeUtil.getAdminId(userId);

        // 2. Check if visitor exists for this admin
        let visitor: any = await Visitor.findOne({
            email: booking.visitorEmail.toLowerCase().trim(),
            createdBy: toObjectId(adminId),
            isDeleted: false,
        });

        if (!visitor) {
            visitor = await VisitorService.createVisitor({
                name: booking.visitorName,
                email: booking.visitorEmail,
                phone: booking.visitorPhone,
                address: { street: 'N/A', city: 'N/A', state: 'N/A', country: 'India' }
            }, adminId);
        }

        // 3. Create Appointment
        const employeeId = (booking.employeeId as any)._id ? (booking.employeeId as any)._id : booking.employeeId;

        const now = new Date();
        const defaultTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        const appointment: any = await AppointmentService.createAppointment({
            employeeId: employeeId.toString(),
            visitorId: visitor._id.toString(),
            accompanyingCount: booking.accompanyingCount,
            appointmentDetails: {
                purpose: booking.purpose,
                scheduledDate: booking.scheduledDate ? new Date(booking.scheduledDate) : now,
                scheduledTime: booking.scheduledTime || defaultTime,
                notes: booking.notes || '',
            },
            status: 'approved'
        }, userId, { suppressEmails: true });

        // 4. Update Booking
        booking.status = SpecialBookingStatus.VERIFIED;
        booking.visitorId = toObjectId(visitor._id.toString()) as mongoose.Types.ObjectId;
        booking.appointmentId = toObjectId(appointment._id.toString()) as mongoose.Types.ObjectId;
        await booking.save();

        // Notify Employee of Arrival
        await this.notifyRecipient(booking, userId, 'arrival');

        return { booking, appointment, visitor };
    }

    /**
     * Resend OTP for a booking
     */
    static async resendOtp(bookingId: string, userId: string) {
        const booking = await SpecialVisitorBooking.findById(bookingId).populate('employeeId');
        if (!booking) throw new AppError('Booking not found', ERROR_CODES.NOT_FOUND);

        if (booking.status !== SpecialBookingStatus.PENDING) {
            throw new AppError('OTP can only be resent for pending bookings', ERROR_CODES.BAD_REQUEST);
        }

        // Fetch Company Name (from Admin)
        const adminId = await EmployeeUtil.getAdminId(userId);
        const adminUser = await User.findById(adminId).select('companyName').lean();
        const companyName: string = (adminUser as any)?.companyName || 'SafeIn';

        // Fetch admin's WhatsApp config
        const whatsappConfig = await SettingsService.getWhatsAppConfig(adminId);

        // Resend Entry Code via WhatsApp using admin's configured provider
        const whatsappMessage = `Hello ${booking.visitorName}, Your Visitor Entry Code for ${companyName} is: ${booking.otp}. Please show this at reception.`;
        try {
            await WhatsAppService.sendMessage(booking.visitorPhone, whatsappMessage, whatsappConfig);
        } catch (error) {
            // Ignore error
        }

        // Resend Entry Code via Email
        try {
            await EmailService.sendVisitorOtpEmail(
                booking.visitorEmail || '',
                booking.otp || '',
                booking.visitorName || '',
                companyName
            );
        } catch (error) {
            // Ignore error
        }

        return booking;
    }

    /**
     * Update note for a booking
     */
    static async updateNote(bookingId: string, notes: string, userId: string) {
        const booking = await SpecialVisitorBooking.findById(bookingId).populate('employeeId');
        if (!booking) throw new AppError('Booking not found', ERROR_CODES.NOT_FOUND);

        booking.notes = notes;
        await booking.save();

        // Socket Notification
        await this.notifyRecipient(booking, userId, 'note');

        return booking;
    }

    /**
     * Notify Admin or Employee via Socket
     */
    private static async notifyRecipient(booking: any, senderId: string, type: 'create' | 'note' | 'arrival' = 'create') {
        try {
            const sender = await User.findById(senderId).select('roles companyName').lean();
            const isEmployee = sender?.roles?.includes('employee');

            let title = '';
            let message = '';
            let socketType = '';

            switch (type) {
                case 'note':
                    title = 'New Note Added';
                    message = `${sender?.companyName || 'User'} added a note to ${booking.visitorName}'s booking.`;
                    socketType = 'special_booking_note_updated';
                    break;
                case 'arrival':
                    title = 'Visitor Arrived';
                    message = `${booking.visitorName} has been verified and granted entry.`;
                    socketType = 'special_booking_arrival';
                    break;
                case 'create':
                default:
                    title = 'New Special Visitor Request';
                    message = `${booking.visitorName} is scheduled to meet ${booking.employeeId?.name || 'an employee'}.`;
                    socketType = 'special_booking_created';
                    break;
            }

            const shouldNotifyEmployee = type === 'arrival' || !isEmployee;
            const shouldNotifyAdmin = isEmployee; // Notify admin if an employee is involved (creation, arrival, notes)

            if (shouldNotifyAdmin) {
                const adminId = await EmployeeUtil.getAdminId(senderId);

                // Save to DB
                await NotificationService.createNotification({
                    userId: adminId,
                    type: 'general',
                    title,
                    message,
                    metadata: {
                        bookingId: booking._id,
                        type: socketType
                    }
                });

                socketService.emitToUser(adminId, SocketEvents.NEW_NOTIFICATION, {
                    type: 'NEW_NOTIFICATION',
                    payload: {
                        title,
                        message,
                        type: socketType,
                        bookingId: booking._id,
                    },
                    timestamp: new Date().toISOString()
                });
            }

            if (shouldNotifyEmployee) {
                const employeeId = booking.employeeId?._id || booking.employeeId;
                const employeeUserId = await EmployeeUtil.getUserIdFromEmployeeId(employeeId.toString());

                if (employeeUserId) {
                    // Save to DB
                    await NotificationService.createNotification({
                        userId: employeeUserId,
                        type: socketType === 'special_booking_arrival' ? 'appointment_status_changed' : 'general',
                        title,
                        message,
                        metadata: {
                            bookingId: booking._id,
                            type: socketType
                        }
                    });

                    socketService.emitToUser(employeeUserId, SocketEvents.NEW_NOTIFICATION, {
                        type: 'NEW_NOTIFICATION',
                        payload: {
                            title,
                            message,
                            type: socketType,
                            bookingId: booking._id,
                        },
                        timestamp: new Date().toISOString()
                    });
                }
            }
        } catch (error) {
            console.error('Socket notification failed:', error);
        }
    }

    /**
     * Get all special bookings for a user
     */
    static async getAllBookings(query: any, userId: string) {
        const { page = 1, limit = 10, search, status } = query;
        const adminId = await EmployeeUtil.getAdminId(userId);

        const filter: any = {};
        if (userId === adminId) {
            // Admin sees everything for their company
            // This is a bit complex since we need to filter by employees of this admin
            const employees = await Employee.find({ createdBy: toObjectId(adminId), isDeleted: false }).select('_id');
            const employeeIds = employees.map(emp => emp._id);
            filter.$or = [
                { createdBy: toObjectId(adminId) },
                { employeeId: { $in: employeeIds } }
            ];
        } else {
            // Employee sees only their own
            const user = await User.findById(userId).select('email').lean();
            const employee = await Employee.findOne({
                email: user?.email?.toLowerCase().trim(),
                isDeleted: false
            }).select('_id').lean();

            filter.$or = [
                { createdBy: toObjectId(userId) }
            ];

            if (employee?._id) {
                filter.$or.push({ employeeId: employee._id });
            }
        }

        if (status) filter.status = status;
        if (search) {
            const escapedSearch = escapeRegex(search);
            filter.$or = [
                ...(filter.$or || []),
                { visitorName: { $regex: escapedSearch, $options: 'i' } },
                { visitorEmail: { $regex: escapedSearch, $options: 'i' } },
                { visitorPhone: { $regex: escapedSearch, $options: 'i' } },
            ];
        }

        const skip = (page - 1) * limit;
        const [bookings, total] = await Promise.all([
            SpecialVisitorBooking.find(filter)
                .populate('employeeId', 'name email department')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            SpecialVisitorBooking.countDocuments(filter),
        ]);

        return {
            bookings,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / limit),
            }
        };
    }
}
