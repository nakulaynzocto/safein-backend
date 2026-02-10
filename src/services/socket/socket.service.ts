import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { CONSTANTS } from '../../utils/constants';
import { NotificationService } from '../notification/notification.service';
import { chatService } from '../chat/chat.service';

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

  // Chat Events
  JOIN_CHAT_ROOM = 'join_chat_room',
  LEAVE_CHAT_ROOM = 'leave_chat_room',
  SEND_MESSAGE = 'send_message',
  RECEIVE_MESSAGE = 'receive_message',
  TYPING = 'typing',
  STOP_TYPING = 'stop_typing',
  READ_RECEIPT = 'read_receipt',
  USER_ONLINE = 'user_online',
  USER_OFFLINE = 'user_offline',
  GET_ONLINE_USERS = 'get_online_users',
}

class SocketService {
  private io: SocketIOServer | null = null;
  private onlineUsers: Map<string, string> = new Map(); // userId -> socketId
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
      transports: ['websocket'],
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
          this.onlineUsers.set(userId, socket.id);
          this.io?.emit(SocketEvents.USER_ONLINE, userId);
        }
      });

      socket.on(SocketEvents.LEAVE_USER_ROOM, (userId: string) => {
        if (userId) {
          socket.leave(`user_${userId}`);
          this.onlineUsers.delete(userId);
          this.io?.emit(SocketEvents.USER_OFFLINE, userId);
        }
      });

      socket.on(SocketEvents.GET_ONLINE_USERS, () => {
        socket.emit(SocketEvents.GET_ONLINE_USERS, Array.from(this.onlineUsers.keys()));
      });

      socket.on(SocketEvents.DISCONNECT, () => {
        let disconnectedUserId: string | null = null;
        for (const [userId, socketId] of this.onlineUsers.entries()) {
          if (socketId === socket.id) {
            disconnectedUserId = userId;
            break;
          }
        }

        if (disconnectedUserId) {
          this.onlineUsers.delete(disconnectedUserId);
          this.io?.emit(SocketEvents.USER_OFFLINE, disconnectedUserId);
        }
      });

      // Initialize Chat Handlers
      this.setupChatHandlers(socket);
    });
  }

  private setupChatHandlers(socket: Socket): void {
    // Join Chat Room
    socket.on(SocketEvents.JOIN_CHAT_ROOM, (chatId: string) => {
      if (chatId) {
        socket.join(`chat_${chatId}`);
      }
    });

    // Leave Chat Room
    socket.on(SocketEvents.LEAVE_CHAT_ROOM, (chatId: string) => {
      if (chatId) {
        socket.leave(`chat_${chatId}`);
      }
    });

    // Handle Send Message
    socket.on(SocketEvents.SEND_MESSAGE, async (data: { chatId: string, senderId: string, text: string, files?: any[] }) => {
      try {
        const { chatId, senderId, text, files } = data;

        // Save to DB
        const message = await chatService.createMessage(chatId, senderId, text, files);

        // Populate sender info using service helper
        const populatedMessage = await chatService.populateSender(message);

        // Emit to Room (including sender for confirmation/udpate)
        if (this.io) {
          this.io.to(`chat_${chatId}`).emit(SocketEvents.RECEIVE_MESSAGE, populatedMessage);

          // Emit to User Rooms to ensure Global Notifications work even if not on Chat Page
          const chat = await chatService.getChatById(chatId);
          if (chat && chat.participants) {
            chat.participants.forEach((participant: any) => {
              const pId = participant._id || participant;
              this.io?.to(`user_${pId}`).emit(SocketEvents.RECEIVE_MESSAGE, populatedMessage);
            });
          }
        }

        // Also emit via user list for unread counts or list updates?
        // If we assume users are listening to their user_room for general updates:
        // This is optional for now, `RECEIVE_MESSAGE` handles active chat.
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing Indicators
    socket.on(SocketEvents.TYPING, (data: { chatId: string, userId: string }) => {
      socket.to(`chat_${data.chatId}`).emit(SocketEvents.TYPING, data);
    });

    socket.on(SocketEvents.STOP_TYPING, (data: { chatId: string, userId: string }) => {
      socket.to(`chat_${data.chatId}`).emit(SocketEvents.STOP_TYPING, data);
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
      let statusInfo = {
        title: 'Appointment Status Changed',
        message: `Appointment status has been changed to ${appointmentData.status}`,
      };

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

        if (statusMessages[appointmentData.status]) {
          statusInfo = statusMessages[appointmentData.status];
        }

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

      // Also emit generic notification event for toast and count refresh
      this.emitToUser(userId, SocketEvents.NEW_NOTIFICATION, {
        type: 'NEW_NOTIFICATION',
        payload: {
          title: statusInfo.title,
          message: statusInfo.message,
          appointmentId: appointmentData.appointmentId,
          status: appointmentData.status
        },
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
      const isApproved = appointmentData.status === 'approved';
      const title = isApproved ? 'Appointment Scheduled' : 'New Appointment Request';
      const message = isApproved
        ? `${visitorName} has scheduled an appointment with ${employeeName}`
        : `${visitorName} has requested an appointment with ${employeeName}`;

      try {
        await NotificationService.createNotification({
          userId,
          type: 'appointment_created',
          title,
          message,
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

      // Also emit generic notification event for toast and count refresh
      this.emitToUser(userId, SocketEvents.NEW_NOTIFICATION, {
        type: 'NEW_NOTIFICATION',
        payload: {
          title,
          message,
          appointmentId: appointmentData.appointmentId || appointmentData.appointment?._id?.toString(),
          status: appointmentData.status
        },
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
