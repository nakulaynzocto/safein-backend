import { Router } from 'express';
import multer = require('multer');
import { EmployeeController } from '../../controllers/employee/employee.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { verifyToken } from '../../middlewares/auth.middleware';
import { asyncWrapper } from '../../middlewares/asyncWrapper';
import { checkSubscriptionStatus } from '../../middlewares/checkSubscriptionStatus.middleware';
import { userLimiter } from '../../middlewares';
import {
    createEmployeeValidation,
    updateEmployeeValidation,
    employeeParamsValidation,
    getEmployeesValidation
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
router.use(userLimiter);

router.post(
    '/',
    checkSubscriptionStatus,
    validateRequest(createEmployeeValidation),
    asyncWrapper(EmployeeController.createEmployee)
);

router.get(
    '/',
    validateRequest(getEmployeesValidation),
    asyncWrapper(EmployeeController.getAllEmployees)
);

router.get(
    '/count',
    asyncWrapper(EmployeeController.getEmployeeCount)
);



router.get(
    '/template',
    asyncWrapper(EmployeeController.downloadTemplate)
);

router.post(
    '/bulk-create',
    checkSubscriptionStatus,
    upload.single('file'),
    asyncWrapper(EmployeeController.bulkCreateEmployees)
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





router.delete(
    '/:id',
    validateRequest(employeeParamsValidation),
    asyncWrapper(EmployeeController.deleteEmployee)
);


router.post(
    '/:id/send-otp',
    // asyncWrapper(checkSubscriptionStatus), // Should verification be blocked by subscription? Probably yes.
    asyncWrapper(EmployeeController.sendOtp)
);

router.post(
    '/:id/verify-otp',
    asyncWrapper(EmployeeController.verifyOtp)
);

export default router;
