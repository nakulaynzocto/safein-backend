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

// WhatsApp verification routes
router.post('/whatsapp/verify/initiate', asyncWrapper(SettingsController.initiateWhatsAppVerification));
router.post('/whatsapp/verify/confirm', asyncWrapper(SettingsController.verifyWhatsAppOTP));

// SMTP configuration routes
router.post('/smtp', asyncWrapper(SettingsController.saveSMTPConfig));
router.delete('/smtp', asyncWrapper(SettingsController.removeSMTPConfig));

export default router;



