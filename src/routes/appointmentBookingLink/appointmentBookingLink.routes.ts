import { Router } from 'express';
import { AppointmentBookingLinkController } from '../../controllers/appointmentBookingLink/appointmentBookingLink.controller';
import { verifyToken } from '../../middlewares/auth.middleware';
import { asyncWrapper } from '../../middlewares/asyncWrapper';

const router = Router();

router.post(
  '/',
  verifyToken,
  asyncWrapper(AppointmentBookingLinkController.createAppointmentLink)
);

router.get(
  '/',
  verifyToken,
  asyncWrapper(AppointmentBookingLinkController.getAllAppointmentLinks)
);

router.get(
  '/check-visitor',
  verifyToken,
  asyncWrapper(AppointmentBookingLinkController.checkVisitorExists)
);

router.get(
  '/public/:token',
  asyncWrapper(AppointmentBookingLinkController.getAppointmentLinkByToken)
);

router.post(
  '/mark-booked/:token',
  asyncWrapper(AppointmentBookingLinkController.markAsBooked)
);

router.post(
  '/public/:token/create-visitor',
  asyncWrapper(AppointmentBookingLinkController.createVisitorThroughLink)
);

router.post(
  '/public/:token/create-appointment',
  asyncWrapper(AppointmentBookingLinkController.createAppointmentThroughLink)
);

router.delete(
  '/:id',
  verifyToken,
  asyncWrapper(AppointmentBookingLinkController.deleteAppointmentLink)
);

export default router;

