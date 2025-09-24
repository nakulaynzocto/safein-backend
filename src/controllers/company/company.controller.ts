import { Request, Response, NextFunction } from 'express';
import { CompanyService } from '../../services/company/company.service';
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
     * Get company by ID
     * GET /api/companies/:id
     */
    @TryCatch('Failed to get company')
    static async getCompanyById(req: Request, res: Response, _next: NextFunction): Promise<void> {
        const { id } = req.params;
        const company = await CompanyService.getCompanyById(id);
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
     * Get all companies with pagination
     * GET /api/companies
     */
    @TryCatch('Failed to get companies')
    static async getAllCompanies(req: Request, res: Response, _next: NextFunction): Promise<void> {
        const { page = 1, limit = 10, includeDeleted = false } = req.query;
        const result = await CompanyService.getAllCompanies(
            parseInt(page as string),
            parseInt(limit as string),
            includeDeleted === 'true'
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