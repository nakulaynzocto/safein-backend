import { Request, Response, NextFunction } from 'express';
import { CompanyService } from '../../services/company/company.service';
import { Company } from '../../models/company/company.model';
import { ResponseUtil } from '../../utils';
import { ICreateCompanyDTO, IUpdateCompanyDTO } from '../../types/company/company.types';
import { ERROR_CODES } from '../../utils/constants';
import { TryCatch } from '../../decorators';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/errorHandler';

export class CompanyController {
    /**
     * Create a new company
     * POST /api/companies
     */
    @TryCatch('Failed to create company')
    static async createCompany(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }
        const companyData: ICreateCompanyDTO = req.body;
        const userId = req.user._id.toString();
        const company = await CompanyService.createCompany(companyData, userId);
        ResponseUtil.success(res, 'Company created successfully', company, ERROR_CODES.CREATED);
    }

    /**
     * Get company by ID (user-specific)
     * GET /api/companies/:id
     */
    @TryCatch('Failed to get company')
    static async getCompanyById(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }
        
        const { id } = req.params;
        const userId = req.user._id.toString();
        
        // Get company and verify it belongs to the current user
        const company = await CompanyService.getCompanyById(id);
        
        // Additional check: verify the company belongs to the current user
        const companyRecord = await Company.findById(id);
        if (!companyRecord || companyRecord.userId.toString() !== userId) {
            throw new AppError('Company not found or access denied', ERROR_CODES.NOT_FOUND);
        }
        
        ResponseUtil.success(res, 'Company retrieved successfully', company);
    }

    /**
     * Update company
     * PUT /api/companies/:id
     */
    @TryCatch('Failed to update company')
    static async updateCompany(req: Request, res: Response, _next: NextFunction): Promise<void> {
        const { id } = req.params;
        const updateData: IUpdateCompanyDTO = req.body;
        const company = await CompanyService.updateCompany(id, updateData);
        ResponseUtil.success(res, 'Company updated successfully', company);
    }

    /**
     * Soft delete company
     * DELETE /api/companies/:id
     */
    @TryCatch('Failed to delete company')
    static async deleteCompany(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }
        const { id } = req.params;
        const deletedBy = req.user._id.toString();
        await CompanyService.deleteCompany(id, deletedBy);
        ResponseUtil.success(res, 'Company deleted successfully');
    }

    /**
     * Get all companies with pagination (user-specific)
     * GET /api/companies
     */
    @TryCatch('Failed to get companies')
    static async getAllCompanies(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }
        
        const { page = 1, limit = 10, includeDeleted = false } = req.query;
        const userId = req.user._id.toString();
        const result = await CompanyService.getAllCompanies(
            parseInt(page as string),
            parseInt(limit as string),
            includeDeleted === 'true',
            userId
        );
        ResponseUtil.success(res, 'Companies retrieved successfully', result);
    }

    /**
     * Restore company from trash
     * PUT /api/companies/:id/restore
     */
    @TryCatch('Failed to restore company')
    static async restoreCompany(req: Request, res: Response, _next: NextFunction): Promise<void> {
        const { id } = req.params;
        const company = await CompanyService.restoreCompany(id);
        ResponseUtil.success(res, 'Company restored successfully', company);
    }

    /**
     * Check if company exists for authenticated user
     * GET /api/companies/exists
     */
    @TryCatch('Failed to check company existence')
    static async checkCompanyExists(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }
        const userId = req.user._id.toString();
        const exists = await CompanyService.checkCompanyExists(userId);
        ResponseUtil.success(res, 'Company existence checked successfully', { exists });
    }
}