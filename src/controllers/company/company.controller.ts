import { Request, Response, NextFunction } from 'express';
import { CompanyService } from '../../services/company/company.service';
import { ResponseUtil } from '../../utils';
import { ICreateCompanyDTO, IUpdateCompanyDTO } from '../../types/company/company.types';
import { ERROR_CODES } from '../../utils/constants';
import { TryCatch } from '../../decorators';

export class CompanyController {
    /**
     * Create a new company
     * POST /api/companies
     */
    @TryCatch('Failed to create company')
    static async createCompany(req: Request, res: Response, _next: NextFunction): Promise<void> {
        const companyData: ICreateCompanyDTO = req.body;
        const company = await CompanyService.createCompany(companyData);
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
     * Delete company
     * DELETE /api/companies/:id
     */
    @TryCatch('Failed to delete company')
    static async deleteCompany(req: Request, res: Response, _next: NextFunction): Promise<void> {
        const { id } = req.params;
        await CompanyService.deleteCompany(id);
        ResponseUtil.success(res, 'Company deleted successfully');
    }
}