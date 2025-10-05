import { Company } from '../../models/company/company.model';
import {
    ICreateCompanyDTO,
    IUpdateCompanyDTO,
    ICompanyResponse
} from '../../types/company/company.types';
import { ERROR_MESSAGES, ERROR_CODES } from '../../utils';
import { AppError } from '../../middlewares/errorHandler';
import { Transaction } from '../../decorators';

export class CompanyService {
    /**
     * Create a new company
     */
    @Transaction('Failed to create company')
    static async createCompany(companyData: ICreateCompanyDTO, userId: string, options: { session?: any } = {}): Promise<ICompanyResponse> {
        const { session } = options;

        // Check if company code already exists
        if (companyData.companyCode) {
            const existingCompany = await Company.findOne({ companyCode: companyData.companyCode }).session(session);
            if (existingCompany) {
                throw new AppError(ERROR_MESSAGES.COMPANY_CODE_EXISTS, ERROR_CODES.CONFLICT);
            }
        }

        // Check if email already exists
        const existingEmail = await Company.findOne({ email: companyData.email }).session(session);
        if (existingEmail) {
            throw new AppError(ERROR_MESSAGES.COMPANY_EMAIL_EXISTS, ERROR_CODES.CONFLICT);
        }

        // Create new company with userId from authenticated user
        const company = new Company({ ...companyData, userId });
        await company.save({ session });

        return company.toObject() as unknown as ICompanyResponse;
    }

    /**
     * Get company by ID
     */
    static async getCompanyById(companyId: string): Promise<ICompanyResponse> {
        const company = await Company.findOne({ _id: companyId, isDeleted: false });
        if (!company) {
            throw new AppError(ERROR_MESSAGES.COMPANY_NOT_FOUND, ERROR_CODES.NOT_FOUND);
        }
        return company.toObject() as unknown as ICompanyResponse;
    }

    /**
     * Update company
     */
    @Transaction('Failed to update company')
    static async updateCompany(companyId: string, updateData: IUpdateCompanyDTO, options: { session?: any } = {}): Promise<ICompanyResponse> {
        const { session } = options;

        const company = await Company.findOneAndUpdate(
            { _id: companyId, isDeleted: false },
            updateData,
            { new: true, runValidators: true, session }
        );

        if (!company) {
            throw new AppError(ERROR_MESSAGES.COMPANY_NOT_FOUND, ERROR_CODES.NOT_FOUND);
        }

        return company.toObject() as unknown as ICompanyResponse;
    }

    /**
     * Soft delete company
     */
    @Transaction('Failed to delete company')
    static async deleteCompany(companyId: string, deletedBy: string, options: { session?: any } = {}): Promise<void> {
        const { session } = options;

        const company = await Company.findOne({ _id: companyId, isDeleted: false }).session(session);
        if (!company) {
            throw new AppError(ERROR_MESSAGES.COMPANY_NOT_FOUND, ERROR_CODES.NOT_FOUND);
        }

        await (company as any).softDelete(deletedBy);
    }

    /**
     * Get all companies with pagination and filtering (user-specific)
     */
    static async getAllCompanies(page: number = 1, limit: number = 10, includeDeleted: boolean = false, userId?: string): Promise<{
        companies: ICompanyResponse[];
        total: number;
        page: number;
        totalPages: number;
    }> {
        const skip = (page - 1) * limit;
        const filter: any = includeDeleted ? {} : { isDeleted: false };
        
        // Filter by user if provided (for user-specific access)
        if (userId) {
            filter.userId = userId;
        }

        const [companies, total] = await Promise.all([
            Company.find(filter)
                .populate('userId', 'firstName lastName email')
                .populate('deletedBy', 'firstName lastName email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Company.countDocuments(filter)
        ]);

        return {
            companies: companies as unknown as ICompanyResponse[],
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Restore company from trash
     */
    @Transaction('Failed to restore company')
    static async restoreCompany(companyId: string, options: { session?: any } = {}): Promise<ICompanyResponse> {
        const { session } = options;

        const company = await Company.findOne({ _id: companyId, isDeleted: true }).session(session);
        if (!company) {
            throw new AppError(ERROR_MESSAGES.COMPANY_NOT_FOUND, ERROR_CODES.NOT_FOUND);
        }

        await (company as any).restore();
        return company.toObject() as unknown as ICompanyResponse;
    }

    /**
     * Check if company exists for a user
     */
    static async checkCompanyExists(userId: string): Promise<boolean> {
        const company = await Company.findOne({ 
            userId, 
            isDeleted: false 
        });
        return !!company;
    }
}