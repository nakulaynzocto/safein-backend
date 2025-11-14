export interface ICreateEmployeeDTO {
    name: string;
    email: string;
    phone: string;
    department: string;
    status?: 'Active' | 'Inactive';
}

export interface IUpdateEmployeeDTO {
    name?: string;
    email?: string;
    phone?: string;
    department?: string;
    status?: 'Active' | 'Inactive';
}

export interface IEmployeeResponse {
    _id: string;
    name: string;
    email: string;
    phone: string;
    department: string;
    status: 'Active' | 'Inactive';
    createdBy: string;
    isDeleted: boolean;
    deletedAt?: Date;
    deletedBy?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IGetEmployeesQuery {
    page?: number;
    limit?: number;
    search?: string;
    startDate?: string;
    endDate?: string;
    department?: string;
    status?: 'Active' | 'Inactive';
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface IEmployeeListResponse {
    employees: IEmployeeResponse[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalEmployees: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}

export interface IUpdateEmployeeStatusDTO {
    status: 'Active' | 'Inactive';
}

export interface IBulkUpdateEmployeesDTO {
    employeeIds: string[];
    status?: 'Active' | 'Inactive';
    department?: string;
}

export interface IEmployeeStats {
    totalEmployees: number;
    activeEmployees: number;
    inactiveEmployees: number;
    deletedEmployees: number;
    employeesByDepartment: Array<{
        department: string;
        count: number;
    }>;
    employeesByStatus: Array<{
        status: string;
        count: number;
    }>;
}
