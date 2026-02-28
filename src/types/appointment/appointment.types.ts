
export type AppointmentStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'checked_in';
export type IDProofType = 'aadhaar' | 'pan' | 'driving_license' | 'passport' | 'other';

export interface IVisitorDetails {
    name: string;
    email?: string;
    phone: string;
    address?: {
        street: string;
        city: string;
        state: string;
        country: string;
        zipCode: string;
    };
    idProof: {
        type: IDProofType;
        number: string;
        image?: string;
    };
    photo?: string;
}

export interface IAccompaniedBy {
    name: string;
    phone: string;
    relation: string;
    idProof?: {
        type: IDProofType;
        number: string;
        image?: string;
    };
}

export interface IAppointmentDetails {
    purpose: string;
    scheduledDate: Date;
    scheduledTime: string;
    notes?: string;
    vehicleNumber?: string; // Optional vehicle number
    vehiclePhoto?: string; // Optional vehicle photo URL
}

export interface ISecurityDetails {
    badgeIssued: boolean;
    badgeNumber?: string;
    securityClearance: boolean;
    securityNotes?: string;
}

export interface INotifications {
    smsSent: boolean;
    emailSent: boolean;
    whatsappSent: boolean;
    reminderSent: boolean;
}

export interface ICreateAppointmentDTO {
    employeeId: string;
    visitorId: string; // Reference to Visitor
    accompaniedBy?: IAccompaniedBy;
    accompanyingCount?: number;
    appointmentDetails: IAppointmentDetails;
    securityDetails?: ISecurityDetails;
    notifications?: INotifications;
    status?: AppointmentStatus; // Optional: if not provided, defaults to 'pending'
}

export interface IUpdateAppointmentDTO {
    employeeId?: string;
    visitorId?: string; // Reference to Visitor
    accompaniedBy?: Partial<IAccompaniedBy>;
    accompanyingCount?: number;
    appointmentDetails?: Partial<IAppointmentDetails>;
    status?: AppointmentStatus;
    checkInTime?: Date;
    checkOutTime?: Date;
    actualDuration?: number;
    securityDetails?: Partial<ISecurityDetails>;
    notifications?: Partial<INotifications>;
}

export interface IAppointmentResponse {
    _id: string;
    employeeId: string;
    visitorId: string; // Reference to Visitor
    visitor?: IVisitorDetails; // Populated visitor details
    accompaniedBy?: IAccompaniedBy;
    appointmentDetails: IAppointmentDetails;
    status: AppointmentStatus;
    checkInTime?: Date;
    checkOutTime?: Date;
    actualDuration?: number;
    securityDetails: ISecurityDetails;
    notifications: INotifications;
    createdBy: string;
    isDeleted: boolean;
    deletedAt?: Date;
    deletedBy?: string;
    createdAt: Date;
    updatedAt: Date;
    approvalLink?: string | null; // One-time approval link
}

export interface IGetAppointmentsQuery {
    page?: number;
    limit?: number;
    search?: string;
    employeeId?: string;
    status?: AppointmentStatus;
    scheduledDate?: string; // YYYY-MM-DD format
    startDate?: string; // YYYY-MM-DD format
    endDate?: string; // YYYY-MM-DD format
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    searchType?: 'visitor_name' | 'visitor_phone' | 'visitor_email' | 'appointment_id' | 'employee_name';
    view?: 'list' | 'calendar';
}

export interface IAppointmentListResponse {
    appointments: IAppointmentResponse[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalAppointments: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}

export interface ICheckInRequest {
    appointmentId: string;  // MongoDB _id
    badgeNumber?: string;
    securityNotes?: string;
}

export interface ICheckOutRequest {
    appointmentId: string;  // MongoDB _id
    notes?: string;
}






