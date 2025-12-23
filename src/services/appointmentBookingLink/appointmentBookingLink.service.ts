import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { AppointmentBookingLink } from '../../models/appointmentBookingLink/appointmentBookingLink.model';
import { Visitor } from '../../models/visitor/visitor.model';
import { Employee } from '../../models/employee/employee.model';
import { AppError } from '../../middlewares/errorHandler';
import { ERROR_CODES } from '../../utils';
import { EmailService } from '../email/email.service';
import { AppointmentService } from '../appointment/appointment.service';
import { encryptToken, decryptToken } from '../../utils/tokenEncryption.util';
import { extractIdString, toObjectId } from '../../utils/idExtractor.util';

export interface ICreateAppointmentLinkDTO {
  visitorEmail: string;
  employeeId: string;
  expiresInDays?: number;
}

export interface IAppointmentLinkResponse {
  _id: string;
  visitorId?: string;
  visitorEmail: string;
  employeeId: string;
  employee?: {
    _id: string;
    name: string;
    email: string;
  };
  secureToken: string;
  isBooked: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  bookingUrl: string;
}

export interface IGetAppointmentLinksQuery {
  page?: number;
  limit?: number;
  isBooked?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IAppointmentLinkListResponse {
  links: IAppointmentLinkResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    totalBooked: number;
    totalNotBooked: number;
  };
}

export class AppointmentBookingLinkService {
  private static readonly DEFAULT_EXPIRY_DAYS = 30;
  private static readonly FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

  private static generateSecureToken = (): string => {
    const token = uuidv4();
    if (!token?.trim()) {
      throw new AppError('Failed to generate secure token', ERROR_CODES.INTERNAL_SERVER_ERROR);
    }
    return token;
  };

  static checkVisitorExists = async (email: string, userId: string): Promise<{ exists: boolean; visitorId?: string }> => {
    const normalizedEmail = email?.toLowerCase().trim();
    if (!normalizedEmail || !userId) return { exists: false };

    try {
      const userIdObjectId = new mongoose.Types.ObjectId(userId);
      const visitor = await Visitor.findOne({
        email: normalizedEmail,
        createdBy: userIdObjectId,
        isDeleted: false,
      }).lean();

      return visitor ? { exists: true, visitorId: visitor._id.toString() } : { exists: false };
    } catch {
      return { exists: false };
    }
  };

  static async createAppointmentLink(
    data: ICreateAppointmentLinkDTO,
    userId: string
  ): Promise<IAppointmentLinkResponse> {
    const { visitorEmail, employeeId, expiresInDays = this.DEFAULT_EXPIRY_DAYS } = data;

    const normalizedEmail = visitorEmail.toLowerCase().trim();

    const employee = await Employee.findOne({ _id: employeeId, isDeleted: false });
    if (!employee) {
      throw new AppError('Employee not found', ERROR_CODES.NOT_FOUND);
    }

    const visitorCheck = await this.checkVisitorExists(normalizedEmail, userId);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    expiresAt.setHours(23, 59, 59, 999);

    let appointmentLink;
    let secureToken: string | null = null;
    let retries = 3;
    
    while (retries > 0) {
      try {
        secureToken = this.generateSecureToken();

        if (!secureToken || secureToken.trim() === '') {
          throw new AppError('Failed to generate secure token', ERROR_CODES.INTERNAL_SERVER_ERROR);
        }

        const linkData = {
          ...(visitorCheck.visitorId && { visitorId: visitorCheck.visitorId }),
          visitorEmail: normalizedEmail,
          employeeId,
          secureToken: secureToken.trim(),
          isBooked: false,
          expiresAt,
          createdBy: userId,
        };

        appointmentLink = new AppointmentBookingLink(linkData);

        if (!appointmentLink.secureToken || appointmentLink.secureToken.trim() === '') {
          throw new AppError('Secure token is missing', ERROR_CODES.INTERNAL_SERVER_ERROR);
        }

        await appointmentLink.save();
        break;
      } catch (error: any) {
        if (error.code === 11000 && (error.keyPattern?.secureToken || error.keyPattern?.token)) {
          retries--;
          if (retries === 0) {
            const errorDetails = error.keyPattern 
              ? `Duplicate key on: ${Object.keys(error.keyPattern).join(', ')}`
              : 'Duplicate key error';
            throw new AppError(
              `Failed to create appointment link after multiple attempts. ${errorDetails}. Please ensure the database index is properly configured.`,
              ERROR_CODES.INTERNAL_SERVER_ERROR
            );
          }
          continue;
        }
        throw error;
      }
    }

    if (!appointmentLink || !secureToken) {
      throw new AppError('Failed to create appointment link', ERROR_CODES.INTERNAL_SERVER_ERROR);
    }

    const encryptedToken = encryptToken(secureToken);
    const bookingUrl = `${this.FRONTEND_URL}/book-appointment/${encryptedToken}`;

    const linkData = {
      ...appointmentLink.toObject(),
      bookingUrl,
      encryptedToken,
      employee: {
        _id: (employee._id as any).toString(),
        name: employee.name,
        email: employee.email,
      },
      employeeId: (appointmentLink.employeeId as any).toString(),
    };

    await EmailService.sendAppointmentLinkEmail(
      normalizedEmail,
      employee.name,
      bookingUrl,
      expiresAt
    );

    return linkData as IAppointmentLinkResponse;
  }

  private static decryptTokenIfNeeded = (token: string): string => {
    if (!token?.trim()) return token;
    
    const decodedToken = (() => {
      try {
        return decodeURIComponent(token);
      } catch {
        return token;
      }
    })();
    
    try {
      return decryptToken(decodedToken);
    } catch {
      return decodedToken.startsWith('enc:') && decodedToken.split(':').length === 4 
        ? decodedToken 
        : decodedToken;
    }
  };

  static async getAppointmentLinkByToken(token: string): Promise<IAppointmentLinkResponse> {
    if (!token || token.trim() === '') {
      throw new AppError('Token is required', ERROR_CODES.BAD_REQUEST);
    }
    
    const cleanToken = token.trim();
    const decryptedToken = this.decryptTokenIfNeeded(cleanToken);
    
    let link = await AppointmentBookingLink.findOne({ secureToken: decryptedToken })
      .populate('employeeId', 'name email')
      .populate('visitorId', 'name email phone company designation address idProof photo')
      .lean();

    if (!link && cleanToken !== decryptedToken) {
      link = await AppointmentBookingLink.findOne({ secureToken: cleanToken })
        .populate('employeeId', 'name email')
        .populate('visitorId', 'name email phone company designation address idProof photo')
        .lean();
    }

    if (!link) throw new AppError('Invalid appointment link', ERROR_CODES.NOT_FOUND);

    const now = Date.now();
    const expiresAt = new Date(link.expiresAt).getTime();
    if (now > expiresAt) {
      throw new AppError('This appointment link has expired', ERROR_CODES.BAD_REQUEST);
    }

    if (link.isBooked) {
      throw new AppError('This appointment link has already been used. Appointment has already been created.', ERROR_CODES.CONFLICT);
    }

    let resolvedVisitorId = extractIdString(link.visitorId);
    let resolvedVisitor: any = link.visitorId;

    if (!resolvedVisitorId) {
      const matchedVisitor = await Visitor.findOne({
        email: link.visitorEmail,
        createdBy: link.createdBy,
        isDeleted: false,
      }).lean();

      if (matchedVisitor?._id) {
        resolvedVisitorId = matchedVisitor._id.toString();
        resolvedVisitor = matchedVisitor;
        await AppointmentBookingLink.updateOne({ _id: link._id }, { visitorId: matchedVisitor._id });
      }
    }

    const encryptedToken = encryptToken(decryptedToken);
    const bookingUrl = `${this.FRONTEND_URL}/book-appointment/${encryptedToken}`;

    const employeeIdString = extractIdString(link.employeeId) || '';
    const visitorIdString = resolvedVisitorId || undefined;

    const formatVisitor = (visitor: any) => visitor && typeof visitor === 'object' ? {
      _id: visitor._id?.toString(),
      name: visitor.name,
      email: visitor.email,
      phone: visitor.phone,
      company: visitor.company,
      designation: visitor.designation,
      address: visitor.address,
      idProof: visitor.idProof,
      photo: visitor.photo,
    } : undefined;

    const formatEmployee = (emp: any) => emp && typeof emp === 'object' ? {
      _id: emp._id?.toString() || emp._id?.toString(),
      name: emp.name,
      email: emp.email,
    } : undefined;

    return {
      ...link,
      _id: link._id.toString(),
      visitorId: visitorIdString,
      visitor: formatVisitor(resolvedVisitor),
      employeeId: employeeIdString,
      employee: formatEmployee(link.employeeId),
      bookingUrl,
      encryptedToken,
    } as IAppointmentLinkResponse;
  }

  static async createAppointmentThroughLink(token: string, appointmentData: any): Promise<any> {
    const decryptedToken = this.decryptTokenIfNeeded(token);
    const link = await AppointmentBookingLink.findOne({ secureToken: decryptedToken })
      .populate('employeeId', 'name email')
      .lean();

    if (!link) {
      throw new AppError('Invalid appointment link', ERROR_CODES.NOT_FOUND);
    }

    if (link.isBooked) {
      throw new AppError('This appointment link has already been used', ERROR_CODES.CONFLICT);
    }

    const now = Date.now();
    const expiresAt = new Date(link.expiresAt).getTime();
    const expiryBuffer = 60 * 1000;
    if (now > expiresAt + expiryBuffer) {
      throw new AppError('This appointment link has expired', ERROR_CODES.BAD_REQUEST);
    }

    const visitorIdStr = extractIdString(appointmentData.visitorId) || extractIdString(link.visitorId);
    
    if (!visitorIdStr) {
      throw new AppError('Visitor is required to book appointment', ERROR_CODES.BAD_REQUEST);
    }

    const visitorObjectId = toObjectId(visitorIdStr);
    if (!visitorObjectId) {
      throw new AppError('Invalid visitor ID format', ERROR_CODES.BAD_REQUEST);
    }

    const visitor = await Visitor.findOne({ _id: visitorObjectId, isDeleted: false }).lean();
    if (!visitor) throw new AppError('Visitor not found', ERROR_CODES.NOT_FOUND);

    if (visitor.email.toLowerCase().trim() !== link.visitorEmail.toLowerCase().trim()) {
      throw new AppError('Visitor email does not match this appointment link', ERROR_CODES.BAD_REQUEST);
    }

    if (visitor.createdBy.toString() !== link.createdBy.toString()) {
      throw new AppError('Visitor does not belong to the appointment link creator', ERROR_CODES.BAD_REQUEST);
    }

    if (link.visitorId && link.visitorId.toString() !== visitorIdStr) {
      const updatedLink = await AppointmentBookingLink.findOne({ secureToken: decryptedToken }).lean();
      if (updatedLink?.visitorId && updatedLink.visitorId.toString() !== visitorIdStr) {
        throw new AppError('Visitor does not match this appointment link', ERROR_CODES.BAD_REQUEST);
      }
    }

    const employeeIdStr = extractIdString(link.employeeId);
    if (!employeeIdStr) {
      throw new AppError('Invalid employee ID format', ERROR_CODES.BAD_REQUEST);
    }

    const employeeObjectId = toObjectId(employeeIdStr);
    if (!employeeObjectId) {
      throw new AppError('Invalid employee ID format', ERROR_CODES.BAD_REQUEST);
    }

    const payload = { ...appointmentData, visitorId: visitorObjectId, employeeId: employeeObjectId };
    const createdBy = link.createdBy.toString();
    
    await this.markAsBooked(decryptedToken);
    
    try {
      return await AppointmentService.createAppointment(payload, createdBy);
    } catch (error) {
      await AppointmentBookingLink.updateOne({ secureToken: decryptedToken }, { isBooked: false });
      throw error;
    }
  }

  static markAsBooked = async (token: string): Promise<void> => {
    const decryptedToken = this.decryptTokenIfNeeded(token);
    const link = await AppointmentBookingLink.findOne({ secureToken: decryptedToken });

    if (!link) throw new AppError('Invalid appointment link', ERROR_CODES.NOT_FOUND);
    if (link.isBooked) throw new AppError('This appointment link has already been used', ERROR_CODES.CONFLICT);

    link.isBooked = true;
    await link.save();
  };

  static getLinkCreatorId = async (token: string): Promise<string> => {
    const decryptedToken = this.decryptTokenIfNeeded(token);
    const link = await AppointmentBookingLink.findOne({ secureToken: decryptedToken }).select('createdBy').lean();

    if (!link) throw new AppError('Invalid appointment link', ERROR_CODES.NOT_FOUND);
    if (link.isBooked) throw new AppError('This appointment link has already been used', ERROR_CODES.CONFLICT);

    const now = Date.now();
    const expiresAt = new Date(link.expiresAt).getTime();
    const expiryBuffer = 60 * 1000;
    if (now > expiresAt + expiryBuffer) {
      throw new AppError('This appointment link has expired', ERROR_CODES.BAD_REQUEST);
    }

    return link.createdBy.toString();
  };

  static updateVisitorId = async (token: string, visitorId: string): Promise<void> => {
    const decryptedToken = this.decryptTokenIfNeeded(token);
    const link = await AppointmentBookingLink.findOne({ secureToken: decryptedToken });

    if (!link) throw new AppError('Invalid appointment link', ERROR_CODES.NOT_FOUND);

    link.visitorId = visitorId as any;
    await link.save();
  };

  static async getAllAppointmentLinks(
    query: IGetAppointmentLinksQuery,
    userId: string
  ): Promise<IAppointmentLinkListResponse> {
    const {
      page = 1,
      limit = 10,
      isBooked,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filter: any = { createdBy: userId };

    if (typeof isBooked === 'boolean') {
      filter.isBooked = isBooked;
    }

    if (search) {
      filter.$or = [
        { visitorEmail: { $regex: search, $options: 'i' } },
        { secureToken: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [links, total] = await Promise.all([
      AppointmentBookingLink.find(filter)
        .populate('employeeId', 'name email')
        .populate('visitorId', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      AppointmentBookingLink.countDocuments(filter),
    ]);

    const [totalBooked, totalNotBooked] = await Promise.all([
      AppointmentBookingLink.countDocuments({ ...filter, isBooked: true }),
      AppointmentBookingLink.countDocuments({ ...filter, isBooked: false }),
    ]);

    const formattedLinks = links.map((link: any) => ({
      ...link,
      _id: link._id.toString(),
      visitorId: link.visitorId?.toString(),
      employeeId: link.employeeId.toString(),
      employee: link.employeeId && typeof link.employeeId === 'object' ? {
        _id: (link.employeeId as any)._id.toString(),
        name: (link.employeeId as any).name,
        email: (link.employeeId as any).email,
      } : undefined,
      bookingUrl: `${this.FRONTEND_URL}/book-appointment/${link.secureToken}`,
    }));

    return {
      links: formattedLinks as IAppointmentLinkResponse[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalBooked,
        totalNotBooked,
      },
    };
  }

  static async deleteAppointmentLink(linkId: string, userId: string): Promise<void> {
    const link = await AppointmentBookingLink.findOne({
      _id: linkId,
      createdBy: userId,
    });

    if (!link) {
      throw new AppError('Appointment link not found', ERROR_CODES.NOT_FOUND);
    }

    await AppointmentBookingLink.deleteOne({ _id: linkId });
  }
}

