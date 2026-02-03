import { Router } from 'express';
import { NotificationController } from '../../controllers/notification/notification.controller';
import { verifyToken } from '../../middlewares/auth.middleware';
import { asyncWrapper } from '../../middlewares/asyncWrapper';

const router = Router();

// All routes require authentication
router.use(verifyToken);

router.get('/', asyncWrapper(NotificationController.getNotifications));
router.get('/unread-count', asyncWrapper(NotificationController.getUnreadCount));
router.patch('/:id/read', asyncWrapper(NotificationController.markAsRead));
router.patch('/read-all', asyncWrapper(NotificationController.markAllAsRead));
router.delete('/:id', asyncWrapper(NotificationController.deleteNotification));
router.delete('/', asyncWrapper(NotificationController.deleteAllNotifications));

export default router;

