import { Router } from 'express';
import { CompanyController } from '../../controllers/company/company.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { verifyToken } from '../../middlewares/auth.middleware';
import { asyncWrapper } from '../../middlewares/asyncWrapper';
import {
    createCompanyValidation,
    updateCompanyValidation,
    companyParamsValidation
} from '../../validations/company/company.validation';

const router = Router();

// Protected routes (require authentication)
router.use(verifyToken);

// Create company
router.post(
    '/',
    validateRequest(createCompanyValidation),
    asyncWrapper(CompanyController.createCompany)
);

// Get all companies
router.get(
    '/',
    asyncWrapper(CompanyController.getAllCompanies)
);

// Get company by ID
router.get(
    '/:id',
    validateRequest(companyParamsValidation),
    asyncWrapper(CompanyController.getCompanyById)
);

// Update company
router.put(
    '/:id',
    validateRequest(updateCompanyValidation),
    asyncWrapper(CompanyController.updateCompany)
);

// Soft delete company
router.delete(
    '/:id',
    validateRequest(companyParamsValidation),
    asyncWrapper(CompanyController.deleteCompany)
);

// Restore company from trash
router.put(
    '/:id/restore',
    validateRequest(companyParamsValidation),
    asyncWrapper(CompanyController.restoreCompany)
);

export default router;