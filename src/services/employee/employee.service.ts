import { Employee } from '../../models/employee/employee.model';
import { Appointment } from '../../models/appointment/appointment.model';
import { User } from '../../models/user/user.model';
import {
    ICreateEmployeeDTO,
    IUpdateEmployeeDTO,
    IEmployeeResponse,
    IGetEmployeesQuery,
    IEmployeeListResponse,
    IBulkCreateEmployeeDTO,
    IBulkCreateEmployeeResponse
} from '../../types/employee/employee.types';
import { ERROR_MESSAGES, ERROR_CODES, CONSTANTS } from '../../utils';
import { AppError } from '../../middlewares/errorHandler';
import { Transaction } from '../../decorators';
import { toObjectId } from '../../utils/idExtractor.util';
import { escapeRegex } from '../../utils/string.util';
import * as crypto from 'crypto';
import { EmailService } from '../email/email.service';

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

        // Automatically create user account and send setup email
        try {
            // Check if user already exists with this email under the SAME admin
            const existingUser = await User.findOne({
                email: employeeData.email.toLowerCase().trim(),
                isDeleted: false,
                createdBy: createdByObjectId // Only check for users created by the same admin
            }).session(session);

            if (!existingUser) {
                // Check if this admin is trying to use their own email as employee
                // (That's not allowed - admin can't be their own employee)
                const currentAdmin = await User.findById(createdByObjectId).select('email').session(session);
                if (currentAdmin && currentAdmin.email.toLowerCase().trim() === employeeData.email.toLowerCase().trim()) {
                    throw new AppError(
                        `Cannot create employee with your own admin email. Please use a different email.`,
                        ERROR_CODES.CONFLICT
                    );
                }

                // Get admin user to get company name
                let companyName = employeeData.name; // Fallback
                const adminUser = await User.findById(createdByObjectId).select('companyName').session(session);
                if (adminUser) {
                    companyName = adminUser.companyName;
                }

                // Generate temp password and setup token
                const tempPassword = this.generateTempPassword();
                const setupToken = this.generateSetupToken();
                const hashedToken = crypto.createHash('sha256').update(setupToken).digest('hex');

                // Create user account
                const user = new User({
                    companyName: companyName,
                    email: employeeData.email.toLowerCase().trim(),
                    password: tempPassword,
                    roles: ['employee'],
                    isActive: false, // Will be activated after password setup
                    isEmailVerified: false,
                    passwordResetToken: hashedToken,
                    resetPasswordExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                    employeeId: (employee._id as any).toString(),
                    createdBy: createdByObjectId,
                    department: employeeData.department,
                    designation: employeeData.designation || '',
                });

                await user.save({ session });

                // Send setup email
                try {
                    const baseUrl = CONSTANTS.FRONTEND_URL || 'http://localhost:3000';
                    const setupUrl = `${baseUrl.replace(/\/$/, '')}/employee-setup?token=${setupToken}`;

                    await EmailService.sendEmployeeSetupEmail(
                        employeeData.email,
                        employeeData.name,
                        setupUrl,
                        tempPassword
                    );
                } catch (emailError: any) {
                    console.error(`[Employee Service] Failed to send setup email to ${employeeData.email}:`, emailError.message);
                    // Continue even if email fails - employee is still created
                }
            } else {
                // User exists under the same admin - this means the employee email is already registered for this admin
                throw new AppError(
                    ERROR_MESSAGES.EMPLOYEE_EMAIL_EXISTS,
                    ERROR_CODES.CONFLICT
                );
            }
        } catch (userCreationError: any) {
            // If user creation fails, throw error to rollback employee creation
            // This ensures data consistency - employee should not exist without user account
            console.error(`[Employee Service] Failed to create/link user account for employee ${employeeData.email}:`, userCreationError);
            throw new AppError(
                `Failed to create user account for employee: ${userCreationError.message || 'Unknown error'}`,
                ERROR_CODES.INTERNAL_SERVER_ERROR
            );
        }

        return employee.toObject() as unknown as IEmployeeResponse;
    }

    /**
     * Generate a secure random password
     */
    private static generateTempPassword(): string {
        const buffer = crypto.randomBytes(8);
        const base64 = buffer.toString('base64');
        return base64
            .replace(/[^A-Za-z0-9]/g, '')
            .slice(0, 12)
            .padEnd(12, '0');
    }

    /**
     * Generate password setup token
     */
    private static generateSetupToken(): string {
        return crypto.randomBytes(32).toString('hex');
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
     * For employees: Also includes their own record even if created by admin
     */
    static async getAllEmployees(query: IGetEmployeesQuery = {}, userId?: string, userEmail?: string, userEmployeeId?: string): Promise<IEmployeeListResponse> {
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

        const filter: any = { isDeleted: false, status: 'Active' };

        // Build access filter (who can see which employees)
        const accessConditions: any[] = [];
        if (userId) {
            // For employees: Include their own record even if created by admin
            if (userEmployeeId || (userEmail && userEmail.trim())) {
                accessConditions.push({ createdBy: userId }); // Employees created by this user (admin case)

                // Add employee's own record if they have employeeId or matching email
                if (userEmployeeId) {
                    accessConditions.push({ _id: userEmployeeId });
                }
                if (userEmail && userEmail.trim()) {
                    accessConditions.push({ email: userEmail.toLowerCase().trim() });
                }
            } else {
                // Admin case: only show employees they created
                accessConditions.push({ createdBy: userId });
            }
        }

        // Build search filter
        const searchConditions: any[] = [];
        if (search) {
            const escapedSearch = escapeRegex(search);
            searchConditions.push(
                { name: { $regex: escapedSearch, $options: 'i' } },
                { email: { $regex: escapedSearch, $options: 'i' } },
                { department: { $regex: escapedSearch, $options: 'i' } },
                { designation: { $regex: escapedSearch, $options: 'i' } }
            );
        }

        // Combine filters: both access AND search must match
        if (accessConditions.length > 0 && searchConditions.length > 0) {
            filter.$and = [
                { $or: accessConditions },
                { $or: searchConditions }
            ];
        } else if (accessConditions.length > 0) {
            filter.$or = accessConditions;
        } else if (searchConditions.length > 0) {
            filter.$or = searchConditions;
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

        // Allow status override if explicitly provided in query
        // Default is 'Active' (set above), but can be overridden to get all statuses
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

        // Soft delete the employee
        await (employee as any).softDelete(deletedByObjectId);

        // Handle associated user account
        // Disable user account and remove employeeId reference
        try {
            await User.updateMany(
                {
                    employeeId: (employee._id as any).toString(),
                    isDeleted: false
                },
                {
                    $unset: { employeeId: "" },
                    $set: { isActive: false }
                },
                { session }
            );
        } catch (userUpdateError: any) {
            // Log error but don't fail employee deletion
            console.error(`Failed to update user account for deleted employee ${employeeId}:`, userUpdateError);
            // Continue - employee is still deleted
        }
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
