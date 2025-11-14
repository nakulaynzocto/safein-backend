import { Router } from 'express';
import { UserController } from '../../controllers/user/user.controller';
import {
    protect,
    validateRequest,
    authLimiter,
    passwordResetLimiter
} from '../../middlewares';
import { asyncWrapper } from '../../middlewares/asyncWrapper';
import {
    createUserValidation,
    loginValidation,
    updateUserValidation,
    changePasswordValidation,
    forgotPasswordValidation,
    resetPasswordValidation,
    getUserByIdValidation,
    getUsersValidation,
    verifyOtpValidation,
    resendOtpValidation
} from '../../validations/user/user.validation';

const router = Router();

router.post('/register',
    authLimiter,
    validateRequest(createUserValidation),
    asyncWrapper(UserController.register)
);

router.post('/login',
    authLimiter,
    validateRequest(loginValidation),
    asyncWrapper(UserController.login)
);

router.post('/forgot-password',
    passwordResetLimiter,
    validateRequest(forgotPasswordValidation),
    asyncWrapper(UserController.forgotPassword)
);

router.post('/reset-password',
    passwordResetLimiter,
    validateRequest(resetPasswordValidation),
    asyncWrapper(UserController.resetPassword)
);

router.post('/verify-otp',
    authLimiter,
    validateRequest(verifyOtpValidation),
    asyncWrapper(UserController.verifyOtp)
);

router.post('/resend-otp',
    authLimiter,
    validateRequest(resendOtpValidation),
    asyncWrapper(UserController.resendOtp)
);

router.use(protect);

router.get('/profile', asyncWrapper(UserController.getProfile));
router.put('/profile',
    validateRequest(updateUserValidation),
    asyncWrapper(UserController.updateProfile)
);
router.post('/change-password',
    validateRequest(changePasswordValidation),
    asyncWrapper(UserController.changePassword)
);
router.post('/logout', asyncWrapper(UserController.logout));

router.get('/:id',
    validateRequest(getUserByIdValidation),
    asyncWrapper(UserController.getUserById)
);

router.put('/:id',
    validateRequest(getUserByIdValidation),
    validateRequest(updateUserValidation),
    asyncWrapper(UserController.updateUserById)
);

router.get('/',
    validateRequest(getUsersValidation),
    asyncWrapper(UserController.getAllUsers)
);

router.delete('/:id',
    validateRequest(getUserByIdValidation),
    asyncWrapper(UserController.deleteUserById)
);

router.put('/:id/restore',
    validateRequest(getUserByIdValidation),
    asyncWrapper(UserController.restoreUserById)
);

router.post('/:id/verify-email',
    validateRequest(getUserByIdValidation),
    asyncWrapper(UserController.verifyEmail)
);

export default router;
