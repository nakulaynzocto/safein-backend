import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployee extends Document {
    name: string;
    email: string;
    phone: string;
    department: string;
    designation?: string;
    photo?: string;
    status: 'Active' | 'Inactive';
    createdBy: mongoose.Types.ObjectId; // Reference to User who created the employee
    isDeleted: boolean;
    deletedAt?: Date;
    deletedBy?: mongoose.Types.ObjectId; // Reference to User who deleted the employee
    createdAt: Date;
    updatedAt: Date;
    isVerified: boolean;
    verificationOtp?: string;
    verificationOtpExpires?: Date;
}

const employeeSchema = new Schema<IEmployee>({
    name: {
        type: String,
        required: [true, 'Employee name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters long'],
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
        match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
    },
    department: {
        type: String,
        required: [true, 'Department is required'],
        trim: true,
        minlength: [2, 'Department must be at least 2 characters long'],
        maxlength: [50, 'Department cannot exceed 50 characters']
    },
    designation: {
        type: String,
        trim: true,
        minlength: [2, 'Position must be at least 2 characters long'],
        maxlength: [100, 'Position cannot exceed 100 characters'],
        default: '',
    },
    photo: {
        type: String,
        default: '',
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Inactive'
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
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationOtp: {
        type: String,
        select: false // Hide from default queries for security
    },
    verificationOtpExpires: {
        type: Date,
        select: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

employeeSchema.index({ department: 1 });
employeeSchema.index({ status: 1 });
employeeSchema.index({ isDeleted: 1 });
employeeSchema.index({ deletedAt: 1 });
employeeSchema.index({ createdBy: 1 });

employeeSchema.index({ createdBy: 1, isDeleted: 1, status: 1 }); // Optimize employee listing default with deleted
employeeSchema.index({ createdBy: 1, status: 1, isDeleted: 1, createdAt: -1 }); // Optimize active employee listing with sort
employeeSchema.index({ isDeleted: 1, status: 1 }); // Optimize general active/deleted filters

// Text Index for full-text search (MUCH FASTER than regex for large data)
employeeSchema.index({ name: 'text', email: 'text', department: 'text', designation: 'text' });

employeeSchema.index({ createdBy: 1, email: 1 }, { unique: true });

employeeSchema.virtual('fullName').get(function () {
    return this.name;
});

employeeSchema.pre('save', function (next) {
    next();
});

employeeSchema.statics.findActive = function () {
    return this.find({ isDeleted: false, status: 'Active' });
};

employeeSchema.statics.findDeleted = function () {
    return this.find({ isDeleted: true });
};

employeeSchema.methods.softDelete = function (deletedBy: mongoose.Types.ObjectId) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = deletedBy;
    return this.save();
};

employeeSchema.methods.restore = function () {
    this.isDeleted = false;
    this.deletedAt = null;
    this.deletedBy = null;
    return this.save();
};

export const Employee = mongoose.model<IEmployee>('Employee', employeeSchema);
