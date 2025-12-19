import { Router } from 'express';
import multer = require('multer');
import { EmployeeController } from '../../controllers/employee/employee.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { verifyToken } from '../../middlewares/auth.middleware';
import { asyncWrapper } from '../../middlewares/asyncWrapper';
import { checkTrialLimits } from '../../middlewares/checkTrialLimits.middleware';
import {
    createEmployeeValidation,
    updateEmployeeValidation,
    employeeParamsValidation,
    getEmployeesValidation,
    updateEmployeeStatusValidation,
    bulkUpdateEmployeesValidation
} from '../../validations/employee/employee.validation';

const router = Router();

// Configure multer for Excel file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
    },
    fileFilter: (_req, file, cb) => {
        const allowedMimes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'text/csv' // .csv
        ];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only Excel files (.xlsx, .xls) are allowed'));
        }
    }
});

router.use(verifyToken);

router.post(
    '/',
    checkTrialLimits,
    validateRequest(createEmployeeValidation),
    asyncWrapper(EmployeeController.createEmployee)
);

router.get(
    '/',
    validateRequest(getEmployeesValidation),
    asyncWrapper(EmployeeController.getAllEmployees)
);

router.get(
    '/stats',
    asyncWrapper(EmployeeController.getEmployeeStats)
);

router.get(
    '/template',
    asyncWrapper(EmployeeController.downloadTemplate)
);

router.post(
    '/bulk-create',
    checkTrialLimits,
    upload.single('file'),
    asyncWrapper(EmployeeController.bulkCreateEmployees)
);

router.get(
    '/trashed',
    validateRequest(getEmployeesValidation),
    asyncWrapper(EmployeeController.getTrashedEmployees)
);

router.get(
    '/:id',
    validateRequest(employeeParamsValidation),
    asyncWrapper(EmployeeController.getEmployeeById)
);

router.put(
    '/:id',
    validateRequest(employeeParamsValidation),
    validateRequest(updateEmployeeValidation),
    asyncWrapper(EmployeeController.updateEmployee)
);

router.put(
    '/:id/status',
    validateRequest(employeeParamsValidation),
    validateRequest(updateEmployeeStatusValidation),
    asyncWrapper(EmployeeController.updateEmployeeStatus)
);

router.put(
    '/:id/restore',
    validateRequest(employeeParamsValidation),
    asyncWrapper(EmployeeController.restoreEmployee)
);

router.put(
    '/bulk-update',
    validateRequest(bulkUpdateEmployeesValidation),
    asyncWrapper(EmployeeController.bulkUpdateEmployees)
);

router.delete(
    '/:id',
    validateRequest(employeeParamsValidation),
    asyncWrapper(EmployeeController.deleteEmployee)
);

export default router;
