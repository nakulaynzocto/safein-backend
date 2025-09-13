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

// Delete company
router.delete(
    '/:id',
    validateRequest(companyParamsValidation),
    asyncWrapper(CompanyController.deleteCompany)
);

export default router;