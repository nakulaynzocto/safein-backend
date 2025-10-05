import { Request, Response, NextFunction } from 'express';
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
        
        // Get employee and verify it belongs to the current user
        const employee = await EmployeeService.getEmployeeById(id);
        
        // Additional check: verify the employee was created by the current user
        const employeeRecord = await Employee.findById(id);
        if (!employeeRecord || employeeRecord.createdBy.toString() !== userId) {
            throw new AppError('Employee not found or access denied', ERROR_CODES.NOT_FOUND);
        }
        
        ResponseUtil.success(res, 'Employee retrieved successfully', employee);
    }

    /**
     * Update employee
     * PUT /api/employees/:id
     */
    @TryCatch('Failed to update employee')
    static async updateEmployee(req: Request, res: Response, _next: NextFunction): Promise<void> {
        const { id } = req.params;
        const updateData: IUpdateEmployeeDTO = req.body;
        const employee = await EmployeeService.updateEmployee(id, updateData);
        ResponseUtil.success(res, 'Employee updated successfully', employee);
    }

    /**
     * Soft delete employee
     * DELETE /api/employees/:id
     */
    @TryCatch('Failed to delete employee')
    static async deleteEmployee(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) {
            throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        }
        const { id } = req.params;
        const deletedBy = req.user._id.toString();
        await EmployeeService.deleteEmployee(id, deletedBy);
        ResponseUtil.success(res, 'Employee deleted successfully');
    }

    /**
     * Get trashed employees
     * GET /api/employees/trashed
     */
    @TryCatch('Failed to get trashed employees')
    static async getTrashedEmployees(req: Request, res: Response, _next: NextFunction): Promise<void> {
        const query: IGetEmployeesQuery = req.query;
        const result = await EmployeeService.getTrashedEmployees(query);
        ResponseUtil.success(res, 'Trashed employees retrieved successfully', result);
    }

    /**
     * Restore employee from trash
     * PUT /api/employees/:id/restore
     */
    @TryCatch('Failed to restore employee')
    static async restoreEmployee(req: Request, res: Response, _next: NextFunction): Promise<void> {
        const { id } = req.params;
        const employee = await EmployeeService.restoreEmployee(id);
        ResponseUtil.success(res, 'Employee restored successfully', employee);
    }

    /**
     * Update employee status
     * PUT /api/employees/:id/status
     */
    @TryCatch('Failed to update employee status')
    static async updateEmployeeStatus(req: Request, res: Response, _next: NextFunction): Promise<void> {
        const { id } = req.params;
        const statusData: IUpdateEmployeeStatusDTO = req.body;
        const employee = await EmployeeService.updateEmployeeStatus(id, statusData);
        ResponseUtil.success(res, 'Employee status updated successfully', employee);
    }

    /**
     * Bulk update employees
     * PUT /api/employees/bulk-update
     */
    @TryCatch('Failed to bulk update employees')
    static async bulkUpdateEmployees(req: Request, res: Response, _next: NextFunction): Promise<void> {
        const bulkData: IBulkUpdateEmployeesDTO = req.body;
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
}
