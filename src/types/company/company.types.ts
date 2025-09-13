import { Document } from 'mongoose';

export interface ICompany extends Document {
    _id: string;
    companyName: string;
    companyCode: string;
    email: string;
    phone: string;
    address: {
        street: string;
        city: string;
        state: string;
        country: string;
        zipCode: string;
    };
    contactPerson: {
        name: string;
        email: string;
        phone: string;
        designation: string;
    };
    subscription: {
        plan: 'basic' | 'premium' | 'enterprise';
        status: 'active' | 'inactive' | 'suspended' | 'trial';
        startDate: Date;
        endDate: Date;
        maxEmployees: number;
        maxVisitorsPerMonth: number;
    };
    settings: {
        allowAadhaarVerification: boolean;
        requireAadhaarPhoto: boolean;
        allowWhatsAppNotifications: boolean;
        allowEmailNotifications: boolean;
        workingHours: {
            start: string;
            end: string;
            workingDays: number[];
        };
        timezone: string;
        logo?: string;
        primaryColor?: string;
        secondaryColor?: string;
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;

    // Instance methods
    isSubscriptionActive(): boolean;
    canAddEmployee(): boolean;
    getRemainingEmployees(): number;
    getRemainingVisitorsThisMonth(): Promise<number>;
}

export interface ICreateCompanyDTO {
    companyName: string;
    companyCode?: string;
    email: string;
    phone: string;
    address: {
        street: string;
        city: string;
        state: string;
        country?: string;
        zipCode: string;
    };
    contactPerson: {
        name: string;
        email: string;
        phone: string;
        designation: string;
    };
    subscription: {
        plan: 'basic' | 'premium' | 'enterprise';
        maxEmployees: number;
        maxVisitorsPerMonth: number;
        endDate: Date;
    };
    settings?: {
        allowAadhaarVerification?: boolean;
        requireAadhaarPhoto?: boolean;
        allowWhatsAppNotifications?: boolean;
        allowEmailNotifications?: boolean;
        workingHours?: {
            start?: string;
            end?: string;
            workingDays?: number[];
        };
        timezone?: string;
        logo?: string;
        primaryColor?: string;
        secondaryColor?: string;
    };
}

export interface IUpdateCompanyDTO {
    companyName?: string;
    email?: string;
    phone?: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        zipCode?: string;
    };
    contactPerson?: {
        name?: string;
        email?: string;
        phone?: string;
        designation?: string;
    };
    subscription?: {
        plan?: 'basic' | 'premium' | 'enterprise';
        status?: 'active' | 'inactive' | 'suspended' | 'trial';
        maxEmployees?: number;
        maxVisitorsPerMonth?: number;
        endDate?: Date;
    };
    settings?: {
        allowAadhaarVerification?: boolean;
        requireAadhaarPhoto?: boolean;
        allowWhatsAppNotifications?: boolean;
        allowEmailNotifications?: boolean;
        workingHours?: {
            start?: string;
            end?: string;
            workingDays?: number[];
        };
        timezone?: string;
        logo?: string;
        primaryColor?: string;
        secondaryColor?: string;
    };
    isActive?: boolean;
}

export interface ICompanyResponse {
    _id: string;
    companyName: string;
    companyCode: string;
    email: string;
    phone: string;
    address: {
        street: string;
        city: string;
        state: string;
        country: string;
        zipCode: string;
    };
    contactPerson: {
        name: string;
        email: string;
        phone: string;
        designation: string;
    };
    subscription: {
        plan: 'basic' | 'premium' | 'enterprise';
        status: 'active' | 'inactive' | 'suspended' | 'trial';
        startDate: Date;
        endDate: Date;
        maxEmployees: number;
        maxVisitorsPerMonth: number;
        isActive: boolean;
        remainingEmployees: number;
        remainingVisitorsThisMonth: number;
    };
    settings: {
        allowAadhaarVerification: boolean;
        requireAadhaarPhoto: boolean;
        allowWhatsAppNotifications: boolean;
        allowEmailNotifications: boolean;
        workingHours: {
            start: string;
            end: string;
            workingDays: number[];
        };
        timezone: string;
        logo?: string;
        primaryColor?: string;
        secondaryColor?: string;
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICompanySubscriptionPlan {
    name: 'basic' | 'premium' | 'enterprise';
    displayName: string;
    description: string;
    maxEmployees: number;
    maxVisitorsPerMonth: number;
    price: number;
    features: string[];
}

export const SUBSCRIPTION_PLANS: ICompanySubscriptionPlan[] = [
    {
        name: 'basic',
        displayName: 'Basic Plan',
        description: 'Perfect for small businesses',
        maxEmployees: 10,
        maxVisitorsPerMonth: 100,
        price: 999,
        features: [
            'Up to 10 employees',
            'Up to 100 visitors per month',
            'Basic visitor management',
            'Email notifications',
            'Standard support'
        ]
    },
    {
        name: 'premium',
        displayName: 'Premium Plan',
        description: 'Ideal for growing companies',
        maxEmployees: 50,
        maxVisitorsPerMonth: 500,
        price: 2999,
        features: [
            'Up to 50 employees',
            'Up to 500 visitors per month',
            'Advanced visitor management',
            'Email & WhatsApp notifications',
            'Aadhaar verification',
            'Priority support',
            'Custom branding'
        ]
    },
    {
        name: 'enterprise',
        displayName: 'Enterprise Plan',
        description: 'For large organizations',
        maxEmployees: 200,
        maxVisitorsPerMonth: 2000,
        price: 7999,
        features: [
            'Up to 200 employees',
            'Up to 2000 visitors per month',
            'Full visitor management suite',
            'All notification types',
            'Advanced Aadhaar verification',
            '24/7 support',
            'Full customization',
            'API access',
            'White-label solution'
        ]
    }
];
