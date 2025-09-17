import { IEmployee } from '../../models/employee/employee.model';

// DTOs for creating employee
export interface ICreateEmployeeDTO {
    employeeId: string;
    name: string;
    email: string;
    phone: string;
    whatsapp?: string;
    department: string;
    designation: string;
    role: string;
    officeLocation: string;
    status?: 'Active' | 'Inactive';
}

// DTOs for updating employee
export interface IUpdateEmployeeDTO {
    name?: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    department?: string;
    designation?: string;
    role?: string;
    officeLocation?: string;
    status?: 'Active' | 'Inactive';
}

// Response interface for employee
export interface IEmployeeResponse {
    _id: string;
    employeeId: string;
    name: string;
    email: string;
    phone: string;
    whatsapp?: string;
    department: string;
    designation: string;
    role: string;
    officeLocation: string;
    status: 'Active' | 'Inactive';
    createdBy: string; // Reference to User who created the employee
    isDeleted: boolean;
    deletedAt?: Date;
    deletedBy?: string; // Reference to User who deleted the employee
    createdAt: Date;
    updatedAt: Date;
}

// Query parameters for getting employees
export interface IGetEmployeesQuery {
    page?: number;
    limit?: number;
    search?: string;
    department?: string;
    status?: 'Active' | 'Inactive';
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

// Response for paginated employees
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

// Request interface for authenticated requests
export interface AuthenticatedRequest extends Request {
    user?: any;
}

// Status update DTO
export interface IUpdateEmployeeStatusDTO {
    status: 'Active' | 'Inactive';
}

// Bulk operations DTO
export interface IBulkUpdateEmployeesDTO {
    employeeIds: string[];
    status?: 'Active' | 'Inactive';
    department?: string;
    designation?: string;
}

// Employee statistics interface
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
