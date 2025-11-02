import { Document } from 'mongoose';

export interface IUser extends Document {
    _id: string;
    companyName: string;
    email: string;
    password: string;
    profilePicture?: string;
    companyId?: string; // Reference to Company
    role: "admin" | "safein" | "employee" | "visitor";
    department?: string;
    designation?: string;
    employeeId?: string;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    isActive: boolean;
    isDeleted: boolean;
    deletedAt?: Date;
    deletedBy?: string; // Reference to User who deleted this user
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;

    // Instance methods
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
    role: "admin" | "safein" | "employee" | "visitor";
    department?: string;
    designation?: string;
    employeeId?: string;
}

export interface IUpdateUserDTO {
    companyName?: string;
    profilePicture?: string;
    companyId?: string;
    role?: "admin" | "safein" | "employee" | "visitor";
    department?: string;
    designation?: string;
    employeeId?: string;
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
    profilePicture?: string;
    companyId?: string;
    role: "admin" | "safein" | "employee" | "visitor";
    department?: string;
    designation?: string;
    employeeId?: string;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    isActive: boolean;
    isDeleted: boolean;
    deletedAt?: Date;
    deletedBy?: string;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
