import { Router } from 'express';

import { SuperAdminController } from '../../controllers/internal/superAdmin.controller';
import { UploadController } from '../../controllers/upload/upload.controller';
import { verifyMasterToken } from '../../middlewares/auth/masterToken.middleware';
import { validateFileUpload, fileSizeLimit } from '../../middlewares/security';
import { asyncWrapper } from '../../middlewares/asyncWrapper';
import { UPLOAD_CONFIG } from '../../utils/cloudinary';

const router = Router();
const controller = new SuperAdminController();

// Multer Configuration
import { upload } from '../../middlewares/multer.middleware';

import { auditLogger } from '../../middlewares/audit/audit.middleware';

// All routes here are protected by Master Token
router.use(verifyMasterToken);
router.use(auditLogger);

// Dashboard & Stats
router.get('/dashboard-summary', controller.getDashboardStats);

// User Management
router.get('/users', controller.getAllUsers);
router.get('/users/:id', controller.getUserById);
router.post('/users', controller.createUser);
router.put('/users/:id/profile', controller.updateUserProfile);
router.post('/users/:id/subscription', controller.assignSubscription);
router.delete('/users/:id/subscription', controller.cancelSubscription);
router.get('/users/:id/subscription-history', controller.getSubscriptionHistory);
router.put('/users/:id', controller.updateUser); // Status/Role update
router.delete('/users/:id', controller.deleteUser);
router.post('/users/:id/impersonate', controller.impersonateUser);

// Subscriptions
router.get('/subscriptions', controller.getSubscriptionPlans);
router.post('/subscriptions', controller.createSubscriptionPlan);
router.put('/subscriptions/:id', controller.updateSubscriptionPlan);

// Audit & Security
router.get('/audit-logs', controller.getAuditLogs);

// Controls
router.post('/feature-toggle', controller.toggleFeature);



// File Upload (Internal)
router.post(
    '/upload',
    fileSizeLimit(UPLOAD_CONFIG.MAX_FILE_SIZE),
    upload.single('file'),
    validateFileUpload,
    asyncWrapper(UploadController.uploadFile)
);

// SafeIn Profile (Internal)
import { SafeinProfileController } from '../../controllers/safeinProfile/safeinProfile.controller';
router.get('/safein-profile', SafeinProfileController.getSafeinProfile);
router.put('/safein-profile', SafeinProfileController.updateSafeinProfile);

export default router;
