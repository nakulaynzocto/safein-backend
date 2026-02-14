import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { NotificationService } from '../../services/notification/notification.service';
import { ResponseUtil } from '../../utils/response.util';
import { AppError } from '../../middlewares/errorHandler';
import { ERROR_CODES } from '../../utils/constants';
import { TryCatch } from '../../decorators';
import { IGetNotificationsQuery } from '../../types/notification/notification.types';

export class NotificationController {
    /**
     * Get notifications for the authenticated user
     * GET /api/notifications
     */
    @TryCatch('Failed to get notifications')
    static async getNotifications(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }

        const userId = req.user._id.toString();
        const query: IGetNotificationsQuery = {
            page: req.query.page ? Number(req.query.page) : undefined,
            limit: req.query.limit ? Number(req.query.limit) : undefined,
            read: req.query.read === 'true' ? true : req.query.read === 'false' ? false : undefined,
            type: req.query.type as any,
        };

        const result = await NotificationService.getNotifications(userId, query);
        ResponseUtil.success(res, 'Notifications retrieved successfully', result);
    }

    /**
     * Mark a notification as read
     * PATCH /api/notifications/:id/read
     */
    @TryCatch('Failed to mark notification as read')
    static async markAsRead(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }

        const { id } = req.params;
        const userId = req.user._id.toString();

        const notification = await NotificationService.markAsRead(id, userId);
        ResponseUtil.success(res, 'Notification marked as read', notification);
    }

    /**
     * Mark all notifications as read
     * PATCH /api/notifications/read-all
     */
    @TryCatch('Failed to mark all notifications as read')
    static async markAllAsRead(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }

        const userId = req.user._id.toString();
        const result = await NotificationService.markAllAsRead(userId);
        ResponseUtil.success(res, 'All notifications marked as read', result);
    }

    /**
     * Delete a notification
     * DELETE /api/notifications/:id
     */
    @TryCatch('Failed to delete notification')
    static async deleteNotification(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }

        const { id } = req.params;
        const userId = req.user._id.toString();

        await NotificationService.deleteNotification(id, userId);
        ResponseUtil.success(res, 'Notification deleted successfully', null, 204);
    }

    /**
     * Delete all notifications
     * DELETE /api/notifications
     */
    @TryCatch('Failed to delete all notifications')
    static async deleteAllNotifications(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }

        const userId = req.user._id.toString();
        const result = await NotificationService.deleteAllNotifications(userId);
        ResponseUtil.success(res, 'All notifications deleted successfully', result);
    }

    /**
     * Get unread count
     * GET /api/notifications/unread-count
     */
    @TryCatch('Failed to get unread count')
    static async getUnreadCount(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }

        const userId = req.user._id.toString();
        const count = await NotificationService.getUnreadCount(userId);
        ResponseUtil.success(res, 'Unread count retrieved successfully', { unreadCount: count });
    }
}

