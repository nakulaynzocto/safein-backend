import { SpotPass, SpotPassStatus } from '../../models/spotPass/spotPass.model';
import { Visitor } from '../../models/visitor/visitor.model';
import {
    ICreateSpotPassDTO,
    ISpotPassResponse,
    IGetSpotPassesQuery,
    ISpotPassListResponse
} from '../../types/spotPass/spotPass.types';
import { ERROR_CODES } from '../../utils';
import { AppError } from '../../middlewares/errorHandler';
import { Transaction } from '../../decorators';
import { toObjectId } from '../../utils/idExtractor.util';
import { escapeRegex } from '../../utils/string.util';
import { EmployeeUtil } from '../../utils/employee.util';

export class SpotPassService {
    /**
     * Create a new spot pass
     */
    @Transaction('Failed to create spot pass')
    static async createSpotPass(data: ICreateSpotPassDTO, createdBy: string, options: { session?: any } = {}): Promise<ISpotPassResponse> {
        const { session } = options;

        const createdByObjectId = toObjectId(createdBy);
        const adminId = await EmployeeUtil.getAdminId(createdBy);
        const adminIdObjectId = toObjectId(adminId);

        // 1. Find or create visitor
        let visitor = await Visitor.findOne({
            phone: data.phone,
            createdBy: adminIdObjectId,
            isDeleted: false
        }).session(session);

        if (!visitor) {
            // Generate a placeholder email if not provided, as it's required in Visitor model
            const email = `${data.phone}@visitor.com`;

            visitor = new Visitor({
                name: data.name,
                phone: data.phone,
                email: email,
                gender: data.gender,
                address: {
                    city: 'N/A', // Placeholders to satisfy schema
                    state: 'N/A',
                    country: 'India',
                    street: data.address
                },
                photo: data.photo,
                createdBy: adminIdObjectId
            });
            await visitor.save({ session });
        }

        // 2. Create Spot Pass
        const spotPass = new SpotPass({
            visitorId: visitor._id,
            businessId: adminIdObjectId,
            name: data.name,
            phone: data.phone,
            gender: data.gender,
            address: data.address,
            photo: data.photo,
            vehicleNumber: data.vehicleNumber,
            notes: data.notes,
            status: SpotPassStatus.CHECKED_IN,
            checkInTime: new Date(),
            createdBy: createdByObjectId
        });

        await spotPass.save({ session });

        return spotPass.toObject() as unknown as ISpotPassResponse;
    }

    /**
     * Get all spot passes for a business
     */
    static async getAllSpotPasses(query: IGetSpotPassesQuery, userId: string): Promise<ISpotPassListResponse> {
        const adminId = await EmployeeUtil.getAdminId(userId);
        const adminIdObjectId = toObjectId(adminId);

        const {
            page = 1,
            limit = 10,
            search = '',
            startDate = '',
            endDate = '',
            status = '',
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = query;

        const filter: any = {
            businessId: adminIdObjectId,
            isDeleted: false
        };

        if (search) {
            const escapedSearch = escapeRegex(search);
            filter.$or = [
                { name: { $regex: escapedSearch, $options: 'i' } },
                { phone: { $regex: escapedSearch, $options: 'i' } }
            ];
        }

        if (status) {
            filter.status = status;
        }

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                filter.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.createdAt.$lte = new Date(endDate);
            }
        }

        const skip = (page - 1) * limit;
        const sort: any = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const [passes, total] = await Promise.all([
            SpotPass.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            SpotPass.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(total / limit);

        return {
            spotPasses: passes as unknown as ISpotPassResponse[],
            pagination: {
                currentPage: Number(page),
                totalPages,
                totalPasses: total,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        };
    }

    /**
     * Check out a spot pass
     */
    @Transaction('Failed to check out spot pass')
    static async checkOutPass(passId: string, options: { session?: any } = {}): Promise<ISpotPassResponse> {
        const { session } = options;
        const passIdObjectId = toObjectId(passId);

        const pass = await SpotPass.findOne({ _id: passIdObjectId, isDeleted: false }).session(session);
        if (!pass) {
            throw new AppError('Spot pass not found', ERROR_CODES.NOT_FOUND);
        }

        if (pass.status === SpotPassStatus.CHECKED_OUT) {
            throw new AppError('Pass is already checked out', ERROR_CODES.BAD_REQUEST);
        }

        pass.status = SpotPassStatus.CHECKED_OUT;
        pass.checkOutTime = new Date();
        await pass.save({ session });

        return pass.toObject() as unknown as ISpotPassResponse;
    }

    /**
     * Delete a spot pass record
     */
    @Transaction('Failed to delete spot pass')
    static async deletePass(passId: string, _deletedBy: string, options: { session?: any } = {}): Promise<void> {
        const { session } = options;
        const passIdObjectId = toObjectId(passId);

        const pass = await SpotPass.findOne({ _id: passIdObjectId, isDeleted: false }).session(session);
        if (!pass) {
            throw new AppError('Spot pass not found', ERROR_CODES.NOT_FOUND);
        }

        pass.isDeleted = true;
        await pass.save({ session });
    }
}
