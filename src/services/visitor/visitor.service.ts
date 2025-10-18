import { Visitor } from '../../models/visitor/visitor.model';
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

export class VisitorService {
    /**
     * Create a new visitor
     */
    @Transaction('Failed to create visitor')
    static async createVisitor(visitorData: ICreateVisitorDTO, createdBy: string, options: { session?: any } = {}): Promise<IVisitorResponse> {
        const { session } = options;

        // Check if email already exists for this user
        const existingEmail = await Visitor.findOne({ 
            email: visitorData.email, 
            createdBy: createdBy 
        }).session(session);
        if (existingEmail) {
            throw new AppError(ERROR_MESSAGES.VISITOR_EMAIL_EXISTS, ERROR_CODES.CONFLICT);
        }

        // Create new visitor with createdBy from authenticated user
        const visitor = new Visitor({ ...visitorData, createdBy });
        await visitor.save({ session });

        return visitor.toObject() as unknown as IVisitorResponse;
    }

    /**
     * Get visitor by ID
     */
    static async getVisitorById(visitorId: string): Promise<IVisitorResponse> {
        const visitor = await Visitor.findOne({ _id: visitorId, isDeleted: false });
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
            city = '',
            state = '',
            country = '',
            idProofType = '',
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = query;

        // Build filter object - only show visitors created by the current user
        const filter: any = { isDeleted: false };
        
        // Filter by user if provided (for user-specific access)
        if (userId) {
            filter.createdBy = userId;
        }

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } },
                { designation: { $regex: search, $options: 'i' } },
                { 'address.street': { $regex: search, $options: 'i' } },
                { 'address.city': { $regex: search, $options: 'i' } },
                { 'address.state': { $regex: search, $options: 'i' } },
                { 'address.country': { $regex: search, $options: 'i' } },
                { 'idProof.type': { $regex: search, $options: 'i' } },
                { 'idProof.number': { $regex: search, $options: 'i' } }
            ];
        }


        if (city) {
            filter['address.city'] = { $regex: city, $options: 'i' };
        }

        if (state) {
            filter['address.state'] = { $regex: state, $options: 'i' };
        }

        if (country) {
            filter['address.country'] = { $regex: country, $options: 'i' };
        }

        if (idProofType) {
            filter['idProof.type'] = { $regex: idProofType, $options: 'i' };
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Build sort object
        const sort: any = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Execute queries
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

        // ✅ Ensure session is not part of updateData
        const safeUpdateData = { ...updateData };
        delete (safeUpdateData as any).session;

        // 🔍 Get the existing visitor to check createdBy
        const existingVisitor = await Visitor.findById(visitorId).session(session);
        if (!existingVisitor) {
            throw new AppError(ERROR_MESSAGES.VISITOR_NOT_FOUND, ERROR_CODES.NOT_FOUND);
        }

        // 🔍 Check if email already exists for this user (excluding current visitor)
        if (safeUpdateData.email) {
            const existingEmail = await Visitor.findOne({
                email: safeUpdateData.email,
                createdBy: existingVisitor.createdBy,
                _id: { $ne: visitorId }
            }).session(session);

            if (existingEmail) {
                throw new AppError(
                    ERROR_MESSAGES.VISITOR_EMAIL_EXISTS,
                    ERROR_CODES.CONFLICT
                );
            }
        }

        // 🔄 Update visitor
        const visitor = await Visitor.findByIdAndUpdate(
            visitorId,
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
     * Soft delete visitor
     */
    @Transaction('Failed to delete visitor')
    static async deleteVisitor(visitorId: string, deletedBy: string, options: { session?: any } = {}): Promise<void> {
        const { session } = options;

        const visitor = await Visitor.findOne({ _id: visitorId, isDeleted: false }).session(session);
        if (!visitor) {
            throw new AppError(ERROR_MESSAGES.VISITOR_NOT_FOUND, ERROR_CODES.NOT_FOUND);
        }

        await (visitor as any).softDelete(deletedBy);
    }

    /**
     * Get trashed visitors
     */
    static async getTrashedVisitors(query: IGetVisitorsQuery = {}): Promise<IVisitorListResponse> {
        const {
            page = 1,
            limit = 10,
            search = '',
            city = '',
            state = '',
            country = '',
            sortBy = 'deletedAt',
            sortOrder = 'desc'
        } = query;

        // Build filter object for deleted visitors
        const filter: any = { isDeleted: true };

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { 'address.street': { $regex: search, $options: 'i' } },
                { 'address.city': { $regex: search, $options: 'i' } },
                { 'address.state': { $regex: search, $options: 'i' } },
                { 'address.country': { $regex: search, $options: 'i' } },
                { 'address.zipCode': { $regex: search, $options: 'i' } },
                { 'idProof.type': { $regex: search, $options: 'i' } },
                { 'idProof.number': { $regex: search, $options: 'i' } }
            ];
        }


        if (city) {
            filter['address.city'] = { $regex: city, $options: 'i' };
        }

        if (state) {
            filter['address.state'] = { $regex: state, $options: 'i' };
        }

        if (country) {
            filter['address.country'] = { $regex: country, $options: 'i' };
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Build sort object
        const sort: any = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Execute queries
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
     * Restore visitor from trash
     */
    @Transaction('Failed to restore visitor')
    static async restoreVisitor(visitorId: string, options: { session?: any } = {}): Promise<IVisitorResponse> {
        const { session } = options;

        const visitor = await Visitor.findById(visitorId).session(session);
        if (!visitor) {
            throw new AppError(ERROR_MESSAGES.VISITOR_NOT_FOUND, ERROR_CODES.NOT_FOUND);
        }

        if (!visitor.isDeleted) {
            throw new AppError(ERROR_MESSAGES.VISITOR_NOT_DELETED, ERROR_CODES.BAD_REQUEST);
        }

        visitor.isDeleted = false;
        visitor.deletedAt = null as unknown as Date;
        await visitor.save({ session });
        return visitor.toObject() as unknown as IVisitorResponse;
    }

    /**
     * Bulk update visitors
     */
    @Transaction('Failed to bulk update visitors')
    static async bulkUpdateVisitors(bulkData: IBulkUpdateVisitorsDTO, options: { session?: any } = {}): Promise<{ updatedCount: number }> {
        const { session } = options;
        const { visitorIds, ...updateData } = bulkData;

        // Remove empty values
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
    static async searchVisitors(searchQuery: IVisitorSearchQuery): Promise<IVisitorSearchResponse> {
        const { phone, email } = searchQuery;

        // Build search criteria
        const searchCriteria: any = { isDeleted: false };

        if (phone && email) {
            // Search by both phone OR email
            searchCriteria.$or = [
                { phone: phone },
                { email: email }
            ];
        } else if (phone) {
            // Search by phone only
            searchCriteria.phone = phone;
        } else if (email) {
            // Search by email only
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
        // Build base filter - only show visitors created by the current user
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
