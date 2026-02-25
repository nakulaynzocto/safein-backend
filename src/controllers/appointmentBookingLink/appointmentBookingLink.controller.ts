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
import { EmployeeUtil } from '../../utils/employee.util';
import { Visitor } from '../../models/visitor/visitor.model';
import { toObjectId } from '../../utils/idExtractor.util';

export class AppointmentBookingLinkController {
  static createAppointmentLink = async (
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    if (!req.user) throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);

    const { visitorEmail, visitorPhone, employeeId, expiresInDays } = req.body;
    if (!visitorPhone || !employeeId) {
      throw new AppError('Visitor phone and employee ID are required', ERROR_CODES.BAD_REQUEST);
    }

    const link = await AppointmentBookingLinkService.createAppointmentLink(
      { visitorEmail, visitorPhone, employeeId, expiresInDays },
      req.user._id.toString()
    );

    ResponseUtil.success(res, 'Appointment link created and sent successfully', link, 201);
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

  static resendLink = async (
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    if (!req.user) throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);

    const { id } = req.params;
    if (!id) throw new AppError('Link ID is required', ERROR_CODES.BAD_REQUEST);

    await AppointmentBookingLinkService.resendLink(id, req.user._id.toString());
    ResponseUtil.success(res, 'Appointment link resent successfully');
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

      // Get the admin's userId (for subscription check and visitor ownership)
      // If createdBy is an employee, get their admin's ID; otherwise use createdBy (admin)
      const adminUserId = await EmployeeUtil.getAdminId(createdBy);

      // Check if visitor already exists for this admin (not for the employee)
      // Visitors belong to admin, so check by admin's userId, not employee's userId
      const adminUserIdObjectId = toObjectId(adminUserId);

      // Normalize email to ensure consistent comparison
      const normalizedEmail = normalizedVisitorEmail.toLowerCase().trim();

      let visitor;
      if (adminUserIdObjectId) {
        // First, check if visitor already exists for this admin
        // Use findOne without lean() to ensure we see the latest data
        const existingVisitor = await Visitor.findOne({
          email: normalizedEmail,
          createdBy: adminUserIdObjectId, // Check by admin's userId, not employee's
          isDeleted: false,
        });

        if (existingVisitor && existingVisitor._id) {
          // Visitor already exists for this admin - reuse it instead of creating duplicate
          visitor = existingVisitor.toObject ? existingVisitor.toObject() : existingVisitor;
        } else {
          // Check admin's subscription limits only when creating new visitor (not employee's)
          await UserSubscriptionService.checkPlanLimits(adminUserId, 'visitors');

          // Ensure email is normalized in visitorData
          const normalizedVisitorData = {
            ...visitorData,
            email: normalizedEmail,
          };

          // Try to create new visitor with admin's userId as createdBy (not employee's userId)
          // This ensures all visitors belong to the admin, not individual employees
          try {
            visitor = await VisitorService.createVisitor(normalizedVisitorData, adminUserId);
            if (!visitor?._id) throw new AppError('Failed to create visitor', ERROR_CODES.INTERNAL_SERVER_ERROR);
          } catch (createError: any) {
            // Handle race condition: if duplicate error occurs (another request created it simultaneously),
            // fetch and return the existing visitor instead of throwing error
            const isDuplicateError =
              createError.code === 11000 ||
              createError.message?.includes('duplicate') ||
              createError.message?.includes('VISITOR_EMAIL_EXISTS') ||
              (createError instanceof AppError && createError.statusCode === 409);

            if (isDuplicateError) {
              // Duplicate key error or conflict - visitor was created by another concurrent request
              // Wait a small moment for the other transaction to commit, then retry
              await new Promise(resolve => setTimeout(resolve, 100));

              const existingVisitorAfterError = await Visitor.findOne({
                email: normalizedEmail,
                createdBy: adminUserIdObjectId,
                isDeleted: false,
              });

              if (existingVisitorAfterError && existingVisitorAfterError._id) {
                // Return the existing visitor that was created by the other request
                visitor = existingVisitorAfterError.toObject ? existingVisitorAfterError.toObject() : existingVisitorAfterError;
              } else {
                // If still not found, rethrow the original error
                throw createError;
              }
            } else {
              // For other errors, rethrow
              throw createError;
            }
          }
        }
      } else {
        // Check admin's subscription limits (not employee's)
        await UserSubscriptionService.checkPlanLimits(adminUserId, 'visitors');

        // Ensure email is normalized in visitorData
        const normalizedVisitorData = {
          ...visitorData,
          email: normalizedEmail,
        };

        // Try to create new visitor with admin's userId as createdBy
        try {
          visitor = await VisitorService.createVisitor(normalizedVisitorData, adminUserId);
          if (!visitor?._id) throw new AppError('Failed to create visitor', ERROR_CODES.INTERNAL_SERVER_ERROR);
        } catch (createError: any) {
          // Handle race condition: if duplicate error occurs, fetch and return existing visitor
          const isDuplicateError =
            createError.code === 11000 ||
            createError.message?.includes('duplicate') ||
            createError.message?.includes('VISITOR_EMAIL_EXISTS') ||
            (createError instanceof AppError && createError.statusCode === 409);

          if (isDuplicateError) {
            const adminUserIdObjectId = toObjectId(adminUserId);
            if (adminUserIdObjectId) {
              // Wait a small moment for the other transaction to commit, then retry
              await new Promise(resolve => setTimeout(resolve, 100));

              const existingVisitorAfterError = await Visitor.findOne({
                email: normalizedEmail,
                createdBy: adminUserIdObjectId,
                isDeleted: false,
              });

              if (existingVisitorAfterError && existingVisitorAfterError._id) {
                visitor = existingVisitorAfterError.toObject ? existingVisitorAfterError.toObject() : existingVisitorAfterError;
              } else {
                throw createError;
              }
            } else {
              throw createError;
            }
          } else {
            throw createError;
          }
        }
      }

      // Update link with visitorId (whether existing or newly created)
      const visitorId = (visitor._id as any)?.toString() || visitor._id?.toString();
      if (!visitorId) throw new AppError('Failed to get visitor ID', ERROR_CODES.INTERNAL_SERVER_ERROR);
      await AppointmentBookingLinkService.updateVisitorId(token, visitorId);
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

    const { email, phone } = req.query;

    const result = await AppointmentBookingLinkService.checkVisitorExists(
      email as string | undefined,
      phone as string | undefined,
      req.user._id.toString()
    );
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

