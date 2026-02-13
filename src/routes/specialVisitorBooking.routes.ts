import { Router } from 'express';
import { SpecialVisitorBookingController } from '../controllers/specialVisitorBooking/specialVisitorBooking.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.post(
    '/',
    protect,
    SpecialVisitorBookingController.createBooking
);

router.post(
    '/verify-otp',
    protect,
    SpecialVisitorBookingController.verifyOtp
);

router.post(
    '/resend',
    protect,
    SpecialVisitorBookingController.resendOtp
);

router.get(
    '/',
    protect,
    SpecialVisitorBookingController.getAllBookings
);

router.patch(
    '/update-note',
    protect,
    SpecialVisitorBookingController.updateNote
);

export default router;
