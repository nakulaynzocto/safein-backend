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
  private static getBaseUrl(): string {
    const url = process.env.APPOINTMENT_BOOKING_LINK_BASE_URL || process.env.FRONTEND_URL || '';
    return url.replace(/\/$/, ''); // Remove trailing slash
  }

  /**
   * Generate a secure random token
   */
  private static generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

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
      visitorEmail: visitorEmail.toLowerCase().trim(),
      employeeId: toObjectId(employeeId),
      secureToken: token,
      expiresAt,
      createdBy: toObjectId(createdBy),
      isBooked: false,
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
      console.error('Failed to send appointment link email:', error.message);
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
      .lean();

    if (!link) {
      throw new AppError('Appointment link not found', ERROR_CODES.NOT_FOUND);
    }

    // Check if link has expired
    if (new Date(link.expiresAt) < new Date()) {
      throw new AppError('Appointment link has expired', ERROR_CODES.BAD_REQUEST);
    }

    return link;
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

    return {
      links,
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

    return (link.createdBy as any).toString();
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

    if (!link.visitorId) {
      throw new AppError('Visitor not associated with this link', ERROR_CODES.BAD_REQUEST);
    }

    // Use the employee and visitor from the link
    const appointmentPayload: ICreateAppointmentDTO = {
      ...appointmentData,
      employeeId: (link.employeeId as any)._id.toString(),
      visitorId: (link.visitorId as any)._id.toString(),
    };

    // Get creator ID from link
    const createdBy = (link.createdBy as any).toString();

    // Create appointment
    const appointment = await AppointmentService.createAppointment(appointmentPayload, createdBy);

    // Mark link as booked
    await this.markAsBooked(token);

    return appointment;
  }
}

