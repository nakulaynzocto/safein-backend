import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { SpecialVisitorBookingService } from '../../services/specialVisitorBooking/specialVisitorBooking.service';
import { ResponseUtil } from '../../utils/response.util';
import { AppError } from '../../middlewares/errorHandler';
import { ERROR_CODES } from '../../utils/constants';

export class SpecialVisitorBookingController {
    static createBooking = async (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            if (!req.user) throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
            const booking = await SpecialVisitorBookingService.createBooking(req.body, req.user._id.toString());
            ResponseUtil.success(res, 'Special visitor booking created. OTP sent.', booking, 201);
        } catch (error) {
            next(error);
        }
    };

    static verifyOtp = async (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            if (!req.user) throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);

            const { bookingId, otp } = req.body;
            if (!bookingId || !otp) {
                throw new AppError('Booking ID and OTP are required', ERROR_CODES.BAD_REQUEST);
            }

            const result = await SpecialVisitorBookingService.verifyOtp(bookingId, otp, req.user._id.toString());
            ResponseUtil.success(res, 'OTP verified and appointment created successfully', result);
        } catch (error) {
            next(error);
        }
    };

    static getAllBookings = async (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            if (!req.user) throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);

            const result = await SpecialVisitorBookingService.getAllBookings(req.query, req.user._id.toString());
            ResponseUtil.success(res, 'Bookings retrieved successfully', result);
        } catch (error) {
            next(error);
        }
    };

    static updateNote = async (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            if (!req.user) throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);

            const { bookingId, notes } = req.body;
            if (!bookingId || notes === undefined) {
                throw new AppError('Booking ID and notes are required', ERROR_CODES.BAD_REQUEST);
            }

            const booking = await SpecialVisitorBookingService.updateNote(bookingId, notes, req.user._id.toString());
            ResponseUtil.success(res, 'Note updated successfully', booking);
        } catch (error) {
            next(error);
        }
    };
}
