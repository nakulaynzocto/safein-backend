import { IAddress, IIdProof } from '../../models/visitor/visitor.model';

// DTOs for creating visitor
export interface ICreateVisitorDTO {
    visitorId?: string; // Optional visitor ID
    name: string;
    email: string;
    phone: string;
    address: IAddress;
    idProof: IIdProof;
    photo?: string;
}

// DTOs for updating visitor
export interface IUpdateVisitorDTO {
    name?: string;
    email?: string;
    phone?: string;
    address?: IAddress;
    idProof?: IIdProof;
    photo?: string;
}

// Response interface for visitor
export interface IVisitorResponse {
    _id: string;
    visitorId?: string; // Add visitorId to response
    name: string;
    email: string;
    phone: string;
    address: IAddress;
    idProof: IIdProof;
    photo?: string;
    createdBy: string; // Reference to User who created the visitor
    isDeleted: boolean;
    deletedAt?: Date;
    deletedBy?: string; // Reference to User who deleted the visitor
    createdAt: Date;
    updatedAt: Date;
}

// Query parameters for getting visitors
export interface IGetVisitorsQuery {
    page?: number;
    limit?: number;
    search?: string;
    // Optional date range filters (ISO yyyy-mm-dd)
    startDate?: string;
    endDate?: string;
    city?: string;
    state?: string;
    country?: string;
    idProofType?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

// Response for paginated visitors
export interface IVisitorListResponse {
    visitors: IVisitorResponse[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalVisitors: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}

// Bulk operations DTO
export interface IBulkUpdateVisitorsDTO {
    visitorIds: string[];
}

// Search query interface for visitor search
export interface IVisitorSearchQuery {
    phone?: string;
    email?: string;
}

// Response for visitor search
export interface IVisitorSearchResponse {
    visitors: IVisitorResponse[];
    found: boolean;
    message: string;
}

// Visitor statistics interface
export interface IVisitorStats {
    totalVisitors: number;
    deletedVisitors: number;
    visitorsByCity: Array<{
        city: string;
        count: number;
    }>;
    visitorsByState: Array<{
        state: string;
        count: number;
    }>;
    visitorsByCountry: Array<{
        country: string;
        count: number;
    }>;
    visitorsByIdProofType: Array<{
        idProofType: string;
        count: number;
    }>;
}
