import { IAddress, IIdProof } from '../../models/visitor/visitor.model';

export interface ICreateVisitorDTO {
    name: string;
    email: string;
    phone: string;
    address: IAddress;
    idProof?: IIdProof;
    photo?: string;
}

export interface IUpdateVisitorDTO {
    name?: string;
    email?: string;
    phone?: string;
    address?: IAddress;
    idProof?: IIdProof;
    photo?: string;
}

export interface IVisitorResponse {
    _id: string;
    name: string;
    email: string;
    phone: string;
    address: IAddress;
    idProof?: IIdProof;
    photo?: string;
    createdBy: string;
    isDeleted: boolean;
    deletedAt?: Date;
    deletedBy?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IGetVisitorsQuery {
    page?: number;
    limit?: number;
    search?: string;
    startDate?: string;
    endDate?: string;
    city?: string;
    state?: string;
    country?: string;
    idProofType?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

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






