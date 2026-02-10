export interface ICreateSpotPassDTO {
    name: string;
    phone: string;
    gender: string;
    address: string;
    photo?: string;
    vehicleNumber?: string;
    notes?: string;
    employeeId?: string;
}

export interface ISpotPassResponse {
    _id: string;
    visitorId: string;
    businessId: string;
    name: string;
    phone: string;
    gender: string;
    address: string;
    photo?: string;
    vehicleNumber?: string;
    notes?: string;
    employeeId?: string;
    checkInTime: Date;
    checkOutTime?: Date;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IGetSpotPassesQuery {
    page?: number;
    limit?: number;
    search?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface ISpotPassListResponse {
    spotPasses: ISpotPassResponse[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalPasses: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}
