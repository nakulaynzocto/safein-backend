import { Request, Response, NextFunction } from 'express';
import { EmployeeService } from '../../services/employee/employee.service';
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

export class EmployeeController {
    /**
     * Create a new employee
     * POST /api/employees
     */
    @TryCatch('Failed to create employee')
    static async createEmployee(req: Request, res: Response, _next: NextFunction): Promise<void> {
        const employeeData: ICreateEmployeeDTO = req.body;
        const employee = await EmployeeService.createEmployee(employeeData);
        ResponseUtil.success(res, 'Employee created successfully', employee, ERROR_CODES.CREATED);
    }

    /**
     * Get all employees with pagination and filtering
     * GET /api/employees
     */
    @TryCatch('Failed to get employees')
    static async getAllEmployees(req: Request, res: Response, _next: NextFunction): Promise<void> {
        const query: IGetEmployeesQuery = req.query;
        const result = await EmployeeService.getAllEmployees(query);
        ResponseUtil.success(res, 'Employees retrieved successfully', result);
    }

    /**
     * Get employee by ID
     * GET /api/employees/:id
     */
    @TryCatch('Failed to get employee')
    static async getEmployeeById(req: Request, res: Response, _next: NextFunction): Promise<void> {
        const { id } = req.params;
        const employee = await EmployeeService.getEmployeeById(id);
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
    static async deleteEmployee(req: Request, res: Response, _next: NextFunction): Promise<void> {
        const { id } = req.params;
        await EmployeeService.deleteEmployee(id);
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
     * Get employee statistics
     * GET /api/employees/stats
     */
    @TryCatch('Failed to get employee statistics')
    static async getEmployeeStats(_req: Request, res: Response, _next: NextFunction): Promise<void> {
        const stats = await EmployeeService.getEmployeeStats();
        ResponseUtil.success(res, 'Employee statistics retrieved successfully', stats);
    }
}
