import { Router } from 'express';
import userRoutes from './user/user.routes';
import companyRoutes from './company/company.routes';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
router.use('/users', userRoutes);
router.use('/companies', companyRoutes);

export default router;
