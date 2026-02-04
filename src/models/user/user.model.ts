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
        mobileNumber: {
            type: String,
            trim: true,
            default: ''
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
        roles: {
            type: [String],
            enum: {
                values: ['admin', 'visitor', 'employee', 'superadmin'],
                message: 'Role must be admin, visitor, employee, or superadmin'
            },
            default: ['admin']
        },
        department: {
            type: String,
            trim: true
        },
        designation: {
            type: String,
            trim: true
        },
        bio: {
            type: String,
            trim: true
        },
        address: {
            street: { type: String, trim: true },
            city: { type: String, trim: true },
            state: { type: String, trim: true },
            country: { type: String, trim: true },
            pincode: { type: String, trim: true }
        },
        socialLinks: {
            linkedin: { type: String, trim: true },
            twitter: { type: String, trim: true },
            website: { type: String, trim: true }
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
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        updatedBy: {
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
        },
        stripeCustomerId: {
            type: String,
            trim: true,
            default: null,
            sparse: true,
        },
        passwordResetToken: {
            type: String,
            default: null,
            select: false
        },
        resetPasswordExpires: {
            type: Date,
            default: null,
            select: false
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ companyId: 1 });
userSchema.index({ roles: 1 });
userSchema.index({ companyId: 1, roles: 1 });
userSchema.index({ isDeleted: 1 });
userSchema.index({ deletedAt: 1 });

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const hashedPassword = await bcrypt.hash(this.password, 12);
        this.password = hashedPassword;
        next();
    } catch (error) {
        next(error as Error);
    }
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.updateLastLogin = function () {
    this.lastLoginAt = new Date();
    return this.save();
};

userSchema.methods.getPublicProfile = function () {
    const userObject = this.toObject();
    delete userObject.password;
    if (userObject.profilePicture === null || userObject.profilePicture === undefined) {
        userObject.profilePicture = '';
    }
    return userObject;
};

userSchema.statics.findActive = function () {
    return this.find({ isDeleted: false, isActive: true });
};

userSchema.statics.findDeleted = function () {
    return this.find({ isDeleted: true });
};

userSchema.methods.softDelete = function (deletedBy: mongoose.Types.ObjectId) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = deletedBy;
    return this.save();
};

userSchema.methods.restore = function () {
    this.isDeleted = false;
    this.deletedAt = null;
    this.deletedBy = null;
    return this.save();
};

export const User = mongoose.model<IUser>('User', userSchema);
