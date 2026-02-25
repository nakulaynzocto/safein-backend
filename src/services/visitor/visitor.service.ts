import { Visitor } from '../../models/visitor/visitor.model';
import { Appointment } from '../../models/appointment/appointment.model';
import {
    ICreateVisitorDTO,
    IUpdateVisitorDTO,
    IVisitorResponse,
    IGetVisitorsQuery,
    IVisitorListResponse
} from '../../types/visitor/visitor.types';
import { ERROR_MESSAGES, ERROR_CODES } from '../../utils';
import { AppError } from '../../middlewares/errorHandler';
import { Transaction } from '../../decorators';
import { toObjectId } from '../../utils/idExtractor.util';
import { escapeRegex } from '../../utils/string.util';
import { EmployeeUtil } from '../../utils/employee.util';

export class VisitorService {
    /**
     * Create a new visitor
     */
    @Transaction('Failed to create visitor')
    static async createVisitor(visitorData: ICreateVisitorDTO, createdBy: string, options: { session?: any } = {}): Promise<IVisitorResponse> {
        const { session } = options;

        const createdByObjectId = toObjectId(createdBy);
        if (!createdByObjectId) {
            throw new AppError('Invalid user ID format', ERROR_CODES.BAD_REQUEST);
        }

        // Get admin ID - Visitors belong to the company (admin)
        const adminId = await EmployeeUtil.getAdminId(createdBy);
        const adminIdObjectId = toObjectId(adminId);

        const normalizedEmail = visitorData.email ? visitorData.email.toLowerCase().trim() : null;
        const visitorPhone = visitorData.phone.trim();

        const query: any = {
            createdBy: adminIdObjectId,
            isDeleted: false,
            $or: [{ phone: visitorPhone }]
        };
        if (normalizedEmail) {
            query.$or.push({ email: normalizedEmail });
        }

        const existingVisitor = await Visitor.findOne(query).session(session);

        // If a visitor exists with the same email but is soft-deleted, restore it instead of blocking.
        if (existingVisitor) {
            if ((existingVisitor as any).isDeleted === true) {
                existingVisitor.set({
                    ...visitorData,
                    email: normalizedEmail || undefined,
                    isDeleted: false,
                    deletedAt: null,
                    deletedBy: null
                });
                await existingVisitor.save({ session });
                return existingVisitor.toObject() as unknown as IVisitorResponse;
            }
            throw new AppError(
                normalizedEmail && (existingVisitor as any).email === normalizedEmail
                    ? ERROR_MESSAGES.VISITOR_EMAIL_EXISTS
                    : 'A visitor with this phone number already exists.',
                ERROR_CODES.CONFLICT
            );
        }

        const visitor = new Visitor({
            ...visitorData,
            email: normalizedEmail || undefined,
            createdBy: adminIdObjectId
        });
        await visitor.save({ session });

        return visitor.toObject() as unknown as IVisitorResponse;
    }

    /**
     * Get visitor by ID
     */
    static async getVisitorById(visitorId: string): Promise<IVisitorResponse> {
        const visitorIdObjectId = toObjectId(visitorId);
        if (!visitorIdObjectId) {
            throw new AppError('Invalid visitor ID format', ERROR_CODES.BAD_REQUEST);
        }

        const visitor = await Visitor.findOne({ _id: visitorIdObjectId, isDeleted: false });
        if (!visitor) {
            throw new AppError(ERROR_MESSAGES.VISITOR_NOT_FOUND, ERROR_CODES.NOT_FOUND);
        }
        return visitor.toObject() as unknown as IVisitorResponse;
    }

    /**
     * Get all visitors with pagination and filtering (user-specific)
     */
    static async getAllVisitors(query: IGetVisitorsQuery = {}, userId?: string): Promise<IVisitorListResponse> {
        const {
            page = 1,
            limit = 10,
            search = '',
            startDate = '',
            endDate = '',
            city = '',
            state = '',
            country = '',
            idProofType = '',
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = query;

        const filter: any = { isDeleted: false };

        if (userId) {
            // Filter by admin ID to show all company visitors
            const adminId = await EmployeeUtil.getAdminId(userId);
            filter.createdBy = toObjectId(adminId);
        }

        if (search) {
            const escapedSearch = escapeRegex(search);
            filter.$or = [
                { name: { $regex: escapedSearch, $options: 'i' } },
                { email: { $regex: escapedSearch, $options: 'i' } },
                { phone: { $regex: escapedSearch, $options: 'i' } },
                { 'address.street': { $regex: escapedSearch, $options: 'i' } },
                { 'address.city': { $regex: escapedSearch, $options: 'i' } },
                { 'address.state': { $regex: escapedSearch, $options: 'i' } },
                { 'address.country': { $regex: escapedSearch, $options: 'i' } },
                { 'idProof.type': { $regex: escapedSearch, $options: 'i' } },
                { 'idProof.number': { $regex: escapedSearch, $options: 'i' } }
            ];
        }

        if (startDate || endDate) {
            const createdAt: any = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                createdAt.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                createdAt.$lte = end;
            }
            filter.createdAt = createdAt;
        }

        if (city) {
            filter['address.city'] = { $regex: escapeRegex(city), $options: 'i' };
        }

        if (state) {
            filter['address.state'] = { $regex: escapeRegex(state), $options: 'i' };
        }

        if (country) {
            filter['address.country'] = { $regex: escapeRegex(country), $options: 'i' };
        }

        if (idProofType) {
            filter['idProof.type'] = { $regex: escapeRegex(idProofType), $options: 'i' };
        }

        const skip = (page - 1) * limit;

        const sort: any = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const [visitors, totalVisitors] = await Promise.all([
            Visitor.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            Visitor.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(totalVisitors / limit);

        return {
            visitors: visitors as unknown as IVisitorResponse[],
            pagination: {
                currentPage: page,
                totalPages,
                totalVisitors,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        };
    }

    /**
     * Get visitor count (optimized for dashboard)
     */
    static async getVisitorCount(userId?: string): Promise<{ total: number }> {
        const filter: any = { isDeleted: false };

        if (userId) {
            // Filter by admin ID to count all company visitors
            const adminId = await EmployeeUtil.getAdminId(userId);
            filter.createdBy = toObjectId(adminId);
        }

        const total = await Visitor.countDocuments(filter);
        return { total };
    }

    /**
     * Update visitor
     */
    @Transaction('Failed to update visitor')
    static async updateVisitor(visitorId: string, updateData: IUpdateVisitorDTO, options: { session?: any } = {}): Promise<IVisitorResponse> {
        const { session } = options;

        const visitorIdObjectId = toObjectId(visitorId);
        if (!visitorIdObjectId) {
            throw new AppError('Invalid visitor ID format', ERROR_CODES.BAD_REQUEST);
        }

        const safeUpdateData = { ...updateData };
        delete (safeUpdateData as any).session;

        const existingVisitor = await Visitor.findById(visitorIdObjectId).session(session);
        if (!existingVisitor) {
            throw new AppError(ERROR_MESSAGES.VISITOR_NOT_FOUND, ERROR_CODES.NOT_FOUND);
        }

        if (safeUpdateData.email) {
            const normalizedEmail = safeUpdateData.email.toLowerCase().trim();
            const existingEmail = await Visitor.findOne({
                email: normalizedEmail,
                createdBy: existingVisitor.createdBy,
                _id: { $ne: visitorIdObjectId },
                isDeleted: false
            }).session(session);

            if (existingEmail) {
                throw new AppError(
                    ERROR_MESSAGES.VISITOR_EMAIL_EXISTS,
                    ERROR_CODES.CONFLICT
                );
            }
            safeUpdateData.email = normalizedEmail;
        }

        const visitor = await Visitor.findByIdAndUpdate(
            visitorIdObjectId,
            safeUpdateData,
            { new: true, runValidators: true, session }
        );

        if (!visitor) {
            throw new AppError(
                ERROR_MESSAGES.VISITOR_NOT_FOUND,
                ERROR_CODES.NOT_FOUND
            );
        }

        return visitor.toObject() as unknown as IVisitorResponse;
    }

    /**
     * Check if visitor has appointments
     */
    static async hasAppointments(visitorId: string): Promise<{ hasAppointments: boolean; count: number }> {
        const visitorIdObjectId = toObjectId(visitorId);
        if (!visitorIdObjectId) {
            throw new AppError('Invalid visitor ID format', ERROR_CODES.BAD_REQUEST);
        }

        const count = await Appointment.countDocuments({
            visitorId: visitorIdObjectId,
            isDeleted: false,
            status: { $in: ['pending', 'approved', 'rejected', 'completed'] }
        });
        return { hasAppointments: count > 0, count };
    }

    /**
     * Soft delete visitor
     */
    @Transaction('Failed to delete visitor')
    static async deleteVisitor(visitorId: string, deletedBy: string, options: { session?: any } = {}): Promise<void> {
        const { session } = options;

        const visitorIdObjectId = toObjectId(visitorId);
        const deletedByObjectId = toObjectId(deletedBy);

        if (!visitorIdObjectId) {
            throw new AppError('Invalid visitor ID format', ERROR_CODES.BAD_REQUEST);
        }
        if (!deletedByObjectId) {
            throw new AppError('Invalid user ID format', ERROR_CODES.BAD_REQUEST);
        }

        const visitor = await Visitor.findOne({ _id: visitorIdObjectId, isDeleted: false }).session(session);
        if (!visitor) {
            throw new AppError(ERROR_MESSAGES.VISITOR_NOT_FOUND, ERROR_CODES.NOT_FOUND);
        }

        // Check if any appointments exist for this visitor
        const existingAppointments = await Appointment.countDocuments({
            visitorId: visitorIdObjectId,
            isDeleted: false
        }).session(session);

        if (existingAppointments > 0) {
            throw new AppError(
                `Cannot delete visitor. ${existingAppointments} appointment(s) have been created with this visitor. Please delete or reassign the appointments first.`,
                ERROR_CODES.BAD_REQUEST
            );
        }

        await (visitor as any).softDelete(deletedByObjectId);
    }


    /**
     * Find an existing visitor by email or phone within a company
     */
    static async findVisitorByContact(adminId: string, email?: string, phone?: string): Promise<any> {
        const adminIdObjectId = toObjectId(adminId);
        if (!adminIdObjectId || (!email && !phone)) return null;

        const filter: any = {
            createdBy: adminIdObjectId,
            isDeleted: false
        };

        const normalizedEmail = email?.toLowerCase().trim();
        const cleanedPhone = phone?.trim();

        if (normalizedEmail && cleanedPhone) {
            filter.$or = [{ email: normalizedEmail }, { phone: cleanedPhone }];
        } else if (normalizedEmail) {
            filter.email = normalizedEmail;
        } else if (cleanedPhone) {
            filter.phone = cleanedPhone;
        }

        return await Visitor.findOne(filter).lean();
    }
}
