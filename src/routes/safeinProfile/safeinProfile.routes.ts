import { Router } from 'express';
import { SafeinProfileController } from '../../controllers/safeinProfile/safeinProfile.controller';
import { verifyToken } from '../../middlewares/auth.middleware';

const router = Router();

/**
 * @route GET /api/safein-profile
 * @desc Get SafeIn profile (singleton)
 * @access Private
 */
router.get('/', verifyToken, SafeinProfileController.getSafeinProfile);

/**
 * @route PUT /api/safein-profile
 * @desc Update SafeIn profile
 * @access Private
 */
router.put('/', verifyToken, SafeinProfileController.updateSafeinProfile);

export default router;
