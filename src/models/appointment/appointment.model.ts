import mongoose, { Schema } from 'mongoose';

export interface IAppointment extends mongoose.Document {
    employeeId: mongoose.Types.ObjectId; // Reference to Employee
    visitorId: mongoose.Types.ObjectId; // Reference to Visitor
    accompaniedBy?: {
        name: string;
        phone: string;
        relation: string;
        idProof?: {
            type: 'aadhaar' | 'pan' | 'driving_license' | 'passport' | 'other';
            number: string;
            image?: string;
        };
    };
    accompanyingCount?: number;
    appointmentDetails: {
        purpose: string;
        scheduledDate: Date;
        scheduledTime: string;
        duration: number; // in minutes
        meetingRoom?: string;
        notes?: string;
        vehicleNumber?: string; // Optional vehicle number
        vehiclePhoto?: string; // Optional vehicle photo URL
    };
    status: 'pending' | 'approved' | 'rejected' | 'completed';
    checkInTime?: Date;
    checkOutTime?: Date;
    actualDuration?: number; // in minutes
    securityDetails: {
        badgeIssued: boolean;
        badgeNumber?: string;
        securityClearance: boolean;
        securityNotes?: string;
    };
    notifications: {
        smsSent: boolean;
        emailSent: boolean;
        whatsappSent: boolean;
        reminderSent: boolean;
    };
    createdBy: mongoose.Types.ObjectId; // Reference to User who created the appointment
    isDeleted: boolean;
    deletedAt?: Date;
    deletedBy?: mongoose.Types.ObjectId; // Reference to User who deleted the appointment
    createdAt: Date;
    updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>(
    {
        employeeId: {
            type: Schema.Types.ObjectId,
            ref: 'Employee',
            required: [true, 'Employee ID is required']
        },
        visitorId: {
            type: Schema.Types.ObjectId,
            ref: 'Visitor',
            required: [true, 'Visitor ID is required']
        },
        accompaniedBy: {
            name: {
                type: String,
                trim: true,
                maxlength: [100, 'Accompanied by name cannot exceed 100 characters']
            },
            phone: {
                type: String,
                trim: true,
                match: [
                    /^[\+]?[1-9][\d]{0,15}$/,
                    'Please provide a valid phone number'
                ]
            },
            relation: {
                type: String,
                trim: true,
                maxlength: [50, 'Relation cannot exceed 50 characters']
            },
            idProof: {
                type: {
                    type: String,
                    enum: {
                        values: ['aadhaar', 'pan', 'driving_license', 'passport', 'other'],
                        message: 'ID proof type must be one of: aadhaar, pan, driving_license, passport, other'
                    }
                },
                number: {
                    type: String,
                    trim: true
                },
                image: {
                    type: String,
                    trim: true
                }
            }
        },
        accompanyingCount: {
            type: Number,
            min: [0, 'Accompanying people cannot be negative'],
            max: [20, 'Accompanying people cannot exceed 20'],
            default: 0,
        },
        appointmentDetails: {
            purpose: {
                type: String,
                required: [true, 'Appointment purpose is required'],
                trim: true,
                maxlength: [200, 'Purpose cannot exceed 200 characters']
            },
            scheduledDate: {
                type: Date,
                required: [true, 'Scheduled date is required']
            },
            scheduledTime: {
                type: String,
                required: [true, 'Scheduled time is required'],
                match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)']
            },
            duration: {
                type: Number,
                required: [true, 'Duration is required'],
                min: [15, 'Duration must be at least 15 minutes'],
                max: [480, 'Duration cannot exceed 8 hours']
            },
            meetingRoom: {
                type: String,
                trim: true,
                maxlength: [50, 'Meeting room cannot exceed 50 characters']
            },
            notes: {
                type: String,
                trim: true,
                maxlength: [500, 'Notes cannot exceed 500 characters']
            },
            vehicleNumber: {
                type: String,
                trim: true,
                uppercase: true,
                maxlength: [20, 'Vehicle number cannot exceed 20 characters']
            },
            vehiclePhoto: {
                type: String,
                trim: true
            }
        },
        status: {
            type: String,
            enum: {
                values: ['pending', 'approved', 'rejected', 'completed'],
                message: 'Status must be one of: pending, approved, rejected, completed'
            },
            default: 'pending'
        },
        checkInTime: {
            type: Date
        },
        checkOutTime: {
            type: Date
        },
        actualDuration: {
            type: Number,
            min: [0, 'Actual duration cannot be negative']
        },
        securityDetails: {
            badgeIssued: {
                type: Boolean,
                default: false
            },
            badgeNumber: {
                type: String,
                trim: true,
                uppercase: true
            },
            securityClearance: {
                type: Boolean,
                default: false
            },
            securityNotes: {
                type: String,
                trim: true,
                maxlength: [200, 'Security notes cannot exceed 200 characters']
            }
        },
        notifications: {
            smsSent: {
                type: Boolean,
                default: false
            },
            emailSent: {
                type: Boolean,
                default: false
            },
            whatsappSent: {
                type: Boolean,
                default: false
            },
            reminderSent: {
                type: Boolean,
                default: false
            }
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Created by user ID is required']
        },
        isDeleted: {
            type: Boolean,
            default: false
        },
        deletedAt: {
            type: Date,
            default: null
        },
        deletedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// Single field indexes
appointmentSchema.index({ employeeId: 1 });
appointmentSchema.index({ visitorId: 1 });
appointmentSchema.index({ 'appointmentDetails.scheduledDate': 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ createdBy: 1 });
appointmentSchema.index({ isDeleted: 1 });
appointmentSchema.index({ createdAt: -1 });

// Compound indexes for common query patterns (CRITICAL for performance with large datasets)
// These indexes dramatically improve query performance on 10+ lakhs records
appointmentSchema.index({ employeeId: 1, 'appointmentDetails.scheduledDate': 1 });
appointmentSchema.index({ employeeId: 1, status: 1, isDeleted: 1 }); // For dashboard stats
appointmentSchema.index({ employeeId: 1, 'appointmentDetails.scheduledDate': 1, isDeleted: 1 }); // For date range queries
appointmentSchema.index({ createdBy: 1, isDeleted: 1, createdAt: -1 }); // For admin appointment lists
appointmentSchema.index({ status: 1, isDeleted: 1, createdAt: -1 }); // For status-based queries with sorting
appointmentSchema.index({ isDeleted: 1, createdAt: -1 }); // For default sorted lists
appointmentSchema.index({ employeeId: 1, status: 1, 'appointmentDetails.scheduledDate': 1, isDeleted: 1 }); // For upcoming appointments
appointmentSchema.index({ createdBy: 1, 'appointmentDetails.scheduledDate': 1, isDeleted: 1 }); // For User dashboard counts


appointmentSchema.virtual('visitorFullName').get(function () {
    return this.populated('visitorId')?.name || 'Visitor not loaded';
});

appointmentSchema.virtual('appointmentDateTime').get(function () {
    const date = this.appointmentDetails.scheduledDate.toISOString().split('T')[0];
    return `${date} ${this.appointmentDetails.scheduledTime}`;
});

appointmentSchema.statics.findActive = function () {
    return this.find({ isDeleted: false });
};

appointmentSchema.statics.findByEmployee = function (employeeId: string) {
    return this.find({ employeeId, isDeleted: false });
};

appointmentSchema.statics.findByDateRange = function (startDate: Date, endDate: Date) {
    return this.find({
        'appointmentDetails.scheduledDate': {
            $gte: startDate,
            $lte: endDate
        },
        isDeleted: false
    });
};

appointmentSchema.methods.softDelete = function (deletedBy: mongoose.Types.ObjectId) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = deletedBy;
    return this.save();
};

appointmentSchema.methods.restore = function () {
    this.isDeleted = false;
    this.deletedAt = null;
    this.deletedBy = null;
    return this.save();
};

appointmentSchema.methods.checkIn = function () {
    this.status = 'checked_in';
    this.checkInTime = new Date();
    return this.save();
};
appointmentSchema.methods.checkOut = function () {
    this.status = 'completed';
    this.checkOutTime = new Date();
    if (this.checkInTime) {
        this.actualDuration = Math.floor((this.checkOutTime.getTime() - this.checkInTime.getTime()) / (1000 * 60));
    }
    return this.save();
};

export const Appointment = mongoose.model<IAppointment>('Appointment', appointmentSchema);
