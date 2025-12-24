import { ApprovalLink } from '../../models/approvalLink/approvalLink.model';
import { ERROR_CODES } from '../../utils/constants';
import { AppError } from '../../middlewares/errorHandler';
import * as crypto from 'crypto';
import { socketService } from '../socket/socket.service';

export class ApprovalLinkService {
    private static getBaseUrl(): string {
        const url = process.env.APPROVAL_LINK_BASE_URL || '';
        return url.replace(/\/$/, ''); // Remove trailing slash
    }
    /**
     * Generate a secure random token
     */
    private static generateToken(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Create an approval link for an appointment
     */
    static async createApprovalLink(appointmentId: string): Promise<{ token: string; link: string }> {
        // Check if approval link already exists
        const existingLink = await ApprovalLink.findOne({ appointmentId });
        if (existingLink) {
            const baseUrl = this.getBaseUrl();
            return {
                token: existingLink.token,
                link: `${baseUrl}/verify/${existingLink.token}`
            };
        }

        // Generate unique token
        let token: string = '';
        let isUnique = false;
        
        while (!isUnique) {
            token = this.generateToken();
            const existing = await ApprovalLink.findOne({ token });
            if (!existing) {
                isUnique = true;
            }
        }

        // Create approval link
        const approvalLink = new ApprovalLink({
            appointmentId,
            token
        });

        await approvalLink.save();

        const baseUrl = this.getBaseUrl();
        const link = `${baseUrl}/verify/${token}`;

        return { token, link };
    }

    /**
     * Verify token and get appointment details
     */
    static async verifyToken(token: string): Promise<{
        isValid: boolean;
        isUsed: boolean;
        appointment?: any;
    }> {
        const approvalLink = await ApprovalLink.findOne({ token })
            .populate({
                path: 'appointmentId',
                populate: [
                    { path: 'employeeId', select: 'name email department designation phone' },
                    { path: 'visitorId', select: 'name email phone company designation address idProof photo visitorId' }
                ]
            });

        if (!approvalLink) {
            return { isValid: false, isUsed: false };
        }

        if (approvalLink.isUsed) {
            return { isValid: true, isUsed: true };
        }

        const appointment = approvalLink.appointmentId as any;
        
        return {
            isValid: true,
            isUsed: false,
            appointment: {
                _id: appointment._id,
                appointmentId: appointment._id.toString(),
                status: appointment.status,
                employee: appointment.employeeId,
                visitor: appointment.visitorId,
                appointmentDetails: appointment.appointmentDetails,
                accompaniedBy: appointment.accompaniedBy,
                createdAt: appointment.createdAt
            }
        };
    }

    /**
     * Update appointment status via approval link
     */
    static async updateStatusViaToken(token: string, status: 'approved' | 'rejected'): Promise<{
        success: boolean;
        appointment: any;
    }> {
        const approvalLink = await ApprovalLink.findOne({ token })
            .populate('appointmentId');

        if (!approvalLink) {
            throw new AppError('Invalid or expired link', ERROR_CODES.NOT_FOUND);
        }

        if (approvalLink.isUsed) {
            throw new AppError('Link expired or already used', ERROR_CODES.BAD_REQUEST);
        }

        const appointment = approvalLink.appointmentId as any;

        if (!appointment) {
            throw new AppError('Appointment not found', ERROR_CODES.NOT_FOUND);
        }

        // Check if appointment is still pending
        if (appointment.status !== 'pending') {
            throw new AppError('Appointment status cannot be changed', ERROR_CODES.BAD_REQUEST);
        }

        // Update appointment status
        appointment.status = status;
        await appointment.save();

        // Mark approval link as used
        approvalLink.isUsed = true;
        await approvalLink.save();

        // 🔔 Emit WebSocket event for real-time update
        const userId = appointment.createdBy?.toString();
        if (userId) {
            const appointmentObj = appointment.toObject();
            socketService.emitAppointmentStatusChange(userId, {
                appointmentId: appointment._id.toString(),
                status: status,
                updatedAt: new Date(),
                appointment: appointmentObj
            });
        }

        return {
            success: true,
            appointment: appointment.toObject()
        };
    }

    /**
     * Get approval link by appointment ID
     */
    static async getApprovalLinkByAppointmentId(appointmentId: string): Promise<{ token: string; link: string } | null> {
        const approvalLink = await ApprovalLink.findOne({ appointmentId });

        if (!approvalLink) {
            return null;
        }

        const baseUrl = this.getBaseUrl();
        const link = `${baseUrl}/verify/${approvalLink.token}`;

        return {
            token: approvalLink.token,
            link
        };
    }
}

