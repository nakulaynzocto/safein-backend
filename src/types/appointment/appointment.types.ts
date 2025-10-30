
export type AppointmentStatus = 'pending' | 'approved' | 'rejected' | 'completed';
export type IDProofType = 'aadhaar' | 'pan' | 'driving_license' | 'passport' | 'other';

export interface IVisitorDetails {
    name: string;
    email?: string;
    phone: string;
    company?: string;
    designation?: string;
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
    duration: number; // in minutes
    meetingRoom?: string;
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
    appointmentDetails: IAppointmentDetails;
    securityDetails?: ISecurityDetails;
    notifications?: INotifications;
}

export interface IUpdateAppointmentDTO {
    employeeId?: string;
    visitorId?: string; // Reference to Visitor
    accompaniedBy?: Partial<IAccompaniedBy>;
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
    appointmentId: string;
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
    appointmentId: string;  // Custom appointmentId (e.g., "APT1760335163234DWU4Z") - NOT MongoDB _id
    badgeNumber?: string;
    securityNotes?: string;
}

export interface ICheckOutRequest {
    appointmentId: string;  // Custom appointmentId (e.g., "APT1760335163234DWU4Z") - NOT MongoDB _id
    notes?: string;
}

export interface IAppointmentStats {
    totalAppointments: number;
    scheduledAppointments: number;
    checkedInAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    noShowAppointments: number;
    appointmentsByStatus: Array<{
        status: string;
        count: number;
    }>;
    appointmentsByEmployee: Array<{
        employeeId: string;
        employeeName: string;
        count: number;
    }>;
    appointmentsByDate: Array<{
        date: string;
        count: number;
    }>;
}

export interface IBulkUpdateAppointmentsDTO {
    appointmentIds: string[];
    status?: AppointmentStatus;
    employeeId?: string;
    meetingRoom?: string;
}

export interface IAppointmentCalendarResponse {
    date: string;
    appointments: Array<{
        appointmentId: string;
        visitorName: string;
        employeeName: string;
        scheduledTime: string;
        duration: number;
        status: AppointmentStatus;
        purpose: string;
    }>;
}

export interface IAppointmentSearchRequest {
    query: string;
    type: 'visitor_name' | 'visitor_phone' | 'visitor_email' | 'appointment_id' | 'employee_name';
    page?: number;
    limit?: number;
}
