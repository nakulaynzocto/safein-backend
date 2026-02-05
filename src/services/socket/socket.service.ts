import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { CONSTANTS } from '../../utils/constants';
import { NotificationService } from '../notification/notification.service';

export enum SocketEvents {
  CONNECTION = 'connection',
  DISCONNECT = 'disconnect',
  JOIN_USER_ROOM = 'join_user_room',
  LEAVE_USER_ROOM = 'leave_user_room',
  APPOINTMENT_UPDATED = 'appointment_updated',
  APPOINTMENT_CREATED = 'appointment_created',
  APPOINTMENT_DELETED = 'appointment_deleted',
  APPOINTMENT_STATUS_CHANGED = 'appointment_status_changed',
  NEW_NOTIFICATION = 'new_notification',
}

class SocketService {
  private io: SocketIOServer | null = null;
  private static instance: SocketService;

  private constructor() { }

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  initialize(httpServer: HttpServer): SocketIOServer {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: CONSTANTS.FRONTEND_URLS,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupConnectionHandlers();
    return this.io;
  }

  private setupConnectionHandlers(): void {
    if (!this.io) return;

    this.io.on(SocketEvents.CONNECTION, (socket: Socket) => {
      socket.on(SocketEvents.JOIN_USER_ROOM, (userId: string) => {
        if (userId) {
          socket.join(`user_${userId}`);
        }
      });

      socket.on(SocketEvents.LEAVE_USER_ROOM, (userId: string) => {
        if (userId) {
          socket.leave(`user_${userId}`);
        }
      });

      socket.on(SocketEvents.DISCONNECT, () => { });
    });
  }

  getIO(): SocketIOServer | null {
    return this.io;
  }

  emitToAll(event: SocketEvents, data: any): void {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  emitToUser(userId: string, event: SocketEvents, data: any): void {
    if (this.io) {
      this.io.to(`user_${userId}`).emit(event, data);
    }
  }

  /**
   * Extract names from appointment object (handles both populated and lean objects)
   */
  private extractNames(appointment: any): { employeeName: string; visitorName: string } {
    const getName = (obj: any, fallback: string): string => {
      if (!obj) return fallback;
      if (typeof obj === 'string') return fallback;
      if (typeof obj === 'object' && obj !== null) {
        const name = obj.name || obj.fullName;
        return (name && typeof name === 'string' ? name.trim() : '') || fallback;
      }
      return fallback;
    };

    const employee = appointment?.employeeId || appointment?.employee;
    const visitor = appointment?.visitorId || appointment?.visitor;

    return {
      employeeName: getName(employee, 'Unknown Employee'),
      visitorName: getName(visitor, 'Unknown Visitor')
    };
  }

  async emitAppointmentStatusChange(userId: string, appointmentData: {
    appointmentId: string;
    status: string;
    updatedAt?: Date;
    appointment?: any;
  }, showNotification: boolean = true): Promise<void> {
    const { employeeName, visitorName } = this.extractNames(appointmentData.appointment);

    const payload = {
      ...appointmentData,
      employeeName,
      visitorName
    };

    if (showNotification) {
      // Save notification to database
      try {
        const statusMessages: { [key: string]: { title: string; message: string } } = {
          approved: {
            title: 'Appointment Approved',
            message: `${employeeName} has approved the appointment with ${visitorName}`,
          },
          rejected: {
            title: 'Appointment Rejected',
            message: `${employeeName} has rejected the appointment with ${visitorName}`,
          },
          completed: {
            title: 'Appointment Completed',
            message: `Appointment with ${visitorName} has been completed`,
          },
        };

        const statusInfo = statusMessages[appointmentData.status] || {
          title: 'Appointment Status Changed',
          message: `Appointment status has been changed to ${appointmentData.status}`,
        };

        await NotificationService.createNotification({
          userId,
          type: appointmentData.status === 'approved' ? 'appointment_approved' :
            appointmentData.status === 'rejected' ? 'appointment_rejected' :
              'appointment_status_changed',
          title: statusInfo.title,
          message: statusInfo.message,
          appointmentId: appointmentData.appointmentId,
          metadata: {
            status: appointmentData.status,
            employeeName,
            visitorName,
          },
        });
      } catch (error: any) {
        // Log error but don't fail the socket emission
        console.error('Failed to save notification to database:', error?.message || error);
      }

      this.emitToUser(userId, SocketEvents.APPOINTMENT_STATUS_CHANGED, {
        type: 'APPOINTMENT_STATUS_CHANGED',
        payload,
        timestamp: new Date().toISOString()
      });
    }

    // Always emit update event for dashboard refresh
    this.emitToAll(SocketEvents.APPOINTMENT_UPDATED, {
      type: 'APPOINTMENT_UPDATED',
      payload: appointmentData,
      timestamp: new Date().toISOString()
    });
  }

  async emitAppointmentCreated(userId: string, appointmentData: any, showNotification: boolean = true): Promise<void> {
    const { employeeName, visitorName } = this.extractNames(appointmentData.appointment);

    const payload = {
      ...appointmentData,
      employeeName,
      visitorName
    };

    if (showNotification) {
      // Save notification to database
      try {
        await NotificationService.createNotification({
          userId,
          type: 'appointment_created',
          title: 'New Appointment Request',
          message: `${visitorName} has requested an appointment with ${employeeName}`,
          appointmentId: appointmentData.appointmentId || appointmentData.appointment?._id?.toString(),
          metadata: {
            employeeName,
            visitorName,
            scheduledDate: appointmentData.appointment?.appointmentDetails?.scheduledDate,
            scheduledTime: appointmentData.appointment?.appointmentDetails?.scheduledTime,
          },
        });
      } catch (error: any) {
        // Log error but don't fail the socket emission
        console.error('Failed to save notification to database:', error?.message || error);
      }

      this.emitToUser(userId, SocketEvents.APPOINTMENT_CREATED, {
        type: 'APPOINTMENT_CREATED',
        payload,
        timestamp: new Date().toISOString()
      });
    }

    // Also emit update to refresh lists for everyone
    this.emitToAll(SocketEvents.APPOINTMENT_UPDATED, {
      type: 'APPOINTMENT_UPDATED',
      payload: appointmentData,
      timestamp: new Date().toISOString()
    });
  }

  emitAppointmentDeleted(userId: string, appointmentId: string): void {
    this.emitToUser(userId, SocketEvents.APPOINTMENT_DELETED, {
      type: 'APPOINTMENT_DELETED',
      payload: { appointmentId },
      timestamp: new Date().toISOString()
    });
  }
}

export const socketService = SocketService.getInstance();
