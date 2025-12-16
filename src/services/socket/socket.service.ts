import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { CONSTANTS } from '../../utils/constants';

// Socket events enum for type safety
export enum SocketEvents {
  // Connection events
  CONNECTION = 'connection',
  DISCONNECT = 'disconnect',
  
  // Room events
  JOIN_USER_ROOM = 'join_user_room',
  LEAVE_USER_ROOM = 'leave_user_room',
  
  // Appointment events
  APPOINTMENT_UPDATED = 'appointment_updated',
  APPOINTMENT_CREATED = 'appointment_created',
  APPOINTMENT_DELETED = 'appointment_deleted',
  APPOINTMENT_STATUS_CHANGED = 'appointment_status_changed',
  
  // Notification events
  NEW_NOTIFICATION = 'new_notification',
}

// Singleton Socket Service
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

  /**
   * Initialize Socket.IO with HTTP server
   */
  initialize(httpServer: HttpServer): SocketIOServer {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: CONSTANTS.FRONTEND_URLS,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      // Connection options
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupConnectionHandlers();
    console.log('✅ Socket.IO initialized successfully');
    
    return this.io;
  }

  /**
   * Setup connection handlers
   */
  private setupConnectionHandlers(): void {
    if (!this.io) return;

    this.io.on(SocketEvents.CONNECTION, (socket: Socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);

      // Join user-specific room for targeted notifications
      socket.on(SocketEvents.JOIN_USER_ROOM, (userId: string) => {
        if (userId) {
          socket.join(`user_${userId}`);
          console.log(`👤 User ${userId} joined their room`);
        }
      });

      // Leave user room
      socket.on(SocketEvents.LEAVE_USER_ROOM, (userId: string) => {
        if (userId) {
          socket.leave(`user_${userId}`);
          console.log(`👤 User ${userId} left their room`);
        }
      });

      // Handle disconnect
      socket.on(SocketEvents.DISCONNECT, (reason) => {
        console.log(`❌ Client disconnected: ${socket.id}, Reason: ${reason}`);
      });
    });
  }

  /**
   * Get Socket.IO instance
   */
  getIO(): SocketIOServer | null {
    return this.io;
  }

  /**
   * Emit event to all connected clients
   */
  emitToAll(event: SocketEvents, data: any): void {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  /**
   * Emit event to a specific user's room
   */
  emitToUser(userId: string, event: SocketEvents, data: any): void {
    if (this.io) {
      this.io.to(`user_${userId}`).emit(event, data);
    }
  }

  /**
   * Emit appointment status change event
   * This is called when appointment is approved/rejected via email
   */
  emitAppointmentStatusChange(userId: string, appointmentData: {
    appointmentId: string;
    status: string;
    updatedAt?: Date;
    appointment?: any;
  }): void {
    console.log(`📤 Emitting appointment status change to user: ${userId}`, {
      appointmentId: appointmentData.appointmentId,
      status: appointmentData.status
    });

    // Emit to specific user
    this.emitToUser(userId, SocketEvents.APPOINTMENT_STATUS_CHANGED, {
      type: 'APPOINTMENT_STATUS_CHANGED',
      payload: appointmentData,
      timestamp: new Date().toISOString()
    });

    // Also emit to all (for dashboard updates)
    this.emitToAll(SocketEvents.APPOINTMENT_UPDATED, {
      type: 'APPOINTMENT_UPDATED',
      payload: appointmentData,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit new appointment created event
   */
  emitAppointmentCreated(userId: string, appointmentData: any): void {
    this.emitToUser(userId, SocketEvents.APPOINTMENT_CREATED, {
      type: 'APPOINTMENT_CREATED',
      payload: appointmentData,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit appointment deleted event
   */
  emitAppointmentDeleted(userId: string, appointmentId: string): void {
    this.emitToUser(userId, SocketEvents.APPOINTMENT_DELETED, {
      type: 'APPOINTMENT_DELETED',
      payload: { appointmentId },
      timestamp: new Date().toISOString()
    });
  }
}

// Export singleton instance
export const socketService = SocketService.getInstance();

