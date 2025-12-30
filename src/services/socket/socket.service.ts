import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { CONSTANTS } from '../../utils/constants';

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

  private constructor() {}

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

      socket.on(SocketEvents.DISCONNECT, () => {});
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

  emitAppointmentStatusChange(userId: string, appointmentData: {
    appointmentId: string;
    status: string;
    updatedAt?: Date;
    appointment?: any;
  }): void {
    const { employeeName, visitorName } = this.extractNames(appointmentData.appointment);
    
    const payload = {
      ...appointmentData,
      employeeName,
      visitorName
    };

    this.emitToUser(userId, SocketEvents.APPOINTMENT_STATUS_CHANGED, {
      type: 'APPOINTMENT_STATUS_CHANGED',
      payload,
      timestamp: new Date().toISOString()
    });

    this.emitToAll(SocketEvents.APPOINTMENT_UPDATED, {
      type: 'APPOINTMENT_UPDATED',
      payload: appointmentData,
      timestamp: new Date().toISOString()
    });
  }

  emitAppointmentCreated(userId: string, appointmentData: any): void {
    const { employeeName, visitorName } = this.extractNames(appointmentData.appointment);
    
    const payload = {
      ...appointmentData,
      employeeName,
      visitorName
    };

    this.emitToUser(userId, SocketEvents.APPOINTMENT_CREATED, {
      type: 'APPOINTMENT_CREATED',
      payload,
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
