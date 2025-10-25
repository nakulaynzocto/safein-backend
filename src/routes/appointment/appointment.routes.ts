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

// Protected routes (require authentication)
router.use(verifyToken);

// Create appointment
router.post(
    '/',
    validateRequest(createAppointmentValidation),
    asyncWrapper(AppointmentController.createAppointment)
);

// Get all appointments with pagination and filtering
router.get(
    '/',
    validateRequest(getAppointmentsValidation),
    asyncWrapper(AppointmentController.getAllAppointments)
);

// Get appointment statistics
router.get(
    '/stats',
    asyncWrapper(AppointmentController.getAppointmentStats)
);



// Bulk update appointments
router.put(
    '/bulk-update',
    validateRequest(bulkUpdateAppointmentsValidation),
    asyncWrapper(AppointmentController.bulkUpdateAppointments)
);

// Get appointments by employee
router.get(
    '/employee/:employeeId',
    validateRequest(employeeIdParamsValidation),
    validateRequest(getAppointmentsValidation),
    asyncWrapper(AppointmentController.getAppointmentsByEmployee)
);

// Get appointments by date range
router.get(
    '/date-range',
    validateRequest(dateRangeValidation),
    validateRequest(getAppointmentsValidation),
    asyncWrapper(AppointmentController.getAppointmentsByDateRange)
);

// Check in appointment
router.post(
    '/check-in',
    asyncWrapper(AppointmentController.checkInAppointment)
);

// Check out appointment
router.post(
    '/check-out',
    asyncWrapper(AppointmentController.checkOutAppointment)
);

// Get appointment by ID
router.get(
    '/:id',
    validateRequest(appointmentParamsValidation),
    asyncWrapper(AppointmentController.getAppointmentById)
);

// Update appointment
router.put(
    '/:id',
    validateRequest(appointmentParamsValidation),
    validateRequest(updateAppointmentValidation),
    asyncWrapper(AppointmentController.updateAppointment)
);

// Soft delete appointment
router.delete(
    '/:id',
    validateRequest(appointmentParamsValidation),
    asyncWrapper(AppointmentController.deleteAppointment)
);

// Restore appointment from trash
router.put(
    '/:id/restore',
    validateRequest(appointmentParamsValidation),
    asyncWrapper(AppointmentController.restoreAppointment)
);

// Cancel appointment
router.put(
    '/:id/cancel',
    validateRequest(appointmentParamsValidation),
    asyncWrapper(AppointmentController.cancelAppointment)
);

// Approve appointment
router.put(
    '/:id/approve',
    validateRequest(appointmentParamsValidation),
    asyncWrapper(AppointmentController.approveAppointment)
);

// Reject appointment
router.put(
    '/:id/reject',
    validateRequest(appointmentParamsValidation),
    asyncWrapper(AppointmentController.rejectAppointment)
);

// Get appointment by appointment ID
router.get(
    '/appointment/:appointmentId',
    validateRequest(appointmentIdParamsValidation),
    asyncWrapper(AppointmentController.getAppointmentByAppointmentId)
);

export default router;
