import { Visitor } from '../../models/visitor/visitor.model';
import { Appointment } from '../../models/appointment/appointment.model';
import {
    ICreateVisitorDTO,
    IUpdateVisitorDTO,
    IVisitorResponse,
    IGetVisitorsQuery,
    IVisitorListResponse,
    IBulkUpdateVisitorsDTO,
    IVisitorStats,
    IVisitorSearchQuery,
    IVisitorSearchResponse
} from '../../types/visitor/visitor.types';
import { ERROR_MESSAGES, ERROR_CODES } from '../../utils';
import { AppError } from '../../middlewares/errorHandler';
import { Transaction } from '../../decorators';
import { toObjectId } from '../../utils/idExtractor.util';
import { escapeRegex } from '../../utils/string.util';

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

        const existingVisitor = await Visitor.findOne({
            email: visitorData.email,
            createdBy: createdByObjectId
        }).session(session);

        // If a visitor exists with the same email but is soft-deleted, restore it instead of blocking.
        // This matches the expected behavior: deleted records should not prevent re-creation.
        if (existingVisitor) {
            if ((existingVisitor as any).isDeleted === true) {
                existingVisitor.set({
                    ...visitorData,
                    isDeleted: false,
                    deletedAt: null,
                    deletedBy: null
                });
                await existingVisitor.save({ session });
                return existingVisitor.toObject() as unknown as IVisitorResponse;
            }
            throw new AppError(ERROR_MESSAGES.VISITOR_EMAIL_EXISTS, ERROR_CODES.CONFLICT);
        }

        const visitor = new Visitor({ ...visitorData, createdBy: createdByObjectId });
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
            filter.createdBy = userId;
        }

        if (search) {
            const escapedSearch = escapeRegex(search);
            filter.$or = [
                { name: { $regex: escapedSearch, $options: 'i' } },
                { email: { $regex: escapedSearch, $options: 'i' } },
                { phone: { $regex: escapedSearch, $options: 'i' } },
                { company: { $regex: escapedSearch, $options: 'i' } },
                { designation: { $regex: escapedSearch, $options: 'i' } },
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
            const existingEmail = await Visitor.findOne({
                email: safeUpdateData.email,
                createdBy: existingVisitor.createdBy,
                _id: { $ne: visitorIdObjectId }
            }).session(session);

            if (existingEmail) {
                throw new AppError(
                    ERROR_MESSAGES.VISITOR_EMAIL_EXISTS,
                    ERROR_CODES.CONFLICT
                );
            }
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
     * Bulk update visitors
     */
    @Transaction('Failed to bulk update visitors')
    static async bulkUpdateVisitors(bulkData: IBulkUpdateVisitorsDTO, options: { session?: any } = {}): Promise<{ updatedCount: number }> {
        const { session } = options;
        const { visitorIds, ...updateData } = bulkData;

        const cleanUpdateData = Object.fromEntries(
            Object.entries(updateData).filter(([_, value]) => value !== undefined && value !== '')
        );

        if (Object.keys(cleanUpdateData).length === 0) {
            throw new AppError(ERROR_MESSAGES.NO_UPDATE_DATA, ERROR_CODES.BAD_REQUEST);
        }

        const result = await Visitor.updateMany(
            { _id: { $in: visitorIds }, isDeleted: false },
            cleanUpdateData,
            { session }
        );

        if (result.matchedCount === 0) {
            throw new AppError(ERROR_MESSAGES.NO_VISITORS_FOUND, ERROR_CODES.NOT_FOUND);
        }

        return { updatedCount: result.modifiedCount };
    }

    /**
     * Search visitors by phone or email
     */
    static async searchVisitors(searchQuery: IVisitorSearchQuery, userId?: string): Promise<IVisitorSearchResponse> {
        const { phone, email } = searchQuery;

        const searchCriteria: any = { isDeleted: false };
        
        if (userId) {
            searchCriteria.createdBy = userId;
        }

        if (phone && email) {
            searchCriteria.$or = [
                { phone: phone },
                { email: email }
            ];
        } else if (phone) {
            searchCriteria.phone = phone;
        } else if (email) {
            searchCriteria.email = email;
        } else {
            throw new AppError('Either phone or email must be provided for search', ERROR_CODES.BAD_REQUEST);
        }

        const visitors = await Visitor.find(searchCriteria).sort({ createdAt: -1 });
        const visitorResponses = visitors.map(visitor => visitor.toObject() as unknown as IVisitorResponse);

        return {
            visitors: visitorResponses,
            found: visitorResponses.length > 0,
            message: visitorResponses.length > 0 
                ? `Found ${visitorResponses.length} visitor(s)` 
                : 'No visitors found with the provided criteria'
        };
    }

    /**
     * Get visitor statistics (user-specific)
     */
    static async getVisitorStats(userId?: string): Promise<IVisitorStats> {
        const baseFilter: any = {};
        if (userId) {
            baseFilter.createdBy = userId;
        }

        const [
            totalVisitors,
            deletedVisitors,
            visitorsByCity,
            visitorsByState,
            visitorsByCountry,
            visitorsByIdProofType
        ] = await Promise.all([
            Visitor.countDocuments({ ...baseFilter, isDeleted: false }),
            Visitor.countDocuments({ ...baseFilter, isDeleted: true }),
            Visitor.aggregate([
                { $match: { ...baseFilter, isDeleted: false } },
                { $group: { _id: '$address.city', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]),
            Visitor.aggregate([
                { $match: { ...baseFilter, isDeleted: false } },
                { $group: { _id: '$address.city', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]),
            Visitor.aggregate([
                { $match: { ...baseFilter, isDeleted: false } },
                { $group: { _id: '$address.state', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]),
            Visitor.aggregate([
                { $match: { ...baseFilter, isDeleted: false } },
                { $group: { _id: '$address.country', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]),
            Visitor.aggregate([
                { $match: { ...baseFilter, isDeleted: false } },
                { $group: { _id: '$idProof.type', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ])
        ]);

        return {
            totalVisitors,
            deletedVisitors,
            visitorsByCity: visitorsByCity.map((item: any) => ({
                city: item._id,
                count: item.count
            })),
            visitorsByState: visitorsByState.map((item: any) => ({
                state: item._id,
                count: item.count
            })),
            visitorsByCountry: visitorsByCountry.map((item: any) => ({
                country: item._id,
                count: item.count
            })),
            visitorsByIdProofType: visitorsByIdProofType.map((item: any) => ({
                idProofType: item._id,
                count: item.count
            }))
        };
    }
}
