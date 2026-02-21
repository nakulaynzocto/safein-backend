import { Router } from 'express';
import { UserController } from '../../controllers/user/user.controller';
import {
    protect,
    verifyTokenOptional,
    validateRequest,
    passwordResetLimiter,
    userLimiter
} from '../../middlewares';
import {
    authLimiter,
    bruteForceProtection,
    checkAccountLock,
    loginAttemptTracker
} from '../../middlewares/security';
import { decryptLoginPayload, decryptRegisterPayload } from '../../middlewares/auth/decrypt';
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
    decryptRegisterPayload,
    validateRequest(createUserValidation),
    asyncWrapper(UserController.register)
);

router.post('/login',
    // authLimiter,
    bruteForceProtection,
    checkAccountLock,
    decryptLoginPayload,
    validateRequest(loginValidation),
    loginAttemptTracker,
    asyncWrapper(UserController.login)
);

router.post('/google-login',
    asyncWrapper(UserController.googleLogin)
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

router.post('/setup-employee-password',
    passwordResetLimiter,
    validateRequest(resetPasswordValidation),
    asyncWrapper(UserController.setupEmployeePassword)
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

router.post('/exchange-impersonation-token',
    authLimiter,
    asyncWrapper(UserController.exchangeImpersonationToken)
);

// Logout should be idempotent: allow calling without Authorization header
// This prevents noisy 401s during auth transitions (e.g., registration/login flows)
router.post('/logout', verifyTokenOptional, asyncWrapper(UserController.logout));

router.use(protect);
router.use(userLimiter);

router.get('/profile', asyncWrapper(UserController.getProfile));
router.put('/profile',
    validateRequest(updateUserValidation),
    asyncWrapper(UserController.updateProfile)
);
router.post('/change-password',
    passwordResetLimiter,
    validateRequest(changePasswordValidation),
    asyncWrapper(UserController.changePassword)
);

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
