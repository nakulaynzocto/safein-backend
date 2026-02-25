import mongoose, { Schema, Document } from 'mongoose';

export interface IAppointmentBookingLink extends Document {
  visitorId?: mongoose.Types.ObjectId;
  visitorEmail?: string;
  visitorPhone: string;
  employeeId: mongoose.Types.ObjectId;
  secureToken: string;
  isBooked: boolean;
  expiresAt: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const appointmentBookingLinkSchema = new Schema<IAppointmentBookingLink>(
  {
    visitorId: {
      type: Schema.Types.ObjectId,
      ref: 'Visitor',
      default: null,
    },
    visitorEmail: {
      type: String,
      required: false,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },
    visitorPhone: {
      type: String,
      required: [true, 'Visitor phone is required'],
      trim: true,
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee ID is required'],
    },
    secureToken: {
      type: String,
      required: [true, 'Secure token is required'],
    },
    isBooked: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by user ID is required'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Only secureToken is unique - allows multiple links for same visitor + employee
appointmentBookingLinkSchema.index({ secureToken: 1 }, { unique: true, sparse: true });
appointmentBookingLinkSchema.index({ visitorEmail: 1 });
appointmentBookingLinkSchema.index({ visitorPhone: 1 });
appointmentBookingLinkSchema.index({ employeeId: 1 });
appointmentBookingLinkSchema.index({ isBooked: 1 });
appointmentBookingLinkSchema.index({ expiresAt: 1 });

export const AppointmentBookingLink = mongoose.model<IAppointmentBookingLink>(
  'AppointmentBookingLink',
  appointmentBookingLinkSchema
);

