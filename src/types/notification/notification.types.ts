export type NotificationType = 'appointment_approved' | 'appointment_rejected' | 'appointment_created' | 'appointment_deleted' | 'appointment_status_changed' | 'general';

export interface INotificationResponse {
    _id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    read: boolean;
    readAt?: Date | null;
    appointmentId?: string;
    metadata?: {
        [key: string]: any;
    };
    createdAt: Date;
    updatedAt: Date;
}

export interface ICreateNotificationDTO {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    appointmentId?: string;
    metadata?: {
        [key: string]: any;
    };
}

export interface IGetNotificationsQuery {
    page?: number;
    limit?: number;
    read?: boolean; // Filter by read status
    type?: NotificationType; // Filter by type
}

export interface INotificationListResponse {
    notifications: INotificationResponse[];
    unreadCount: number;
    pagination: {
        currentPage: number;
        totalPages: number;
        totalNotifications: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}

