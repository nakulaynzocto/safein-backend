import { AppointmentBookingLink } from '../../models/appointmentBookingLink/appointmentBookingLink.model';
import { Employee } from '../../models/employee/employee.model';
import { Visitor } from '../../models/visitor/visitor.model';
import { EmailService } from '../email/email.service';
import { AppointmentService } from '../appointment/appointment.service';
import { ERROR_CODES } from '../../utils/constants';
import { AppError } from '../../middlewares/errorHandler';
import * as crypto from 'crypto';
import { toObjectId } from '../../utils/idExtractor.util';
import { escapeRegex } from '../../utils/string.util';
import { ICreateAppointmentDTO } from '../../types/appointment/appointment.types';

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
    const normalizedEmail = visitorEmail.toLowerCase().trim();
    const createdByObjectId = toObjectId(createdBy);
    let visitorId: any = null;

    if (createdByObjectId) {
      const existingVisitor = await Visitor.findOne({
        email: normalizedEmail,
        createdBy: createdByObjectId,
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
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Create appointment booking link
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

    // Send email to visitor
    try {
      await EmailService.sendAppointmentLinkEmail(
        visitorEmail,
        (employee as any).name || 'Employee',
        link,
        expiresAt
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
      .populate('visitorId', 'name email phone company designation')
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
          .select('_id name email phone company designation')
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
    createdBy: string
  ): Promise<any> {
    const {
      page = 1,
      limit = 10,
      isBooked,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filter: any = {
      createdBy: toObjectId(createdBy),
    };

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
        .populate('visitorId', 'name email phone company')
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
   */
  static async checkVisitorExists(
    email: string,
    createdBy: string
  ): Promise<{ exists: boolean; visitor?: any }> {
    const visitor = await Visitor.findOne({
      email: email.toLowerCase().trim(),
      createdBy: toObjectId(createdBy),
      isDeleted: false,
    })
      .select('name email phone company designation')
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
    if (!visitorIdString && link.visitorEmail && link.createdBy) {
      const createdByIdString = this.getCreatedByIdString(link.createdBy);
      const createdByObjectId = toObjectId(createdByIdString || undefined);
      if (createdByObjectId) {
        const visitor = await Visitor.findOne({
          email: link.visitorEmail.toLowerCase().trim(),
          createdBy: createdByObjectId,
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

    // Create appointment
    const appointment = await AppointmentService.createAppointment(appointmentPayload, createdBy, { sendNotifications: true });

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
    const url = process.env.APPROVAL_LINK_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
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

