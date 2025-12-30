import { Response, NextFunction } from 'express';
import { EmployeeService } from '../../services/employee/employee.service';
import { Employee } from '../../models/employee/employee.model';
import { ResponseUtil } from '../../utils';
import {
    ICreateEmployeeDTO,
    IUpdateEmployeeDTO,
    IGetEmployeesQuery,
    IUpdateEmployeeStatusDTO,
    IBulkUpdateEmployeesDTO
} from '../../types/employee/employee.types';
import { ERROR_CODES } from '../../utils/constants';
import { TryCatch } from '../../decorators';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/errorHandler';
import * as XLSX from 'xlsx';

export class EmployeeController {
    /**
     * Create a new employee
     * POST /api/employees
     */
    @TryCatch('Failed to create employee')
    static async createEmployee(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }
        const employeeData: ICreateEmployeeDTO = req.body;
        const createdBy = req.user._id.toString();
        const employee = await EmployeeService.createEmployee(employeeData, createdBy);
        ResponseUtil.success(res, 'Employee created successfully', employee, ERROR_CODES.CREATED);
    }

    /**
     * Get all employees with pagination and filtering (user-specific)
     * GET /api/employees
     */
    @TryCatch('Failed to get employees')
    static async getAllEmployees(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }
        
        const query: IGetEmployeesQuery = req.query;
        const userId = req.user._id.toString();
        const result = await EmployeeService.getAllEmployees(query, userId);
        ResponseUtil.success(res, 'Employees retrieved successfully', result);
    }

    /**
     * Get employee by ID (user-specific)
     * GET /api/employees/:id
     */
    @TryCatch('Failed to get employee')
    static async getEmployeeById(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }
        
        const { id } = req.params;
        const userId = req.user._id.toString();
        
        const employee = await EmployeeService.getEmployeeById(id);
        
        const employeeRecord = await Employee.findById(id);
        if (!employeeRecord || employeeRecord.createdBy.toString() !== userId) {
            throw new AppError('Employee not found or access denied', ERROR_CODES.NOT_FOUND);
        }
        
        ResponseUtil.success(res, 'Employee retrieved successfully', employee);
    }

    /**
     * Update employee (user-specific)
     * PUT /api/employees/:id
     */
    @TryCatch('Failed to update employee')
    static async updateEmployee(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }
        
        const { id } = req.params;
        const updateData: IUpdateEmployeeDTO = req.body;
        const userId = req.user._id.toString();
        
        const employeeRecord = await Employee.findById(id);
        if (!employeeRecord || employeeRecord.createdBy.toString() !== userId) {
            throw new AppError('Employee not found or access denied', ERROR_CODES.NOT_FOUND);
        }
        
        const employee = await EmployeeService.updateEmployee(id, updateData);
        ResponseUtil.success(res, 'Employee updated successfully', employee);
    }

    /**
     * Soft delete employee (user-specific)
     * DELETE /api/employees/:id
     */
    @TryCatch('Failed to delete employee')
    static async deleteEmployee(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }
        
        const { id } = req.params;
        const userId = req.user._id.toString();
        
        const employeeRecord = await Employee.findById(id);
        if (!employeeRecord || employeeRecord.createdBy.toString() !== userId) {
            throw new AppError('Employee not found or access denied', ERROR_CODES.NOT_FOUND);
        }
        
        const deletedBy = req.user._id.toString();
        await EmployeeService.deleteEmployee(id, deletedBy);
        ResponseUtil.success(res, 'Employee deleted successfully');
    }

    /**
     * Check if employee has appointments
     * GET /api/employees/:id/has-appointments
     */
    @TryCatch('Failed to check employee appointments')
    static async hasAppointments(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }
        
        const { id } = req.params;
        const userId = req.user._id.toString();
        
        const employeeRecord = await Employee.findById(id);
        if (!employeeRecord || employeeRecord.createdBy.toString() !== userId) {
            throw new AppError('Employee not found or access denied', ERROR_CODES.NOT_FOUND);
        }
        
        const result = await EmployeeService.hasAppointments(id);
        ResponseUtil.success(res, 'Appointment check completed', result);
    }

    /**
     * Update employee status (user-specific)
     * PUT /api/employees/:id/status
     */
    @TryCatch('Failed to update employee status')
    static async updateEmployeeStatus(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }
        
        const { id } = req.params;
        const statusData: IUpdateEmployeeStatusDTO = req.body;
        const userId = req.user._id.toString();
        
        const employeeRecord = await Employee.findById(id);
        if (!employeeRecord || employeeRecord.createdBy.toString() !== userId) {
            throw new AppError('Employee not found or access denied', ERROR_CODES.NOT_FOUND);
        }
        
        const employee = await EmployeeService.updateEmployeeStatus(id, statusData);
        ResponseUtil.success(res, 'Employee status updated successfully', employee);
    }

    /**
     * Bulk update employees (user-specific)
     * PUT /api/employees/bulk-update
     */
    @TryCatch('Failed to bulk update employees')
    static async bulkUpdateEmployees(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }
        
        const bulkData: IBulkUpdateEmployeesDTO = req.body;
        const userId = req.user._id.toString();
        
        const employees = await Employee.find({ 
            _id: { $in: bulkData.employeeIds },
            createdBy: userId 
        });
        
        if (employees.length !== bulkData.employeeIds.length) {
            throw new AppError('Some employees not found or access denied', ERROR_CODES.NOT_FOUND);
        }
        
        const result = await EmployeeService.bulkUpdateEmployees(bulkData);
        ResponseUtil.success(res, 'Employees updated successfully', result);
    }

    /**
     * Get employee statistics (user-specific)
     * GET /api/employees/stats
     */
    @TryCatch('Failed to get employee statistics')
    static async getEmployeeStats(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }
        
        const userId = req.user._id.toString();
        const stats = await EmployeeService.getEmployeeStats(userId);
        ResponseUtil.success(res, 'Employee statistics retrieved successfully', stats);
    }

    /**
     * Download Excel template for bulk import
     * GET /api/employees/template
     */
    @TryCatch('Failed to download template')
    static async downloadTemplate(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }

        // Create workbook and worksheet
        const workbook = XLSX.utils.book_new();
        
        // Define headers
        const headers = [
            'Name',
            'Email',
            'Phone',
            'Department',
            'Designation',
            'Status'
        ];

        // Create sample data row
        const sampleData = [
            [
                'John Doe',
                'john.doe@example.com',
                '1234567890',
                'Engineering',
                'Software Engineer',
                'Active'
            ]
        ];

        // Create worksheet
        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);

        // Set column widths
        worksheet['!cols'] = [
            { wch: 20 }, // Name
            { wch: 30 }, // Email
            { wch: 15 }, // Phone
            { wch: 20 }, // Department
            { wch: 25 }, // Designation
            { wch: 12 }  // Status
        ];

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');

        // Generate buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=employee-import-template.xlsx');
        
        // Send file
        res.send(buffer);
    }

    /**
     * Bulk create employees from Excel file
     * POST /api/employees/bulk-create
     */
    @TryCatch('Failed to bulk create employees')
    static async bulkCreateEmployees(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }

        if (!req.file) {
            throw new AppError('Excel file is required', ERROR_CODES.BAD_REQUEST);
        }

        const createdBy = req.user._id.toString();
        
        try {
            // Read Excel file
            const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // Convert to JSON - map headers to lowercase keys
            const data = XLSX.utils.sheet_to_json(worksheet, { 
                defval: '', // Default value for empty cells
                raw: false // Convert all values to strings
            });

            // Validate and transform data - optimized with helper function
            const employees: ICreateEmployeeDTO[] = [];
            const VALID_STATUSES = ['Active', 'Inactive'] as const;
            
            // Helper function to get value by case-insensitive key
            const getValue = (row: any, key: string): string => {
                const keys = Object.keys(row);
                const foundKey = keys.find(k => k.toLowerCase().trim() === key.toLowerCase());
                return foundKey ? String(row[foundKey] || '').trim() : '';
            };

            for (let i = 0; i < data.length; i++) {
                const row = data[i] as any;
                
                const name = getValue(row, 'name');
                const email = getValue(row, 'email');
                const phone = getValue(row, 'phone');
                const department = getValue(row, 'department');
                const designation = getValue(row, 'designation');
                const status = getValue(row, 'status');

                // Skip empty rows
                if (!name && !email && !phone) {
                    continue;
                }

                // Transform to match DTO
                const employee: ICreateEmployeeDTO = {
                    name,
                    email: email.toLowerCase(),
                    phone,
                    department,
                    designation: designation || undefined,
                    status: (status && VALID_STATUSES.includes(status as typeof VALID_STATUSES[number]))
                        ? status as 'Active' | 'Inactive'
                        : 'Active'
                };

                employees.push(employee);
            }

            if (employees.length === 0) {
                throw new AppError('No valid employee data found in Excel file', ERROR_CODES.BAD_REQUEST);
            }

            if (employees.length > 1000) {
                throw new AppError('Maximum 1000 employees can be imported at once', ERROR_CODES.BAD_REQUEST);
            }

            // Bulk create employees
            const result = await EmployeeService.bulkCreateEmployees(
                { employees },
                createdBy
            );

            ResponseUtil.success(res, 'Bulk import completed', result);
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(`Failed to process Excel file: ${error.message}`, ERROR_CODES.BAD_REQUEST);
        }
    }
}
