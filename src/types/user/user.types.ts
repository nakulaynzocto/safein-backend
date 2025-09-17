import { Document } from 'mongoose';

export interface IUser extends Document {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNumber?: string;
    dateOfBirth?: Date;
    gender?: "male" | "female" | "other";
    profilePicture?: string;
    companyId?: string; // Reference to Company
    role: "admin" | "gatekeeper" | "employee" | "visitor";
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
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNumber?: string;
    dateOfBirth?: Date;
    gender?: "male" | "female" | "other";
    companyId?: string;
    role: "admin" | "gatekeeper" | "employee" | "visitor";
    department?: string;
    designation?: string;
    employeeId?: string;
}

export interface IUpdateUserDTO {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    dateOfBirth?: Date;
    gender?: "male" | "female" | "other";
    profilePicture?: string;
    companyId?: string;
    role?: "admin" | "gatekeeper" | "employee" | "visitor";
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
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    dateOfBirth?: Date;
    gender?: "male" | "female" | "other";
    profilePicture?: string;
    companyId?: string;
    role: "admin" | "gatekeeper" | "employee" | "visitor";
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
