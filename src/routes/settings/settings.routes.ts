import { Router } from 'express';
import { SettingsController } from '../../controllers/settings/settings.controller';
import { protect, validateRequest } from '../../middlewares';
import { asyncWrapper } from '../../middlewares/asyncWrapper';
import { updateSettingsValidation } from '../../validations/settings/settings.validation';

const router = Router();

// All routes require authentication
router.use(protect);

router.get('/', asyncWrapper(SettingsController.getSettings));
router.put('/',
    validateRequest(updateSettingsValidation),
    asyncWrapper(SettingsController.updateSettings)
);

export default router;



