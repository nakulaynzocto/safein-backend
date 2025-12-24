import { socketService } from '../services/socket/socket.service';

export const emitAppointmentStatusChange = (
  userId: string | undefined,
  appointment: any,
  status: 'approved' | 'rejected'
): void => {
  if (!userId) return;
  
  const appointmentObj = appointment.toObject();
  socketService.emitAppointmentStatusChange(userId, {
    appointmentId: appointment._id.toString(),
    status,
    updatedAt: new Date(),
    appointment: appointmentObj,
  });
};


