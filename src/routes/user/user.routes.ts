import { Router } from 'express';
import { UserController } from '../../controllers/user/user.controller';
import {
    protect,
    validateRequest,
    authLimiter,
    passwordResetLimiter
} from '../../middlewares';
import {
    createUserValidation,
    loginValidation,
    updateUserValidation,
    changePasswordValidation,
    forgotPasswordValidation,
    resetPasswordValidation,
    getUserByIdValidation,
    getUsersValidation
} from '../../validations/user/user.validation';

const router = Router();

// Public routes
router.post('/register',
    authLimiter,
    validateRequest(createUserValidation),
    UserController.register
);

router.post('/login',
    authLimiter,
    validateRequest(loginValidation),
    UserController.login
);

router.post('/forgot-password',
    passwordResetLimiter,
    validateRequest(forgotPasswordValidation),
    UserController.forgotPassword
);

router.post('/reset-password',
    passwordResetLimiter,
    validateRequest(resetPasswordValidation),
    UserController.resetPassword
);

// Protected routes (require authentication)
router.use(protect); // All routes below require authentication

router.get('/profile', UserController.getProfile);
router.put('/profile',
    validateRequest(updateUserValidation),
    UserController.updateProfile
);
router.post('/change-password',
    validateRequest(changePasswordValidation),
    UserController.changePassword
);
router.post('/logout', UserController.logout);

// Admin routes (in a real app, you'd add admin role check)
router.get('/',
    validateRequest(getUsersValidation),
    UserController.getAllUsers
);

router.get('/:id',
    validateRequest(getUserByIdValidation),
    UserController.getUserById
);

router.put('/:id',
    validateRequest(getUserByIdValidation),
    validateRequest(updateUserValidation),
    UserController.updateUserById
);

router.delete('/:id',
    validateRequest(getUserByIdValidation),
    UserController.deleteUserById
);

router.post('/:id/verify-email',
    validateRequest(getUserByIdValidation),
    UserController.verifyEmail
);

export default router;
