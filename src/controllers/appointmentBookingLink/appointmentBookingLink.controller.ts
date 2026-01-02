import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { AppointmentBookingLinkService } from '../../services/appointmentBookingLink/appointmentBookingLink.service';
import { VisitorService } from '../../services/visitor/visitor.service';
import { UserSubscriptionService } from '../../services/userSubscription/userSubscription.service';
import { ResponseUtil } from '../../utils/response.util';
import { AppError } from '../../middlewares/errorHandler';
import { ERROR_CODES } from '../../utils';
import { ICreateVisitorDTO } from '../../types/visitor/visitor.types';
import { ICreateAppointmentDTO } from '../../types/appointment/appointment.types';

export class AppointmentBookingLinkController {
  static createAppointmentLink = async (
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    if (!req.user) throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);

    const { visitorEmail, employeeId, expiresInDays } = req.body;
    if (!visitorEmail || !employeeId) {
      throw new AppError('Visitor email and employee ID are required', ERROR_CODES.BAD_REQUEST);
    }

    const link = await AppointmentBookingLinkService.createAppointmentLink(
      { visitorEmail, employeeId, expiresInDays },
      req.user._id.toString()
    );

    ResponseUtil.success(res, 'Appointment link created and email sent successfully', link, 201);
  };

  static getAppointmentLinkByToken = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    const { token } = req.params;
    if (!token) throw new AppError('Token is required', ERROR_CODES.BAD_REQUEST);

    // Decode the token in case it's URL encoded
    const decodedToken = decodeURIComponent(token);

    const link = await AppointmentBookingLinkService.getAppointmentLinkByToken(decodedToken);
    ResponseUtil.success(res, 'Appointment link retrieved successfully', link);
  };

  static getAllAppointmentLinks = async (
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    if (!req.user) throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);

    const { page, limit, isBooked, search, sortBy, sortOrder } = req.query;
    const query = {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      isBooked: isBooked === 'true' ? true : isBooked === 'false' ? false : undefined,
      search: search as string | undefined,
      sortBy: sortBy as string | undefined,
      sortOrder: sortOrder as 'asc' | 'desc' | undefined,
    };

    const result = await AppointmentBookingLinkService.getAllAppointmentLinks(query, req.user._id.toString());
    ResponseUtil.success(res, 'Appointment links retrieved successfully', result);
  };

  static deleteAppointmentLink = async (
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    if (!req.user) throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);

    const { id } = req.params;
    if (!id) throw new AppError('Link ID is required', ERROR_CODES.BAD_REQUEST);

    await AppointmentBookingLinkService.deleteAppointmentLink(id, req.user._id.toString());
    ResponseUtil.success(res, 'Appointment link deleted successfully', null, 204);
  };

  static markAsBooked = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    const { token } = req.params;
    if (!token) throw new AppError('Token is required', ERROR_CODES.BAD_REQUEST);

    await AppointmentBookingLinkService.markAsBooked(token);
    ResponseUtil.success(res, 'Appointment link marked as booked', null, 200);
  };

  static createVisitorThroughLink = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const { token } = req.params;
      const visitorData: ICreateVisitorDTO = req.body;

      if (!token) throw new AppError('Token is required', ERROR_CODES.BAD_REQUEST);
      if (!visitorData?.email) throw new AppError('Visitor email is required', ERROR_CODES.BAD_REQUEST);

      const link = await AppointmentBookingLinkService.getAppointmentLinkByToken(token);
      if (!link) throw new AppError('Invalid appointment link', ERROR_CODES.NOT_FOUND);

      const normalizedLinkEmail = link.visitorEmail.toLowerCase().trim();
      const normalizedVisitorEmail = visitorData.email.toLowerCase().trim();

      if (normalizedLinkEmail !== normalizedVisitorEmail) {
        throw new AppError(
          `Visitor email must match the email used in the appointment link. Expected: ${link.visitorEmail}, Provided: ${visitorData.email}`,
          ERROR_CODES.BAD_REQUEST
        );
      }

      const createdBy = await AppointmentBookingLinkService.getLinkCreatorId(token);
      if (!createdBy) throw new AppError('Failed to get appointment link creator', ERROR_CODES.INTERNAL_SERVER_ERROR);

      // Check creator subscription limits
      await UserSubscriptionService.checkPlanLimits(createdBy, 'visitors');

      const visitor = await VisitorService.createVisitor(visitorData, createdBy);
      if (!visitor?._id) throw new AppError('Failed to create visitor', ERROR_CODES.INTERNAL_SERVER_ERROR);

      await AppointmentBookingLinkService.updateVisitorId(token, visitor._id);
      ResponseUtil.success(res, 'Visitor created successfully', visitor, 201);
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        error?.message || 'Failed to create visitor through appointment link',
        ERROR_CODES.INTERNAL_SERVER_ERROR
      );
    }
  };

  static checkVisitorExists = async (
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    if (!req.user) throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);

    const { email } = req.query;
    if (!email || typeof email !== 'string') throw new AppError('Email is required', ERROR_CODES.BAD_REQUEST);

    const result = await AppointmentBookingLinkService.checkVisitorExists(email, req.user._id.toString());
    ResponseUtil.success(res, 'Visitor check completed', result);
  };

  static createAppointmentThroughLink = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    const { token } = req.params;
    const appointmentData: ICreateAppointmentDTO = req.body;

    if (!token) throw new AppError('Token is required', ERROR_CODES.BAD_REQUEST);

    const appointment = await AppointmentBookingLinkService.createAppointmentThroughLink(token, appointmentData);
    ResponseUtil.success(res, 'Appointment created successfully', appointment, 201);
  };
}

