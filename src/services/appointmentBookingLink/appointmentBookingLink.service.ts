import { AppointmentBookingLink } from '../../models/appointmentBookingLink/appointmentBookingLink.model';
import { Employee } from '../../models/employee/employee.model';
import { Visitor } from '../../models/visitor/visitor.model';
import { User } from '../../models/user/user.model';
import { EmailService } from '../email/email.service';
import { AppointmentService } from '../appointment/appointment.service';
import { EmployeeUtil } from '../../utils/employee.util';
import { ERROR_CODES } from '../../utils/constants';
import { AppError } from '../../middlewares/errorHandler';
import * as crypto from 'crypto';
import { toObjectId } from '../../utils/idExtractor.util';
import { escapeRegex } from '../../utils/string.util';
import { ICreateAppointmentDTO } from '../../types/appointment/appointment.types';
import { UserSubscriptionService } from '../userSubscription/userSubscription.service';

interface ICreateAppointmentLinkDTO {
  visitorEmail: string;
  employeeId: string;
  expiresInDays?: number;
}

interface IGetAllAppointmentLinksQuery {
  page?: number;
  limit?: number;
  isBooked?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class AppointmentBookingLinkService {
  /**
   * Create an appointment booking link
   */
  static async createAppointmentLink(
    data: ICreateAppointmentLinkDTO,
    createdBy: string
  ): Promise<{ token: string; link: string; expiresAt: Date }> {
    const { visitorEmail, employeeId, expiresInDays = 7 } = data;

    // Validate employee exists
    const employee = await Employee.findOne({ _id: employeeId, isDeleted: false });
    if (!employee) {
      throw new AppError('Employee not found', ERROR_CODES.NOT_FOUND);
    }

    // Check if visitor exists by email
    // Visitors belong to admin, so check by admin's userId, not employee's userId
    const normalizedEmail = visitorEmail.toLowerCase().trim();
    let visitorId: any = null;

    // Get admin's userId (if createdBy is employee, get their admin's ID)
    const adminUserId = await EmployeeUtil.getAdminId(createdBy);
    const adminUserIdObjectId = toObjectId(adminUserId);

    if (adminUserIdObjectId) {
      const existingVisitor = await Visitor.findOne({
        email: normalizedEmail,
        createdBy: adminUserIdObjectId, // Check by admin's userId, not employee's
        isDeleted: false,
      })
        .select('_id')
        .lean();

      if (existingVisitor && existingVisitor._id) {
        visitorId = toObjectId(existingVisitor._id.toString());
      }
    }

    // Generate unique token
    let token: string = '';
    let isUnique = false;

    while (!isUnique) {
      token = this.generateToken();
      const existing = await AppointmentBookingLink.findOne({ secureToken: token });
      if (!existing) {
        isUnique = true;
      }
    }

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setTime(expiresAt.getTime() + expiresInDays * 24 * 60 * 60 * 1000);

    // Create appointment booking link
    // Note: createdBy can be employee's userId or admin's userId
    // We store it as-is for tracking who created the link
    const createdByObjectId = toObjectId(createdBy);
    const appointmentLink = new AppointmentBookingLink({
      visitorEmail: normalizedEmail,
      employeeId: toObjectId(employeeId),
      secureToken: token,
      expiresAt,
      createdBy: createdByObjectId,
      isBooked: false,
      visitorId: visitorId, // Set visitorId if visitor exists
    });

    await appointmentLink.save();

    const baseUrl = this.getBaseUrl();
    const link = `${baseUrl}/book-appointment/${token}`;

    // Get company name from user (createdBy) for email fromName
    let companyName: string | undefined;
    try {
      const user = await User.findById(createdBy).select('companyName').lean();
      companyName = user?.companyName;
    } catch (error) {
      // If user not found or error, companyName will remain undefined
      console.warn('Failed to fetch company name for email fromName:', error);
    }

    // Send email to visitor
    try {
      await EmailService.sendAppointmentLinkEmail(
        visitorEmail,
        (employee as any).name || 'Employee',
        link,
        expiresAt,
        companyName
      );
    } catch (error: any) {
      // Continue even if email fails
    }

    return { token, link, expiresAt };
  }

  /**
   * Get appointment link by token
   */
  static async getAppointmentLinkByToken(token: string): Promise<any> {
    const link = await AppointmentBookingLink.findOne({ secureToken: token })
      .populate('employeeId', 'name email phone department designation')
      .populate('visitorId', 'name email phone')
      .populate('createdBy', 'companyName profilePicture')
      .lean();

    if (!link) {
      throw new AppError('Appointment link not found', ERROR_CODES.NOT_FOUND);
    }

    // Check if link has already been used
    if (link.isBooked) {
      throw new AppError('Appointment link has expired', ERROR_CODES.BAD_REQUEST);
    }

    // Check if link has expired
    if (new Date(link.expiresAt) < new Date()) {
      throw new AppError('Appointment link has expired', ERROR_CODES.BAD_REQUEST);
    }

    // Check if visitorId already exists (from populated or direct)
    const existingVisitorId = this.getVisitorIdString(link.visitorId);

    if (existingVisitorId) {
      // Visitor already associated with link
      const populatedVisitor = link.visitorId && typeof link.visitorId === 'object'
        ? link.visitorId
        : null;

      return {
        ...link,
        visitorId: existingVisitorId,
        visitor: populatedVisitor || undefined,
      };
    }

    // If link doesn't have visitorId, check if visitor exists by email
    if (link.visitorEmail && link.createdBy) {
      const createdByIdString = this.getCreatedByIdString(link.createdBy);
      const createdByObjectId = toObjectId(createdByIdString || undefined);
      if (createdByObjectId) {
        const visitor = await Visitor.findOne({
          email: link.visitorEmail.toLowerCase().trim(),
          createdBy: createdByObjectId,
          isDeleted: false,
        })
          .select('_id name email phone')
          .lean();

        if (visitor && visitor._id) {
          const visitorObjectId = toObjectId(visitor._id.toString());
          if (visitorObjectId) {
            // Update the link document with visitorId
            const linkDocument = await AppointmentBookingLink.findById(link._id);
            if (linkDocument) {
              linkDocument.visitorId = visitorObjectId;
              await linkDocument.save();
            }
          }

          return {
            ...link,
            visitorId: visitor._id.toString(),
            visitor: visitor,
          };
        }
      }
    }

    // No visitor found, return link without visitorId
    return {
      ...link,
      visitorId: null,
      visitor: undefined,
    };
  }

  /**
   * Get all appointment links with pagination
   */
  static async getAllAppointmentLinks(
    query: IGetAllAppointmentLinksQuery,
    userId: string
  ): Promise<any> {
    const {
      page = 1,
      limit = 10,
      isBooked,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    // Resolve admin ID to check if user is admin or employee
    // If user is employee, getAdminId returns their admin's ID
    // If user is admin, getAdminId returns their own ID
    const adminId = await EmployeeUtil.getAdminId(userId);

    const filter: any = {};

    // Check if current user is the admin
    if (userId === adminId) {
      // User is Admin: Show links created by Admin AND all their Employees

      // 1. Get all employees created by this admin
      // 1. Get all employees created by this admin
      const employees = await Employee.find({
        createdBy: toObjectId(adminId),
        isDeleted: false
      }).select('email');

      const employeeEmails = employees.map(emp => emp.email);

      // 2. Find User IDs for these employees
      // Appointment links are created with User ID, not Employee ID
      const employeeUsers = await User.find({
        email: { $in: employeeEmails }
      }).select('_id');

      const employeeUserIds = employeeUsers.map(user => user._id);

      // 3. Filter links created by Admin or any of their Employees (using User IDs)
      filter.createdBy = {
        $in: [toObjectId(adminId), ...employeeUserIds]
      };
    } else {
      // User is Employee: Show only links created by this Employee
      filter.createdBy = toObjectId(userId);
    }

    if (isBooked !== undefined) {
      filter.isBooked = isBooked;
    }

    if (search) {
      const escapedSearch = escapeRegex(search);
      filter.$or = [
        { visitorEmail: { $regex: escapedSearch, $options: 'i' } },
        { secureToken: { $regex: escapedSearch, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [links, totalLinks] = await Promise.all([
      AppointmentBookingLink.find(filter)
        .populate('employeeId', 'name email phone department')
        .populate('visitorId', 'name email phone')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      AppointmentBookingLink.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalLinks / limit);
    const baseUrl = this.getBaseUrl();

    // Add bookingUrl to each link
    const linksWithBookingUrl = links.map((link: any) => ({
      ...link,
      bookingUrl: `${baseUrl}/book-appointment/${link.secureToken}`,
    }));

    return {
      links: linksWithBookingUrl,
      pagination: {
        currentPage: page,
        totalPages,
        totalLinks,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Resend appointment link email
   */
  static async resendLink(id: string, userId: string): Promise<void> {
    const link = await AppointmentBookingLink.findById(id).populate('employeeId');

    if (!link) {
      throw new AppError('Appointment link not found', ERROR_CODES.NOT_FOUND);
    }

    if (link.isBooked) {
      throw new AppError('Appointment link has already been used', ERROR_CODES.BAD_REQUEST);
    }

    if (new Date(link.expiresAt) < new Date()) {
      throw new AppError('Appointment link has expired', ERROR_CODES.BAD_REQUEST);
    }

    const baseUrl = this.getBaseUrl();
    const bookingUrl = `${baseUrl}/book-appointment/${link.secureToken}`;

    // Get company name from Admin
    const adminId = await EmployeeUtil.getAdminId(userId);
    const adminUser = await User.findById(adminId).select('companyName').lean();
    const companyName = adminUser?.companyName;

    // Send email to visitor
    await EmailService.sendAppointmentLinkEmail(
      link.visitorEmail,
      (link.employeeId as any).name || 'Employee',
      bookingUrl,
      link.expiresAt,
      companyName
    );
  }

  /**
   * Delete appointment link
   */
  static async deleteAppointmentLink(id: string, createdBy: string): Promise<void> {
    const link = await AppointmentBookingLink.findOne({
      _id: id,
      createdBy: toObjectId(createdBy),
    });

    if (!link) {
      throw new AppError('Appointment link not found', ERROR_CODES.NOT_FOUND);
    }

    await AppointmentBookingLink.deleteOne({ _id: id });
  }

  /**
   * Mark appointment link as booked
   */
  static async markAsBooked(token: string): Promise<void> {
    const link = await AppointmentBookingLink.findOne({ secureToken: token });

    if (!link) {
      throw new AppError('Appointment link not found', ERROR_CODES.NOT_FOUND);
    }

    link.isBooked = true;
    await link.save();
  }

  /**
   * Get link creator ID by token
   */
  static async getLinkCreatorId(token: string): Promise<string | null> {
    const link = await AppointmentBookingLink.findOne({ secureToken: token })
      .select('createdBy')
      .lean();

    if (!link) {
      return null;
    }

    const createdByIdString = this.getCreatedByIdString(link.createdBy);
    return createdByIdString;
  }


  /**
   * Update visitor ID in appointment link
   */
  static async updateVisitorId(token: string, visitorId: string): Promise<void> {
    const link = await AppointmentBookingLink.findOne({ secureToken: token });

    if (!link) {
      throw new AppError('Appointment link not found', ERROR_CODES.NOT_FOUND);
    }

    const visitorObjectId = toObjectId(visitorId);
    if (visitorObjectId) {
      link.visitorId = visitorObjectId;
      await link.save();
    }
  }

  /**
   * Check if visitor exists
   * Checks by admin's userId (not employee's userId)
   * Visitors belong to admin, so we check across all employees of that admin
   */
  static async checkVisitorExists(
    email: string,
    createdBy: string
  ): Promise<{ exists: boolean; visitor?: any }> {
    // Get admin's userId (if createdBy is employee, get their admin's ID)
    const adminUserId = await EmployeeUtil.getAdminId(createdBy);
    const adminUserIdObjectId = toObjectId(adminUserId);

    if (!adminUserIdObjectId) {
      return { exists: false, visitor: undefined };
    }

    const visitor = await Visitor.findOne({
      email: email.toLowerCase().trim(),
      createdBy: adminUserIdObjectId, // Check by admin's userId, not employee's
      isDeleted: false,
    })
      .select('name email phone')
      .lean();

    return {
      exists: !!visitor,
      visitor: visitor || undefined,
    };
  }

  /**
   * Create appointment through link
   */
  static async createAppointmentThroughLink(
    token: string,
    appointmentData: ICreateAppointmentDTO
  ): Promise<any> {
    const link = await AppointmentBookingLink.findOne({ secureToken: token })
      .populate('employeeId')
      .populate('visitorId');

    if (!link) {
      throw new AppError('Appointment link not found', ERROR_CODES.NOT_FOUND);
    }

    if (link.isBooked) {
      throw new AppError('Appointment link has already been used', ERROR_CODES.BAD_REQUEST);
    }

    if (new Date(link.expiresAt) < new Date()) {
      throw new AppError('Appointment link has expired', ERROR_CODES.BAD_REQUEST);
    }

    // Check if visitorId is already set (from populated or direct)
    let visitorIdString = this.getVisitorIdString(link.visitorId);

    // If visitorId is not set, try to find visitor by email and update the link
    // Visitors belong to admin, so check by admin's userId, not employee's userId
    if (!visitorIdString && link.visitorEmail && link.createdBy) {
      const createdByIdString = this.getCreatedByIdString(link.createdBy);
      if (createdByIdString) {
        // Get admin's userId (if createdBy is employee, get their admin's ID)
        const adminUserId = await EmployeeUtil.getAdminId(createdByIdString);
        const adminUserIdObjectId = toObjectId(adminUserId);

        if (adminUserIdObjectId) {
          const visitor = await Visitor.findOne({
            email: link.visitorEmail.toLowerCase().trim(),
            createdBy: adminUserIdObjectId, // Check by admin's userId, not employee's
            isDeleted: false,
          })
            .select('_id')
            .lean();

          if (visitor && visitor._id) {
            const visitorObjectId = toObjectId(visitor._id.toString());
            if (visitorObjectId) {
              // Update the link document with visitorId
              const linkDocument = await AppointmentBookingLink.findById(link._id);
              if (linkDocument) {
                linkDocument.visitorId = visitorObjectId;
                await linkDocument.save();
                visitorIdString = visitor._id.toString();
              }
            }
          }
        }
      }
    }

    if (!visitorIdString) {
      throw new AppError('Visitor not associated with this link', ERROR_CODES.BAD_REQUEST);
    }

    const appointmentPayload: ICreateAppointmentDTO = {
      ...appointmentData,
      employeeId: this.getEmployeeIdString(link.employeeId),
      visitorId: visitorIdString,
    };

    // Get creator ID from link
    const createdBy = this.getCreatedByIdString(link.createdBy);
    if (!createdBy) {
      throw new AppError('Invalid appointment link creator', ERROR_CODES.BAD_REQUEST);
    }

    // Check if link was created by an employee
    const user = await User.findById(createdBy).select('_id roles employeeId email').lean();
    const isLinkCreatedByEmployee = user?.roles?.includes('employee') || false;

    // Create appointment
    // Get admin user ID (if createdBy is employee, use their admin's ID)
    const adminUserId = await EmployeeUtil.getAdminId(createdBy);

    // Check admin's subscription limits (not employee's)
    await UserSubscriptionService.checkPlanLimits(adminUserId, 'appointments');

    // If link was created by employee, set status to 'approved' automatically
    // Otherwise, status will be 'pending' (default)
    if (isLinkCreatedByEmployee) {
      appointmentPayload.status = 'approved';
    }

    // Visitor is creating appointment via link, so both admin and employee should be notified
    const appointment = await AppointmentService.createAppointment(appointmentPayload, createdBy, {
      sendNotifications: true,
      createdByVisitor: true, // Flag to indicate visitor created via link
      adminUserId: adminUserId // Pass admin user ID for notifications
    });

    // Mark link as booked
    await this.markAsBooked(token);

    return appointment;
  }

  /**
   * Helper: Convert visitorId to string format
   */
  private static getVisitorIdString(visitorId: any): string | null {
    if (!visitorId) return null;
    if (typeof visitorId === 'string') return visitorId;
    if (typeof visitorId === 'object' && visitorId._id) {
      return visitorId._id.toString();
    }
    if (typeof visitorId === 'object' && visitorId.toString) {
      return visitorId.toString();
    }
    return null;
  }

  /**
   * Helper: Convert employeeId to string format
   */
  private static getEmployeeIdString(employeeId: any): string {
    if (typeof employeeId === 'string') return employeeId;
    if (typeof employeeId === 'object' && employeeId._id) {
      return employeeId._id.toString();
    }
    if (typeof employeeId === 'object' && employeeId.toString) {
      return employeeId.toString();
    }
    throw new AppError('Invalid employee ID', ERROR_CODES.BAD_REQUEST);
  }

  /**
   * Helper: Convert createdBy to string format
   */
  private static getCreatedByIdString(createdBy: any): string | null {
    if (!createdBy) return null;
    if (typeof createdBy === 'string') return createdBy;
    if (typeof createdBy === 'object' && createdBy._id) {
      return createdBy._id.toString();
    }
    if (typeof createdBy === 'object' && createdBy.toString) {
      // Check if it's a MongoDB ObjectId
      const str = createdBy.toString();
      // If toString() returns [object Object], it means it's not a proper ObjectId
      if (str === '[object Object]') {
        return null;
      }
      return str;
    }
    return null;
  }

  /**
   * Helper: Get base URL for appointment links
   */
  private static getBaseUrl(): string {
    const url = process.env.FRONTEND_URL || 'http://localhost:3000';
    const cleanUrl = url.replace(/\/$/, '');

    if (!cleanUrl || cleanUrl === '') {
      return 'http://localhost:3000';
    }

    return cleanUrl;
  }

  /**
   * Helper: Generate a secure random token
   */
  private static generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

