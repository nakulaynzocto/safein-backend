import { Router } from 'express';
import { CompanyController } from '../../controllers/company/company.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { verifyToken } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler.util';
import {
    createCompanyValidation,
    updateCompanyValidation,
    companyParamsValidation
} from '../../validations/company/company.validation';

const router = Router();

// Create company
router.post(
    '/',
    verifyToken,
    validateRequest(createCompanyValidation),
    asyncHandler(CompanyController.createCompany)
);

// Get company by ID
router.get(
    '/:id',
    verifyToken,
    validateRequest(companyParamsValidation),
    asyncHandler(CompanyController.getCompanyById)
);

// Update company
router.put(
    '/:id',
    verifyToken,
    validateRequest(updateCompanyValidation),
    asyncHandler(CompanyController.updateCompany)
);

// Delete company
router.delete(
    '/:id',
    verifyToken,
    validateRequest(companyParamsValidation),
    asyncHandler(CompanyController.deleteCompany)
);

export default router;