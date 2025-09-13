import mongoose, { Schema } from 'mongoose';

export interface ICompany extends mongoose.Document {
    _id: string;
    companyName: string;
    companyCode: string; // Unique identifier for the company
    email: string;
    phone: string;
    address: {
        street: string;
        city: string;
        state: string;
        country: string;
        zipCode: string;
    };
    contactPerson: {
        name: string;
        email: string;
        phone: string;
        designation: string;
    };
    subscription: {
        plan: 'basic' | 'premium' | 'enterprise';
        status: 'active' | 'inactive' | 'suspended' | 'trial';
        startDate: Date;
        endDate: Date;
        maxEmployees: number;
        maxVisitorsPerMonth: number;
    };
    settings: {
        allowAadhaarVerification: boolean;
        requireAadhaarPhoto: boolean;
        allowWhatsAppNotifications: boolean;
        allowEmailNotifications: boolean;
        workingHours: {
            start: string; // "09:00"
            end: string;   // "18:00"
            workingDays: number[]; // [1,2,3,4,5] for Mon-Fri
        };
        timezone: string;
        logo?: string;
        primaryColor?: string;
        secondaryColor?: string;
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;

    // Instance methods
    isSubscriptionActive(): boolean;
    canAddEmployee(): boolean;
    getRemainingEmployees(): number;
    getRemainingVisitorsThisMonth(): Promise<number>;
}

const companySchema = new Schema<ICompany>(
    {
        companyName: {
            type: String,
            required: [true, 'Company name is required'],
            trim: true,
            minlength: [2, 'Company name must be at least 2 characters'],
            maxlength: [100, 'Company name cannot exceed 100 characters']
        },
        companyCode: {
            type: String,
            required: [true, 'Company code is required'],
            unique: true,
            uppercase: true,
            trim: true,
            minlength: [3, 'Company code must be at least 3 characters'],
            maxlength: [10, 'Company code cannot exceed 10 characters'],
            match: [/^[A-Z0-9]+$/, 'Company code can only contain uppercase letters and numbers']
        },
        email: {
            type: String,
            required: [true, 'Company email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                'Please provide a valid email address'
            ]
        },
        phone: {
            type: String,
            required: [true, 'Company phone is required'],
            trim: true,
            match: [
                /^[\+]?[1-9][\d]{0,15}$/,
                'Please provide a valid phone number'
            ]
        },
        address: {
            street: {
                type: String,
                required: [true, 'Street address is required'],
                trim: true
            },
            city: {
                type: String,
                required: [true, 'City is required'],
                trim: true
            },
            state: {
                type: String,
                required: [true, 'State is required'],
                trim: true
            },
            country: {
                type: String,
                required: [true, 'Country is required'],
                trim: true,
                default: 'India'
            },
            zipCode: {
                type: String,
                required: [true, 'ZIP code is required'],
                trim: true
            }
        },
        contactPerson: {
            name: {
                type: String,
                required: [true, 'Contact person name is required'],
                trim: true
            },
            email: {
                type: String,
                required: [true, 'Contact person email is required'],
                lowercase: true,
                trim: true,
                match: [
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    'Please provide a valid email address'
                ]
            },
            phone: {
                type: String,
                required: [true, 'Contact person phone is required'],
                trim: true,
                match: [
                    /^[\+]?[1-9][\d]{0,15}$/,
                    'Please provide a valid phone number'
                ]
            },
            designation: {
                type: String,
                required: [true, 'Contact person designation is required'],
                trim: true
            }
        },
        subscription: {
            plan: {
                type: String,
                enum: {
                    values: ['basic', 'premium', 'enterprise'],
                    message: 'Plan must be basic, premium, or enterprise'
                },
                default: 'basic'
            },
            status: {
                type: String,
                enum: {
                    values: ['active', 'inactive', 'suspended', 'trial'],
                    message: 'Status must be active, inactive, suspended, or trial'
                },
                default: 'trial'
            },
            startDate: {
                type: Date,
                default: Date.now
            },
            endDate: {
                type: Date,
                required: [true, 'Subscription end date is required']
            },
            maxEmployees: {
                type: Number,
                required: [true, 'Maximum employees limit is required'],
                min: [1, 'Maximum employees must be at least 1']
            },
            maxVisitorsPerMonth: {
                type: Number,
                required: [true, 'Maximum visitors per month limit is required'],
                min: [1, 'Maximum visitors per month must be at least 1']
            }
        },
        settings: {
            allowAadhaarVerification: {
                type: Boolean,
                default: true
            },
            requireAadhaarPhoto: {
                type: Boolean,
                default: false
            },
            allowWhatsAppNotifications: {
                type: Boolean,
                default: true
            },
            allowEmailNotifications: {
                type: Boolean,
                default: true
            },
            workingHours: {
                start: {
                    type: String,
                    default: '09:00',
                    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)']
                },
                end: {
                    type: String,
                    default: '18:00',
                    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)']
                },
                workingDays: {
                    type: [Number],
                    default: [1, 2, 3, 4, 5], // Monday to Friday
                    validate: {
                        validator: function (days: number[]) {
                            return days.every(day => day >= 1 && day <= 7);
                        },
                        message: 'Working days must be between 1 (Monday) and 7 (Sunday)'
                    }
                }
            },
            timezone: {
                type: String,
                default: 'Asia/Kolkata'
            },
            logo: {
                type: String,
                trim: true
            },
            primaryColor: {
                type: String,
                default: '#3B82F6',
                match: [/^#[0-9A-F]{6}$/i, 'Invalid color format (use #RRGGBB)']
            },
            secondaryColor: {
                type: String,
                default: '#1E40AF',
                match: [/^#[0-9A-F]{6}$/i, 'Invalid color format (use #RRGGBB)']
            }
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// Indexes for performance
companySchema.index({ companyCode: 1 });
companySchema.index({ email: 1 });
companySchema.index({ 'subscription.status': 1 });
// companySchema.index({ isActive: 1 });
companySchema.index({ createdAt: -1 });

// Instance methods
companySchema.methods.isSubscriptionActive = function (): boolean {
    const now = new Date();
    return this.subscription.status === 'active' && this.subscription.endDate > now;
};

companySchema.methods.canAddEmployee = function (): boolean {
    // This would need to be implemented with actual employee count
    return this.isSubscriptionActive();
};

companySchema.methods.getRemainingEmployees = function (): number {
    // This would need to be implemented with actual employee count
    return this.subscription.maxEmployees;
};

companySchema.methods.getRemainingVisitorsThisMonth = async function (): Promise<number> {
    // This would need to be implemented with actual visitor count for current month
    return this.subscription.maxVisitorsPerMonth;
};

// Method to get public profile (without sensitive data)
companySchema.methods.getPublicProfile = function () {
    const companyObject = this.toObject();

    // Add computed fields
    companyObject.subscription.isActive = this.isSubscriptionActive();
    companyObject.subscription.remainingEmployees = this.getRemainingEmployees();
    companyObject.subscription.remainingVisitorsThisMonth = this.getRemainingVisitorsThisMonth();

    return companyObject;
};

// Pre-save middleware to generate company code if not provided
companySchema.pre('save', function (next) {
    if (!this.companyCode) {
        // Generate company code from company name
        this.companyCode = this.companyName
            .replace(/[^a-zA-Z0-9]/g, '')
            .substring(0, 8)
            .toUpperCase();
    }
    next();
});

export const Company = mongoose.model<ICompany>('Company', companySchema);
