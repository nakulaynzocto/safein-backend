import { Router } from 'express';
import { EmployeeDashboardController } from '../../controllers/employee/employeeDashboard.controller';
import { verifyToken } from '../../middlewares/auth.middleware';
import { verifyEmployee } from '../../middlewares/employee.middleware';
import { asyncWrapper } from '../../middlewares/asyncWrapper';
import { userLimiter } from '../../middlewares';
import { validateRequest } from '../../middlewares/validateRequest';
import { appointmentParamsValidation } from '../../validations/appointment/appointment.validation';
import { getAppointmentsValidation } from '../../validations/appointment/appointment.validation';

const router = Router();

// All employee dashboard routes require authentication and employee verification
router.use(verifyToken);
router.use(verifyEmployee);
router.use(userLimiter);

// Dashboard stats
router.get(
  '/dashboard/stats',
  asyncWrapper(EmployeeDashboardController.getDashboardStats)
);

// Get employee appointments
router.get(
  '/appointments',
  validateRequest(getAppointmentsValidation),
  asyncWrapper(EmployeeDashboardController.getEmployeeAppointments)
);

// Approve appointment (employee can only approve their own)
router.put(
  '/appointments/:id/approve',
  validateRequest(appointmentParamsValidation),
  asyncWrapper(EmployeeDashboardController.approveAppointment)
);

// Reject appointment (employee can only reject their own)
router.put(
  '/appointments/:id/reject',
  validateRequest(appointmentParamsValidation),
  asyncWrapper(EmployeeDashboardController.rejectAppointment)
);

export default router;

