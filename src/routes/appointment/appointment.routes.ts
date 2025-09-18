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
    checkInValidation,
    checkOutValidation,
    getAppointmentsValidation,
    bulkUpdateAppointmentsValidation,
    appointmentSearchValidation,
    calendarValidation,
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

// Get appointments calendar view
router.get(
    '/calendar',
    validateRequest(calendarValidation),
    asyncWrapper(AppointmentController.getAppointmentsCalendar)
);

// Search appointments
router.post(
    '/search',
    validateRequest(appointmentSearchValidation),
    asyncWrapper(AppointmentController.searchAppointments)
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
    validateRequest(checkInValidation),
    asyncWrapper(AppointmentController.checkInAppointment)
);

// Check out appointment
router.post(
    '/check-out',
    validateRequest(checkOutValidation),
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

// Get appointment by appointment ID
router.get(
    '/appointment/:appointmentId',
    validateRequest(appointmentIdParamsValidation),
    asyncWrapper(AppointmentController.getAppointmentByAppointmentId)
);

export default router;
