import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../../types/user/user.types';

const userSchema = new Schema<IUser>(
    {
        firstName: {
            type: String,
            required: [true, 'First name is required'],
            trim: true,
            minlength: [2, 'First name must be at least 2 characters'],
            maxlength: [50, 'First name cannot exceed 50 characters']
        },
        lastName: {
            type: String,
            required: [true, 'Last name is required'],
            trim: true,
            minlength: [2, 'Last name must be at least 2 characters'],
            maxlength: [50, 'Last name cannot exceed 50 characters']
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
        phoneNumber: {
            type: String,
            trim: true,
            match: [
                /^[\+]?[1-9][\d]{0,15}$/,
                'Please provide a valid phone number'
            ]
        },
        dateOfBirth: {
            type: Date,
            validate: {
                validator: function (value: Date) {
                    return !value || value < new Date();
                },
                message: 'Date of birth must be in the past'
            }
        },
        gender: {
            type: String,
            enum: {
                values: ['male', 'female', 'other'],
                message: 'Gender must be male, female, or other'
            }
        },
        profilePicture: {
            type: String,
            trim: true
        },
        companyId: {
            type: Schema.Types.ObjectId,
            ref: 'Company',
            required: false
        },
        role: {
            type: String,
            enum: {
                values: ['admin', 'gatekeeper', 'employee', 'visitor'],
                message: 'Role must be admin, gatekeeper, employee, or visitor'
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
        lastLoginAt: {
            type: Date
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// Indexes for performance
userSchema.index({ phoneNumber: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ companyId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ companyId: 1, role: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

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
    return userObject;
};

export const User = mongoose.model<IUser>('User', userSchema);
