import { Router } from 'express';
import { AppointmentController } from '../../controllers/appointment/appointment.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { verifyToken } from '../../middlewares/auth.middleware';
import { asyncWrapper } from '../../middlewares/asyncWrapper';
import {
    createAppointmentValidation,
    updateAppointmentValidation,
    appointmentParamsValidation,
    appointmentIdParamsValidation,
    getAppointmentsValidation,
    bulkUpdateAppointmentsValidation,
    employeeIdParamsValidation,
    dateRangeValidation
} from '../../validations/appointment/appointment.validation';

const router = Router();

router.use(verifyToken);

router.post(
    '/',
    validateRequest(createAppointmentValidation),
    asyncWrapper(AppointmentController.createAppointment)
);

router.get(
    '/',
    validateRequest(getAppointmentsValidation),
    asyncWrapper(AppointmentController.getAllAppointments)
);

router.get(
    '/stats',
    asyncWrapper(AppointmentController.getAppointmentStats)
);

router.put(
    '/bulk-update',
    validateRequest(bulkUpdateAppointmentsValidation),
    asyncWrapper(AppointmentController.bulkUpdateAppointments)
);

router.get(
    '/employee/:employeeId',
    validateRequest(employeeIdParamsValidation),
    validateRequest(getAppointmentsValidation),
    asyncWrapper(AppointmentController.getAppointmentsByEmployee)
);

router.get(
    '/date-range',
    validateRequest(dateRangeValidation),
    validateRequest(getAppointmentsValidation),
    asyncWrapper(AppointmentController.getAppointmentsByDateRange)
);

router.post(
    '/check-in',
    asyncWrapper(AppointmentController.checkInAppointment)
);

router.post(
    '/check-out',
    asyncWrapper(AppointmentController.checkOutAppointment)
);

router.get(
    '/:id',
    validateRequest(appointmentParamsValidation),
    asyncWrapper(AppointmentController.getAppointmentById)
);

router.put(
    '/:id',
    validateRequest(appointmentParamsValidation),
    validateRequest(updateAppointmentValidation),
    asyncWrapper(AppointmentController.updateAppointment)
);

router.delete(
    '/:id',
    validateRequest(appointmentParamsValidation),
    asyncWrapper(AppointmentController.deleteAppointment)
);

router.put(
    '/:id/restore',
    validateRequest(appointmentParamsValidation),
    asyncWrapper(AppointmentController.restoreAppointment)
);

router.put(
    '/:id/cancel',
    validateRequest(appointmentParamsValidation),
    asyncWrapper(AppointmentController.cancelAppointment)
);

router.put(
    '/:id/approve',
    validateRequest(appointmentParamsValidation),
    asyncWrapper(AppointmentController.approveAppointment)
);

router.put(
    '/:id/reject',
    validateRequest(appointmentParamsValidation),
    asyncWrapper(AppointmentController.rejectAppointment)
);

router.get(
    '/appointment/:appointmentId',
    validateRequest(appointmentIdParamsValidation),
    asyncWrapper(AppointmentController.getAppointmentByAppointmentId)
);

export default router;
