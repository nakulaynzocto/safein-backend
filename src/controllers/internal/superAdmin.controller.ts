import { Request, Response, NextFunction } from 'express';
import { SuperAdminService } from '../../services/internal/superAdmin.service';
import { ResponseUtil } from '../../utils/response.util';
import { TryCatch } from '../../decorators';

export class SuperAdminController {

    // Get Dashboard Stats
    @TryCatch('Failed to fetch dashboard stats')
    public async getDashboardStats(_req: Request, res: Response, _next: NextFunction) {
        const stats = await SuperAdminService.getDashboardStats();
        ResponseUtil.success(res, 'Dashboard stats fetched successfully', stats);
    }

    // Get All Users (Global View)
    @TryCatch('Failed to fetch users')
    public async getAllUsers(req: Request, res: Response, _next: NextFunction) {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;

        const result = await SuperAdminService.getAllUsers(page, limit, search);
        ResponseUtil.success(res, 'Users fetched successfully', result);
    }

    // Create User
    @TryCatch('Failed to create user')
    public async createUser(req: Request, res: Response, _next: NextFunction) {
        const createdBy = (req as any).user?._id;
        const user = await SuperAdminService.createUser(req.body, createdBy);
        ResponseUtil.created(res, 'User created successfully', user);
    }

    // Get Subscription Plans
    @TryCatch('Failed to fetch subscription plans')
    public async getSubscriptionPlans(_req: Request, res: Response, _next: NextFunction) {
        const plans = await SuperAdminService.getSubscriptionPlans();
        ResponseUtil.success(res, 'Subscription plans fetched successfully', plans);
    }

    // Create Subscription Plan
    @TryCatch('Failed to create subscription plan')
    public async createSubscriptionPlan(req: Request, res: Response, _next: NextFunction) {
        const plan = await SuperAdminService.createSubscriptionPlan(req.body);
        ResponseUtil.created(res, 'Subscription plan created successfully', plan);
    }

    // Update Subscription Plan
    @TryCatch('Failed to update subscription plan')
    public async updateSubscriptionPlan(req: Request, res: Response, _next: NextFunction) {
        const plan = await SuperAdminService.updateSubscriptionPlan(req.params.id, req.body);
        ResponseUtil.success(res, 'Subscription plan updated successfully', plan);
    }

    // Get Audit Logs
    @TryCatch('Failed to fetch audit logs')
    public async getAuditLogs(_req: Request, res: Response, _next: NextFunction) {
        const logs = await SuperAdminService.getAuditLogs();
        ResponseUtil.success(res, 'Audit logs fetched successfully', logs);
    }

    // Toggle Subscription / Feature
    @TryCatch('Failed to toggle feature')
    public async toggleFeature(req: Request, res: Response, _next: NextFunction) {
        const message = await SuperAdminService.toggleFeature(req.body);
        ResponseUtil.success(res, message, null);
    }

    // Get User By ID (Enhanced)
    @TryCatch('Failed to fetch user details')
    public async getUserById(req: Request, res: Response, _next: NextFunction) {
        const result = await SuperAdminService.getUserById(req.params.id);
        ResponseUtil.success(res, 'User details fetched successfully', result);
    }

    // Update User Profile (User details + Notifications)
    @TryCatch('Failed to update user profile')
    public async updateUserProfile(req: Request, res: Response, _next: NextFunction) {
        const updatedBy = (req as any).user?._id;
        const result = await SuperAdminService.updateUserProfile(req.params.id, req.body, updatedBy);
        ResponseUtil.success(res, result, null);
    }

    // Assign Subscription Manually
    @TryCatch('Failed to assign subscription')
    public async assignSubscription(req: Request, res: Response, _next: NextFunction) {
        const result = await SuperAdminService.assignSubscription(req.params.id, req.body);
        ResponseUtil.success(res, 'Subscription assigned successfully', result);
    }

    // Update User
    @TryCatch('Failed to update user')
    public async updateUser(req: Request, res: Response, _next: NextFunction) {
        const result = await SuperAdminService.updateUser(req.params.id, req.body);
        ResponseUtil.success(res, 'User updated successfully', result);
    }

    // Delete User (Soft Delete)
    @TryCatch('Failed to delete user')
    public async deleteUser(req: Request, res: Response, _next: NextFunction) {
        const result = await SuperAdminService.deleteUser(req.params.id);
        ResponseUtil.success(res, result, null);
    }

    // Get Subscription History
    @TryCatch('Failed to get subscription history')
    public async getSubscriptionHistory(req: Request, res: Response, _next: NextFunction) {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 5;
        const result = await SuperAdminService.getSubscriptionHistory(req.params.id, page, limit);
        ResponseUtil.success(res, 'Subscription history fetched successfully', result);
    }

    @TryCatch('Failed to cancel subscription')
    public async cancelSubscription(req: Request, res: Response, _next: NextFunction) {
        const result = await SuperAdminService.cancelSubscription(req.params.id);
        ResponseUtil.success(res, 'Subscription cancelled successfully', result);
    }
    @TryCatch('Failed to impersonate user')
    public async impersonateUser(req: Request, res: Response, _next: NextFunction) {
        const result = await SuperAdminService.impersonateUser(req.params.id);
        ResponseUtil.success(res, 'Impersonation token generated successfully', result);
    }

    // Support Inquiries
}
