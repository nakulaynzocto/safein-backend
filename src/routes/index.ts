import { Router } from 'express';
import userRoutes from './user/user.routes';
import employeeRoutes from './employee/employee.routes';
import appointmentRoutes from './appointment/appointment.routes';
import visitorRoutes from './visitor/visitor.routes';
import subscriptionRoutes from './subscription/subscription.routes';
import userSubscriptionRoutes from './userSubscription/userSubscription.routes';
import uploadRoutes from './upload/upload.routes';
import stripeRoutes from './stripe/stripe.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

router.use('/users', userRoutes);
router.use('/employees', employeeRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/visitors', visitorRoutes);
router.use('/subscription-plans', subscriptionRoutes);
router.use('/user-subscriptions', userSubscriptionRoutes);
router.use('/upload', uploadRoutes);
router.use('/stripe', stripeRoutes);

export default router;
