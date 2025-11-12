import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../../types/user/user.types';

const userSchema = new Schema<IUser>(
    {
        companyName: {
            type: String,
            required: [true, 'Company name is required'],
            trim: true,
            minlength: [2, 'Company name must be at least 2 characters'],
            maxlength: [100, 'Company name cannot exceed 100 characters']
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                'Please provide a valid email address'
            ]
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false // Don't include password in queries by default
        },
        profilePicture: {
            type: String,
            trim: true,
            default: null
        },
        companyId: {
            type: Schema.Types.ObjectId,
            ref: 'Company',
            required: false
        },
        role: {
            type: String,
            enum: {
                values: ['admin', 'safein', 'employee', 'visitor'],
                message: 'Role must be admin, safein, employee, or visitor'
            },
            default: 'visitor'
        },
        department: {
            type: String,
            trim: true
        },
        designation: {
            type: String,
            trim: true
        },
        employeeId: {
            type: String,
            trim: true,
            unique: true,
            sparse: true // Allows multiple null values
        },
        isEmailVerified: {
            type: Boolean,
            default: false
        },
        isPhoneVerified: {
            type: Boolean,
            default: false
        },
        isActive: {
            type: Boolean,
            default: true
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
        lastLoginAt: {
            type: Date
        },
        activeSubscriptionId: {
            type: Schema.Types.ObjectId,
            ref: 'UserSubscription',
            default: null,
            sparse: true,
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// Indexes for performance
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ companyId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ companyId: 1, role: 1 });
userSchema.index({ isDeleted: 1 });
userSchema.index({ deletedAt: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
    // Only hash password if it's modified
    if (!this.isModified('password')) return next();

    try {
        // Hash password with cost of 12
        const hashedPassword = await bcrypt.hash(this.password, 12);
        this.password = hashedPassword;
        next();
    } catch (error) {
        next(error as Error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

// Method to update last login
userSchema.methods.updateLastLogin = function () {
    this.lastLoginAt = new Date();
    return this.save();
};

// Method to get public profile (without sensitive data)
userSchema.methods.getPublicProfile = function () {
    const userObject = this.toObject();
    delete userObject.password;
    // Ensure profilePicture is included even if it's null/undefined
    // Convert null to empty string for frontend compatibility
    if (userObject.profilePicture === null || userObject.profilePicture === undefined) {
        userObject.profilePicture = '';
    }
    return userObject;
};

// Static method to find active users
userSchema.statics.findActive = function () {
    return this.find({ isDeleted: false, isActive: true });
};

// Static method to find deleted users
userSchema.statics.findDeleted = function () {
    return this.find({ isDeleted: true });
};

// Instance method to soft delete
userSchema.methods.softDelete = function (deletedBy: mongoose.Types.ObjectId) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = deletedBy;
    return this.save();
};

// Instance method to restore
userSchema.methods.restore = function () {
    this.isDeleted = false;
    this.deletedAt = null;
    this.deletedBy = null;
    return this.save();
};

export const User = mongoose.model<IUser>('User', userSchema);
