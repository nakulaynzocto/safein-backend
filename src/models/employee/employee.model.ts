import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployee extends Document {
    name: string;
    email: string;
    phone: string;
    department: string;
    status: 'Active' | 'Inactive';
    createdBy: mongoose.Types.ObjectId; // Reference to User who created the employee
    isDeleted: boolean;
    deletedAt?: Date;
    deletedBy?: mongoose.Types.ObjectId; // Reference to User who deleted the employee
    createdAt: Date;
    updatedAt: Date;
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
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
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
