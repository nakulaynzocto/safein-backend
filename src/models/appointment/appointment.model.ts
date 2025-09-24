import mongoose, { Schema } from 'mongoose';

export interface IAppointment extends mongoose.Document {
    appointmentId: string;
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
    appointmentDetails: {
        purpose: string;
        scheduledDate: Date;
        scheduledTime: string;
        duration: number; // in minutes
        meetingRoom?: string;
        notes?: string;
    };
    status: 'scheduled' | 'checked_in' | 'in_meeting' | 'completed' | 'cancelled' | 'no_show';
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
        appointmentId: {
            type: String,
            required: [true, 'Appointment ID is required'],
            unique: true,
            uppercase: true,
            trim: true
        },
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
            }
        },
        status: {
            type: String,
            enum: {
                values: ['scheduled', 'checked_in', 'in_meeting', 'completed', 'cancelled', 'no_show'],
                message: 'Status must be one of: scheduled, checked_in, in_meeting, completed, cancelled, no_show'
            },
            default: 'scheduled'
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

// Indexes for performance
appointmentSchema.index({ appointmentId: 1 });
appointmentSchema.index({ employeeId: 1 });
appointmentSchema.index({ visitorId: 1 });
appointmentSchema.index({ 'appointmentDetails.scheduledDate': 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ createdBy: 1 });
appointmentSchema.index({ isDeleted: 1 });
appointmentSchema.index({ createdAt: -1 });
appointmentSchema.index({ employeeId: 1, 'appointmentDetails.scheduledDate': 1 });

// Pre-save middleware to generate appointment ID if not provided
appointmentSchema.pre('save', function (next) {
    if (!this.appointmentId) {
        // Generate appointment ID: APT + timestamp + random 3 digits
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        this.appointmentId = `APT${timestamp}${random}`;
    }
    next();
});

// Virtual for full visitor name (requires population)
appointmentSchema.virtual('visitorFullName').get(function () {
    // This will work when the visitor is populated
    return this.populated('visitorId')?.name || 'Visitor not loaded';
});

// Virtual for appointment date and time
appointmentSchema.virtual('appointmentDateTime').get(function () {
    const date = this.appointmentDetails.scheduledDate.toISOString().split('T')[0];
    return `${date} ${this.appointmentDetails.scheduledTime}`;
});

// Static method to find active appointments
appointmentSchema.statics.findActive = function () {
    return this.find({ isDeleted: false });
};

// Static method to find appointments by employee
appointmentSchema.statics.findByEmployee = function (employeeId: string) {
    return this.find({ employeeId, isDeleted: false });
};

// Static method to find appointments by date range
appointmentSchema.statics.findByDateRange = function (startDate: Date, endDate: Date) {
    return this.find({
        'appointmentDetails.scheduledDate': {
            $gte: startDate,
            $lte: endDate
        },
        isDeleted: false
    });
};

// Instance method to soft delete
appointmentSchema.methods.softDelete = function (deletedBy: mongoose.Types.ObjectId) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = deletedBy;
    return this.save();
};

// Instance method to restore
appointmentSchema.methods.restore = function () {
    this.isDeleted = false;
    this.deletedAt = null;
    this.deletedBy = null;
    return this.save();
};

// Instance method to check in
appointmentSchema.methods.checkIn = function () {
    this.status = 'checked_in';
    this.checkInTime = new Date();
    return this.save();
};

// Instance method to check out
appointmentSchema.methods.checkOut = function () {
    this.status = 'completed';
    this.checkOutTime = new Date();
    if (this.checkInTime) {
        this.actualDuration = Math.floor((this.checkOutTime.getTime() - this.checkInTime.getTime()) / (1000 * 60));
    }
    return this.save();
};

export const Appointment = mongoose.model<IAppointment>('Appointment', appointmentSchema);
