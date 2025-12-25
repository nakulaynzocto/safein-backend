import { Request, NextFunction } from 'express';
import { AppointmentBookingLink } from '../models/appointmentBookingLink/appointmentBookingLink.model';
import { AppError } from './errorHandler';
import { ERROR_CODES } from '../utils/constants';

/**
 * Middleware to verify appointment link token
 * Used for public endpoints that need to be secured with appointment link token
 */
export const verifyAppointmentLinkToken = async (
  req: Request,
  _res: any,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from query parameter or header
    const token = req.query.token as string || req.headers['x-appointment-token'] as string;

    if (!token) {
      throw new AppError('Appointment link token is required', ERROR_CODES.UNAUTHORIZED);
    }

    // Decode the token in case it's URL encoded
    const decodedToken = decodeURIComponent(token);

    // Find the appointment link by token
    const appointmentLink = await AppointmentBookingLink.findOne({ 
      secureToken: decodedToken 
    }).lean();

    if (!appointmentLink) {
      throw new AppError('Invalid appointment link token', ERROR_CODES.UNAUTHORIZED);
    }

    // Check if link has expired
    if (new Date(appointmentLink.expiresAt) < new Date()) {
      throw new AppError('Appointment link has expired', ERROR_CODES.UNAUTHORIZED);
    }

    // Check if link is already booked (optional - you might want to allow re-uploads)
    // if (appointmentLink.isBooked) {
    //   throw new AppError('Appointment link has already been used', ERROR_CODES.BAD_REQUEST);
    // }

    // Attach appointment link info to request for use in controllers
    (req as any).appointmentLink = appointmentLink;

    next();
  } catch (error) {
    next(error);
  }
};

