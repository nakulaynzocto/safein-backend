import mongoose, { Document } from 'mongoose';

export interface IUser extends Document {
    _id: string;
    companyName: string;
    email: string;
    mobileNumber?: string;
    password: string;
    profilePicture?: string;
    companyId?: mongoose.Types.ObjectId; // Reference to Company
    roles: ("admin" | "visitor" | "employee" | "superadmin")[];
    department?: string;
    designation?: string;
    employeeId?: string;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    isActive: boolean;
    isDeleted: boolean;
    deletedAt: Date | null;
    deletedBy: mongoose.Types.ObjectId | null;
    createdBy: mongoose.Types.ObjectId | null;
    updatedBy: mongoose.Types.ObjectId | null;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    activeSubscriptionId?: mongoose.Types.ObjectId | { endDate: Date } | null;
    stripeCustomerId?: string | null;

    // Profile Fields
    bio?: string;
    address?: {
        street: string;
        city: string;
        state: string;
        country: string;
        pincode: string;
    };
    socialLinks?: {
        linkedin?: string;
        twitter?: string;
        website?: string;
    };
    passwordResetToken?: string;
    resetPasswordExpires?: Date;
    googleId?: string;
    fcmTokens?: string[];

    comparePassword(candidatePassword: string): Promise<boolean>;
    updateLastLogin(): Promise<IUser>;
    getPublicProfile(): IUserResponse;
    softDelete(deletedBy: string): Promise<IUser>;
    restore(): Promise<IUser>;
}

export interface ICreateUserDTO {
    companyName: string;
    email: string;
    password: string;
    companyId?: string;
    roles?: ("admin" | "visitor" | "employee" | "superadmin")[];
    department?: string;
    designation?: string;
    employeeId?: mongoose.Types.ObjectId;
}

export interface IUpdateUserDTO {
    companyName?: string;
    mobileNumber?: string;
    isActive?: boolean;
    profilePicture?: string;
    bio?: string;
    address?: {
        street: string;
        city: string;
        state: string;
        country: string;
        pincode: string;
    };
    socialLinks?: {
        linkedin?: string;
        twitter?: string;
        website?: string;
    };
    companyId?: string;
    roles?: ("admin" | "visitor" | "employee" | "superadmin")[];
    department?: string;
    designation?: string;
    updatedBy?: string;
}

export interface ILoginDTO {
    email: string;
    password: string;
}

export interface IChangePasswordDTO {
    currentPassword: string;
    newPassword: string;
}

export interface IForgotPasswordDTO {
    email: string;
}

export interface IResetPasswordDTO {
    token: string;
    newPassword: string;
}

export interface IUserResponse {
    _id: string;
    companyName: string;
    email: string;
    mobileNumber?: string;
    profilePicture?: string;
    stripeCustomerId?: string; // Stripe Customer ID
    companyId?: mongoose.Types.ObjectId;
    roles: ("admin" | "visitor" | "employee" | "superadmin")[];
    department?: string;
    designation?: string;
    employeeId?: string;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    isActive: boolean;
    isDeleted: boolean;
    deletedAt?: Date;
    deletedBy?: string;
    createdBy?: string;
    updatedBy?: string;
    lastLoginAt?: Date;
    photo?: string; // Personal photo for employees
    createdAt: Date;
    updatedAt: Date;
}
