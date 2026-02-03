import { Notification } from '../../models/notification/notification.model';
import { ICreateNotificationDTO, IGetNotificationsQuery, INotificationListResponse, INotificationResponse } from '../../types/notification/notification.types';
import { AppError } from '../../middlewares/errorHandler';
import { ERROR_CODES } from '../../utils/constants';
import { toObjectId } from '../../utils/idExtractor.util';

export class NotificationService {
    /**
     * Create a new notification
     */
    static async createNotification(data: ICreateNotificationDTO): Promise<INotificationResponse> {
        const { userId, type, title, message, appointmentId, metadata } = data;

        const userIdObjectId = toObjectId(userId);
        if (!userIdObjectId) {
            throw new AppError('Invalid user ID format', ERROR_CODES.BAD_REQUEST);
        }

        const notificationData: any = {
            userId: userIdObjectId,
            type,
            title,
            message,
            read: false,
        };

        if (appointmentId) {
            const appointmentIdObjectId = toObjectId(appointmentId);
            if (appointmentIdObjectId) {
                notificationData.appointmentId = appointmentIdObjectId;
            }
        }

        if (metadata) {
            notificationData.metadata = metadata;
        }

        const notification = new Notification(notificationData);
        await notification.save();

        return notification.toObject() as unknown as INotificationResponse;
    }

    /**
     * Get notifications for a user with pagination
     */
    static async getNotifications(userId: string, query: IGetNotificationsQuery = {}): Promise<INotificationListResponse> {
        const {
            page = 1,
            limit = 50,
            read,
            type,
        } = query;

        const userIdObjectId = toObjectId(userId);
        if (!userIdObjectId) {
            throw new AppError('Invalid user ID format', ERROR_CODES.BAD_REQUEST);
        }

        const filter: any = { userId: userIdObjectId };

        if (read !== undefined) {
            filter.read = read;
        }

        if (type) {
            filter.type = type;
        }

        const skip = (page - 1) * limit;

        // Get notifications and total count in parallel
        const [notifications, totalNotifications, unreadCount] = await Promise.all([
            Notification.find(filter)
                .sort({ createdAt: -1 }) // Most recent first
                .skip(skip)
                .limit(limit)
                .lean(),
            Notification.countDocuments(filter),
            Notification.countDocuments({ userId: userIdObjectId, read: false }),
        ]);

        const totalPages = Math.ceil(totalNotifications / limit);

        return {
            notifications: notifications as unknown as INotificationResponse[],
            unreadCount,
            pagination: {
                currentPage: page,
                totalPages,
                totalNotifications,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        };
    }

    /**
     * Mark a notification as read
     */
    static async markAsRead(notificationId: string, userId: string): Promise<INotificationResponse> {
        const notificationIdObjectId = toObjectId(notificationId);
        const userIdObjectId = toObjectId(userId);

        if (!notificationIdObjectId) {
            throw new AppError('Invalid notification ID format', ERROR_CODES.BAD_REQUEST);
        }

        if (!userIdObjectId) {
            throw new AppError('Invalid user ID format', ERROR_CODES.BAD_REQUEST);
        }

        const notification = await Notification.findOne({
            _id: notificationIdObjectId,
            userId: userIdObjectId,
        });

        if (!notification) {
            throw new AppError('Notification not found', ERROR_CODES.NOT_FOUND);
        }

        if (!notification.read) {
            notification.read = true;
            notification.readAt = new Date();
            await notification.save();
        }

        return notification.toObject() as unknown as INotificationResponse;
    }

    /**
     * Mark all notifications as read for a user
     */
    static async markAllAsRead(userId: string): Promise<{ count: number }> {
        const userIdObjectId = toObjectId(userId);
        if (!userIdObjectId) {
            throw new AppError('Invalid user ID format', ERROR_CODES.BAD_REQUEST);
        }

        const result = await Notification.updateMany(
            { userId: userIdObjectId, read: false },
            { read: true, readAt: new Date() }
        );

        return { count: result.modifiedCount };
    }

    /**
     * Delete a notification
     */
    static async deleteNotification(notificationId: string, userId: string): Promise<void> {
        const notificationIdObjectId = toObjectId(notificationId);
        const userIdObjectId = toObjectId(userId);

        if (!notificationIdObjectId) {
            throw new AppError('Invalid notification ID format', ERROR_CODES.BAD_REQUEST);
        }

        if (!userIdObjectId) {
            throw new AppError('Invalid user ID format', ERROR_CODES.BAD_REQUEST);
        }

        const notification = await Notification.findOneAndDelete({
            _id: notificationIdObjectId,
            userId: userIdObjectId,
        });

        if (!notification) {
            throw new AppError('Notification not found', ERROR_CODES.NOT_FOUND);
        }
    }

    /**
     * Delete all notifications for a user
     */
    static async deleteAllNotifications(userId: string): Promise<{ count: number }> {
        const userIdObjectId = toObjectId(userId);
        if (!userIdObjectId) {
            throw new AppError('Invalid user ID format', ERROR_CODES.BAD_REQUEST);
        }

        const result = await Notification.deleteMany({ userId: userIdObjectId });

        return { count: result.deletedCount || 0 };
    }

    /**
     * Get unread count for a user
     */
    static async getUnreadCount(userId: string): Promise<number> {
        const userIdObjectId = toObjectId(userId);
        if (!userIdObjectId) {
            return 0;
        }

        return await Notification.countDocuments({ userId: userIdObjectId, read: false });
    }
}

