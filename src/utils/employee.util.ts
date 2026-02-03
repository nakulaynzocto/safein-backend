import { Employee } from '../models/employee/employee.model';
import { IUser } from '../types/user/user.types';

export class EmployeeUtil {
  /**
   * Get employee ID from user
   * Priority: employeeId field > email matching
   */
  static async getEmployeeIdFromUser(user: IUser): Promise<string | null> {
    // Option 1: Check if user has employeeId field
    if (user.employeeId) {
      const employee = await Employee.findById(user.employeeId);
      if (employee && !employee.isDeleted && employee.status === 'Active') {
        return (employee._id as any).toString();
      }
    }

    // Option 2: Match by email
    const employee = await Employee.findOne({
      email: user.email.toLowerCase().trim(),
      isDeleted: false,
      status: 'Active'
    });

    if (employee) {
      return (employee._id as any).toString();
    }

    return null;
  }

  /**
   * Get employee object from user
   * Optimized to avoid duplicate queries
   */
  static async getEmployeeFromUser(user: IUser) {
    // Option 1: Check if user has employeeId field (fastest path)
    if (user.employeeId) {
      const employee = await Employee.findOne({
        _id: user.employeeId,
        isDeleted: false,
        status: 'Active'
      });
      if (employee) {
        return employee;
      }
    }

    // Option 2: Match by email
    const employee = await Employee.findOne({
      email: user.email.toLowerCase().trim(),
      isDeleted: false,
      status: 'Active'
    });

    return employee;
  }

  /**
   * Check if user is an employee
   * Note: During employee creation, the user account might not have employeeId set yet
   * So we check role first, then email match
   */
  static async isEmployee(user: IUser): Promise<boolean> {
    // Check role first (fastest)
    if (user.roles && user.roles.includes('employee')) {
      // If user has employee role, check if employee record exists
      // During employee creation, employeeId might not be set yet, so check by email
      const employeeId = await this.getEmployeeIdFromUser(user);
      return employeeId !== null;
    }

    // If no employee role, user is not an employee
    // Don't check by email if role doesn't include 'employee' to avoid false positives
    return false;
  }

  /**
   * Get admin user ID (createdBy) for an employee
   * This is used to check subscription limits - employees use admin's subscription
   * Validates that admin account exists, is active, and not deleted
   */
  static async getAdminUserIdForEmployee(user: IUser): Promise<string | null> {
    const employee = await this.getEmployeeFromUser(user);
    
    if (!employee || !employee.createdBy) {
      return null;
    }

    const adminUserId = (employee.createdBy as any)?.toString();
    if (!adminUserId) {
      return null;
    }

    // Verify admin account exists, is active, and not deleted
    const { User } = await import('../models/user/user.model');
    const admin = await User.findOne({
      _id: adminUserId,
      isDeleted: false,
      isActive: true
    }).select('_id roles').lean();

    // Ensure the admin user has admin role
    if (!admin || !admin.roles || !admin.roles.includes('admin')) {
      return null;
    }

    return adminUserId;
  }
}

