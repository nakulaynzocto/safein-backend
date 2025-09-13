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
    static async createCompany(companyData: ICreateCompanyDTO, options: { session?: any } = {}): Promise<ICompanyResponse> {
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

        // Create new company
        const company = new Company(companyData);
        await company.save({ session });

        return company.toObject() as unknown as ICompanyResponse;
    }

    /**
     * Get company by ID
     */
    static async getCompanyById(companyId: string): Promise<ICompanyResponse> {
        const company = await Company.findById(companyId);
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

        const company = await Company.findByIdAndUpdate(
            companyId,
            updateData,
            { new: true, runValidators: true, session }
        );

        if (!company) {
            throw new AppError(ERROR_MESSAGES.COMPANY_NOT_FOUND, ERROR_CODES.NOT_FOUND);
        }

        return company.toObject() as unknown as ICompanyResponse;
    }

    /**
     * Delete company
     */
    @Transaction('Failed to delete company')
    static async deleteCompany(companyId: string, options: { session?: any } = {}): Promise<void> {
        const { session } = options;

        const company = await Company.findByIdAndDelete(companyId).session(session);
        if (!company) {
            throw new AppError(ERROR_MESSAGES.COMPANY_NOT_FOUND, ERROR_CODES.NOT_FOUND);
        }
    }
}