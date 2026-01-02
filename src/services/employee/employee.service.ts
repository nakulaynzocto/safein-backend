import { Employee } from '../../models/employee/employee.model';
import { Appointment } from '../../models/appointment/appointment.model';
import {
    ICreateEmployeeDTO,
    IUpdateEmployeeDTO,
    IEmployeeResponse,
    IGetEmployeesQuery,
    IEmployeeListResponse,
    IBulkCreateEmployeeDTO,
    IBulkCreateEmployeeResponse
} from '../../types/employee/employee.types';
import { ERROR_MESSAGES, ERROR_CODES } from '../../utils';
import { AppError } from '../../middlewares/errorHandler';
import { Transaction } from '../../decorators';
import { toObjectId } from '../../utils/idExtractor.util';
import { escapeRegex } from '../../utils/string.util';

export class EmployeeService {
    /**
     * Create a new employee
     */
    @Transaction('Failed to create employee')
    static async createEmployee(employeeData: ICreateEmployeeDTO, createdBy: string, options: { session?: any } = {}): Promise<IEmployeeResponse> {
        const { session } = options;

        const createdByObjectId = toObjectId(createdBy);
        if (!createdByObjectId) {
            throw new AppError('Invalid user ID format', ERROR_CODES.BAD_REQUEST);
        }

        const existingEmployee = await Employee.findOne({
            email: employeeData.email,
            createdBy: createdByObjectId
        }).session(session);

        // If an employee exists with the same email but is soft-deleted, restore it instead of blocking.
        // This matches the expected behavior: deleted records should not prevent re-creation.
        if (existingEmployee) {
            if ((existingEmployee as any).isDeleted === true) {
                existingEmployee.set({
                    ...employeeData,
                    isDeleted: false,
                    deletedAt: null,
                    deletedBy: null
                });
                await existingEmployee.save({ session });
                return existingEmployee.toObject() as unknown as IEmployeeResponse;
            }
            throw new AppError(ERROR_MESSAGES.EMPLOYEE_EMAIL_EXISTS, ERROR_CODES.CONFLICT);
        }

        const employee = new Employee({ ...employeeData, createdBy: createdByObjectId });
        await employee.save({ session });

        return employee.toObject() as unknown as IEmployeeResponse;
    }

    /**
     * Get employee by ID
     */
    static async getEmployeeById(employeeId: string): Promise<IEmployeeResponse> {
        const employeeIdObjectId = toObjectId(employeeId);
        if (!employeeIdObjectId) {
            throw new AppError('Invalid employee ID format', ERROR_CODES.BAD_REQUEST);
        }

        const employee = await Employee.findOne({ _id: employeeIdObjectId, isDeleted: false });
        if (!employee) {
            throw new AppError(ERROR_MESSAGES.EMPLOYEE_NOT_FOUND, ERROR_CODES.NOT_FOUND);
        }
        return employee.toObject() as unknown as IEmployeeResponse;
    }

    /**
     * Get all employees with pagination and filtering (user-specific)
     */
    static async getAllEmployees(query: IGetEmployeesQuery = {}, userId?: string): Promise<IEmployeeListResponse> {
        const {
            page = 1,
            limit = 10,
            search = '',
            startDate = '',
            endDate = '',
            department = '',
            status = '',
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = query;

        const filter: any = { isDeleted: false };

        if (userId) {
            filter.createdBy = userId;
        }

        if (search) {
            const escapedSearch = escapeRegex(search);
            filter.$or = [
                { name: { $regex: escapedSearch, $options: 'i' } },
                { email: { $regex: escapedSearch, $options: 'i' } },
                { department: { $regex: escapedSearch, $options: 'i' } },
                { designation: { $regex: escapedSearch, $options: 'i' } }
            ];
        }

        if (startDate || endDate) {
            const createdAt: any = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                createdAt.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                createdAt.$lte = end;
            }
            filter.createdAt = createdAt;
        }

        if (department) {
            filter.department = { $regex: escapeRegex(department), $options: 'i' };
        }

        if (status) {
            filter.status = status;
        }

        const skip = (page - 1) * limit;

        const sort: any = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const [employees, totalEmployees] = await Promise.all([
            Employee.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            Employee.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(totalEmployees / limit);

        return {
            employees: employees as unknown as IEmployeeResponse[],
            pagination: {
                currentPage: page,
                totalPages,
                totalEmployees,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        };
    }

    /**
     * Update employee
     */
    @Transaction('Failed to update employee')
    static async updateEmployee(employeeId: string, updateData: IUpdateEmployeeDTO, options: { session?: any } = {}): Promise<IEmployeeResponse> {
        const { session } = options;

        const employeeIdObjectId = toObjectId(employeeId);
        if (!employeeIdObjectId) {
            throw new AppError('Invalid employee ID format', ERROR_CODES.BAD_REQUEST);
        }

        const safeUpdateData = { ...updateData };
        delete (safeUpdateData as any).session;

        const existingEmployee = await Employee.findById(employeeIdObjectId).session(session);
        if (!existingEmployee) {
            throw new AppError(ERROR_MESSAGES.EMPLOYEE_NOT_FOUND, ERROR_CODES.NOT_FOUND);
        }

        if (safeUpdateData.email) {
            const existingEmail = await Employee.findOne({
                email: safeUpdateData.email,
                createdBy: existingEmployee.createdBy,
                _id: { $ne: employeeIdObjectId }
            }).session(session);

            if (existingEmail) {
                throw new AppError(
                    ERROR_MESSAGES.EMPLOYEE_EMAIL_EXISTS,
                    ERROR_CODES.CONFLICT
                );
            }
        }

        const employee = await Employee.findByIdAndUpdate(
            employeeIdObjectId,
            safeUpdateData,
            { new: true, runValidators: true, session }
        );

        if (!employee) {
            throw new AppError(
                ERROR_MESSAGES.EMPLOYEE_NOT_FOUND,
                ERROR_CODES.NOT_FOUND
            );
        }

        return employee.toObject() as unknown as IEmployeeResponse;
    }



    /**
     * Soft delete employee
     */
    @Transaction('Failed to delete employee')
    static async deleteEmployee(employeeId: string, deletedBy: string, options: { session?: any } = {}): Promise<void> {
        const { session } = options;

        const employeeIdObjectId = toObjectId(employeeId);
        const deletedByObjectId = toObjectId(deletedBy);

        if (!employeeIdObjectId) {
            throw new AppError('Invalid employee ID format', ERROR_CODES.BAD_REQUEST);
        }
        if (!deletedByObjectId) {
            throw new AppError('Invalid user ID format', ERROR_CODES.BAD_REQUEST);
        }

        const employee = await Employee.findOne({ _id: employeeIdObjectId, isDeleted: false }).session(session);
        if (!employee) {
            throw new AppError(ERROR_MESSAGES.EMPLOYEE_NOT_FOUND, ERROR_CODES.NOT_FOUND);
        }

        // Check if any appointments exist for this employee
        const existingAppointments = await Appointment.countDocuments({
            employeeId: employeeIdObjectId,
            isDeleted: false
        }).session(session);

        if (existingAppointments > 0) {
            throw new AppError(
                `Cannot delete employee. ${existingAppointments} appointment(s) have been created with this employee. Please delete or reassign the appointments first.`,
                ERROR_CODES.BAD_REQUEST
            );
        }

        await (employee as any).softDelete(deletedByObjectId);
    }






    /**
     * Bulk create employees
     * Duplicate emails are ignored (skipped) - only unique emails are inserted
     * Optimized with batch database queries for better performance
     */
    @Transaction('Failed to bulk create employees')
    static async bulkCreateEmployees(
        bulkData: IBulkCreateEmployeeDTO,
        createdBy: string,
        options: { session?: any } = {}
    ): Promise<IBulkCreateEmployeeResponse> {
        const { session } = options;
        const { employees } = bulkData;

        if (!employees || employees.length === 0) {
            return { successCount: 0, failedCount: 0, errors: [] };
        }

        const errors: Array<{ row: number; email?: string; errors: string[] }> = [];
        let successCount = 0;
        const processedEmails = new Set<string>(); // Track emails in current batch to skip duplicates
        const validEmployees: Array<{ data: ICreateEmployeeDTO; row: number; emailLower: string }> = [];
        const emailToRowMap = new Map<string, number>(); // Map email to row for error reporting

        // Step 1: Validate and normalize emails, filter duplicates within file
        for (let i = 0; i < employees.length; i++) {
            const employeeData = employees[i];
            const row = i + 2; // +2 because row 1 is header, row 2 is first data

            try {
                const emailLower = employeeData.email.toLowerCase().trim();

                // Skip if email is duplicate within the same batch
                if (processedEmails.has(emailLower)) {
                    errors.push({
                        row,
                        email: employeeData.email,
                        errors: ['Duplicate email in file - skipped']
                    });
                    continue;
                }

                processedEmails.add(emailLower);
                emailToRowMap.set(emailLower, row);
                validEmployees.push({
                    data: { ...employeeData, email: emailLower },
                    row,
                    emailLower
                });
            } catch (error: any) {
                errors.push({
                    row,
                    email: employeeData.email,
                    errors: [error.message || 'Invalid employee data']
                });
            }
        }

        if (validEmployees.length === 0) {
            return { successCount: 0, failedCount: errors.length, errors };
        }

        // Step 2: Batch query existing employees (optimized - single query)
        const emailsToCheck = validEmployees.map(e => e.emailLower);
        const existingEmployees = await Employee.find({
            email: { $in: emailsToCheck },
            createdBy: createdBy
        }).session(session);

        const existingEmailsMap = new Map<string, any>();
        existingEmployees.forEach(emp => {
            existingEmailsMap.set(emp.email.toLowerCase(), emp);
        });

        // Step 3: Process employees in batch
        const employeesToCreate: Array<ICreateEmployeeDTO & { createdBy: string }> = [];
        const employeesToRestore: Array<{ employee: any; data: ICreateEmployeeDTO }> = [];

        for (const { data, row, emailLower } of validEmployees) {
            const existingEmployee = existingEmailsMap.get(emailLower);

            if (existingEmployee) {
                if ((existingEmployee as any).isDeleted === true) {
                    // Queue for restore
                    employeesToRestore.push({ employee: existingEmployee, data });
                } else {
                    // Skip duplicate - email already exists and is active
                    errors.push({
                        row,
                        email: data.email,
                        errors: ['Email already exists - skipped']
                    });
                }
            } else {
                // Queue for creation
                employeesToCreate.push({ ...data, createdBy });
            }
        }

        // Step 4: Batch create new employees
        if (employeesToCreate.length > 0) {
            try {
                await Employee.insertMany(employeesToCreate, { session });
                successCount += employeesToCreate.length;
            } catch (error: any) {
                // If batch insert fails, try individual inserts for better error reporting
                for (let i = 0; i < employeesToCreate.length; i++) {
                    const empData = employeesToCreate[i];
                    const row = emailToRowMap.get(empData.email.toLowerCase()) || 0;
                    try {
                        const employee = new Employee(empData);
                        await employee.save({ session });
                        successCount++;
                    } catch (err: any) {
                        const errorMessages: string[] = [];
                        if (err.name === 'ValidationError') {
                            Object.keys(err.errors).forEach((key) => {
                                errorMessages.push(`${key}: ${err.errors[key].message}`);
                            });
                        } else {
                            errorMessages.push(err.message || 'Unknown error occurred');
                        }
                        errors.push({ row, email: empData.email, errors: errorMessages });
                    }
                }
            }
        }

        // Step 5: Restore deleted employees
        for (const { employee, data } of employeesToRestore) {
            const row = emailToRowMap.get(data.email.toLowerCase()) || 0;
            try {
                employee.set({
                    ...data,
                    isDeleted: false,
                    deletedAt: null,
                    deletedBy: null
                });
                await employee.save({ session });
                successCount++;
            } catch (error: any) {
                const errorMessages: string[] = [];
                if (error.name === 'ValidationError') {
                    Object.keys(error.errors).forEach((key) => {
                        errorMessages.push(`${key}: ${error.errors[key].message}`);
                    });
                } else {
                    errorMessages.push(error.message || 'Unknown error occurred');
                }
                errors.push({ row, email: data.email, errors: errorMessages });
            }
        }

        return {
            successCount,
            failedCount: errors.length,
            errors
        };
    }
}
