import { Company } from '../../models/company/company.model';
import {
    ICreateCompanyDTO,
    IUpdateCompanyDTO,
    ICompanyResponse,
    SUBSCRIPTION_PLANS
} from '../../types/company/company.types';
import { ERROR_MESSAGES, ERROR_CODES } from '../../utils/constants';
import { AppError } from '../../middlewares/errorHandler';

export class CompanyService {
    /**
     * Create a new company
     */
    static async createCompany(companyData: ICreateCompanyDTO): Promise<ICompanyResponse> {
        try {
            // Check if company code already exists
            if (companyData.companyCode) {
                const existingCompany = await Company.findOne({ companyCode: companyData.companyCode });
                if (existingCompany) {
                    throw new AppError('Company code already exists', ERROR_CODES.CONFLICT);
                }
            }

            // Check if email already exists
            const existingEmail = await Company.findOne({ email: companyData.email });
            if (existingEmail) {
                throw new AppError('Company email already exists', ERROR_CODES.CONFLICT);
            }

            // Create new company
            const company = new Company(companyData);
            await company.save();

            return company.getPublicProfile();
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError('Failed to create company', ERROR_CODES.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get company by ID
     */
    static async getCompanyById(companyId: string): Promise<ICompanyResponse> {
        try {
            const company = await Company.findById(companyId);
            if (!company) {
                throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND.replace('User', 'Company'), ERROR_CODES.NOT_FOUND);
            }
            return company.getPublicProfile();
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError('Failed to get company', ERROR_CODES.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get company by company code
     */
    static async getCompanyByCode(companyCode: string): Promise<ICompanyResponse> {
        try {
            const company = await Company.findOne({ companyCode: companyCode.toUpperCase() });
            if (!company) {
                throw new AppError('Company not found', ERROR_CODES.NOT_FOUND);
            }
            return company.getPublicProfile();
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError('Failed to get company', ERROR_CODES.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Update company
     */
    static async updateCompany(companyId: string, updateData: IUpdateCompanyDTO): Promise<ICompanyResponse> {
        try {
            const company = await Company.findByIdAndUpdate(
                companyId,
                updateData,
                { new: true, runValidators: true }
            );

            if (!company) {
                throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND.replace('User', 'Company'), ERROR_CODES.NOT_FOUND);
            }

            return company.getPublicProfile();
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError('Failed to update company', ERROR_CODES.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get all companies (admin function)
     */
    static async getAllCompanies(page: number = 1, limit: number = 10): Promise<{
        companies: ICompanyResponse[];
        total: number;
        page: number;
        totalPages: number;
    }> {
        try {
            const skip = (page - 1) * limit;

            const [companies, total] = await Promise.all([
                Company.find({})
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit),
                Company.countDocuments({})
            ]);

            const companiesWithoutSensitiveData = companies.map(company => company.getPublicProfile());

            return {
                companies: companiesWithoutSensitiveData,
                total,
                page,
                totalPages: Math.ceil(total / limit),
            };
        } catch (error) {
            throw new AppError('Failed to get companies', ERROR_CODES.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Delete company (admin function)
     */
    static async deleteCompany(companyId: string): Promise<void> {
        try {
            const company = await Company.findByIdAndDelete(companyId);
            if (!company) {
                throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND.replace('User', 'Company'), ERROR_CODES.NOT_FOUND);
            }
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError('Failed to delete company', ERROR_CODES.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get subscription plans
     */
    static async getSubscriptionPlans(): Promise<any[]> {
        return SUBSCRIPTION_PLANS;
    }

    /**
     * Update company subscription
     */
    static async updateSubscription(companyId: string, subscriptionData: {
        plan: 'basic' | 'premium' | 'enterprise';
        status?: 'active' | 'inactive' | 'suspended' | 'trial';
        endDate: Date;
    }): Promise<ICompanyResponse> {
        try {
            const plan = SUBSCRIPTION_PLANS.find(p => p.name === subscriptionData.plan);
            if (!plan) {
                throw new AppError('Invalid subscription plan', ERROR_CODES.BAD_REQUEST);
            }

            const company = await Company.findByIdAndUpdate(
                companyId,
                {
                    'subscription.plan': subscriptionData.plan,
                    'subscription.status': subscriptionData.status || 'active',
                    'subscription.endDate': subscriptionData.endDate,
                    'subscription.maxEmployees': plan.maxEmployees,
                    'subscription.maxVisitorsPerMonth': plan.maxVisitorsPerMonth
                },
                { new: true, runValidators: true }
            );

            if (!company) {
                throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND.replace('User', 'Company'), ERROR_CODES.NOT_FOUND);
            }

            return company.getPublicProfile();
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError('Failed to update subscription', ERROR_CODES.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Check if company can add more employees
     */
    static async canAddEmployee(companyId: string): Promise<boolean> {
        try {
            const company = await Company.findById(companyId);
            if (!company) {
                return false;
            }

            // This would need to be implemented with actual employee count
            // For now, just check if subscription is active
            return company.isSubscriptionActive();
        } catch (error) {
            return false;
        }
    }

    /**
     * Get company statistics
     */
    static async getCompanyStats(companyId: string): Promise<{
        totalEmployees: number;
        totalVisitorsThisMonth: number;
        remainingEmployees: number;
        remainingVisitors: number;
        subscriptionStatus: string;
    }> {
        try {
            const company = await Company.findById(companyId);
            if (!company) {
                throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND.replace('User', 'Company'), ERROR_CODES.NOT_FOUND);
            }

            // These would need to be implemented with actual counts
            const totalEmployees = 0; // await Employee.countDocuments({ companyId });
            const totalVisitorsThisMonth = 0; // await Visitor.countDocuments({ companyId, createdAt: { $gte: startOfMonth } });

            return {
                totalEmployees,
                totalVisitorsThisMonth,
                remainingEmployees: Math.max(0, company.subscription.maxEmployees - totalEmployees),
                remainingVisitors: Math.max(0, company.subscription.maxVisitorsPerMonth - totalVisitorsThisMonth),
                subscriptionStatus: company.subscription.status
            };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError('Failed to get company statistics', ERROR_CODES.INTERNAL_SERVER_ERROR);
        }
    }
}
