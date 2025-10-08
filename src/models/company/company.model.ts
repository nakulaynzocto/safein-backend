import mongoose, { Schema } from 'mongoose';

export interface ICompany extends mongoose.Document {
    _id: string;
    userId: mongoose.Types.ObjectId; // Reference to User who created the company
    companyName: string;
    companyCode: string;
    address: {
        street: string;
        city: string;
        state: string;
        country: string;
        zipCode: string;
    };
    settings: {
        allowAadhaarVerification: boolean;
        requireAadhaarPhoto: boolean;
        allowWhatsAppNotifications: boolean;
        allowEmailNotifications: boolean;
        timezone: string;
        logo?: string;
    };
    isActive: boolean;
    isDeleted: boolean;
    deletedAt?: Date;
    deletedBy?: mongoose.Types.ObjectId; // Reference to User who deleted the company
    createdAt: Date;
    updatedAt: Date;
}

const companySchema = new Schema<ICompany>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required']
        },
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
                default: 'IN' // India country code
            },
            zipCode: {
                type: String,
                required: [true, 'ZIP code is required'],
                trim: true
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
            timezone: {
                type: String,
                default: 'Asia/Kolkata'
            },
            logo: {
                type: String,
                trim: true
            },
        },
        isActive: {
            type: Boolean,
            default: true
        },
        isDeleted: {
            type: Boolean,
            default: false
        },
        deletedAt: {
            type: Date,
            default: null
        },
        deletedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// Indexes for performance
companySchema.index({ createdAt: -1 });
companySchema.index({ userId: 1 });
companySchema.index({ isDeleted: 1 });
companySchema.index({ deletedAt: 1 });

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

// Static method to find active companies
companySchema.statics.findActive = function () {
    return this.find({ isDeleted: false, isActive: true });
};

// Static method to find deleted companies
companySchema.statics.findDeleted = function () {
    return this.find({ isDeleted: true });
};

// Instance method to soft delete
companySchema.methods.softDelete = function (deletedBy: mongoose.Types.ObjectId) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = deletedBy;
    return this.save();
};

// Instance method to restore
companySchema.methods.restore = function () {
    this.isDeleted = false;
    this.deletedAt = null;
    this.deletedBy = null;
    return this.save();
};

export const Company = mongoose.model<ICompany>('Company', companySchema);