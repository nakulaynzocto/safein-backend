import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployee extends Document {
    employeeId: string;
    name: string;
    email: string;
    phone: string;
    whatsapp?: string;
    department: string;
    designation: string;
    role: string;
    officeLocation: string;
    status: 'Active' | 'Inactive';
    isDeleted: boolean;
    deletedAt?: Date;
    deletedBy?: mongoose.Types.ObjectId; // Reference to User who deleted the employee
    createdAt: Date;
    updatedAt: Date;
}

const employeeSchema = new Schema<IEmployee>({
    employeeId: {
        type: String,
        required: [true, 'Employee ID is required'],
        unique: true,
        trim: true,
        uppercase: true
    },
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
        unique: true,
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
    whatsapp: {
        type: String,
        trim: true,
        match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid WhatsApp number']
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
        required: [true, 'Designation is required'],
        trim: true,
        minlength: [2, 'Designation must be at least 2 characters long'],
        maxlength: [50, 'Designation cannot exceed 50 characters']
    },
    role: {
        type: String,
        required: [true, 'Role is required'],
        trim: true,
        minlength: [2, 'Role must be at least 2 characters long'],
        maxlength: [100, 'Role cannot exceed 100 characters']
    },
    officeLocation: {
        type: String,
        required: [true, 'Office location is required'],
        trim: true,
        minlength: [2, 'Office location must be at least 2 characters long'],
        maxlength: [100, 'Office location cannot exceed 100 characters']
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
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
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
employeeSchema.index({ department: 1 });
employeeSchema.index({ status: 1 });
employeeSchema.index({ isDeleted: 1 });
employeeSchema.index({ deletedAt: 1 });

// Virtual for full name
employeeSchema.virtual('fullName').get(function () {
    return this.name;
});

// Pre-save middleware to ensure employeeId is uppercase
employeeSchema.pre('save', function (next) {
    if (this.employeeId) {
        this.employeeId = this.employeeId.toUpperCase();
    }
    next();
});

// Static method to find active employees
employeeSchema.statics.findActive = function () {
    return this.find({ isDeleted: false, status: 'Active' });
};

// Static method to find deleted employees
employeeSchema.statics.findDeleted = function () {
    return this.find({ isDeleted: true });
};

// Instance method to soft delete
employeeSchema.methods.softDelete = function (deletedBy: mongoose.Types.ObjectId) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = deletedBy;
    return this.save();
};

// Instance method to restore
employeeSchema.methods.restore = function () {
    this.isDeleted = false;
    this.deletedAt = null;
    this.deletedBy = null;
    return this.save();
};

export const Employee = mongoose.model<IEmployee>('Employee', employeeSchema);
