import mongoose, { Schema, Document } from 'mongoose';

export interface IAddress {
    street: string;
    city: string;
    state: string;
    country: string;
}

export interface IIdProof {
    type?: string;
    number?: string;
    image?: string;
}

export interface IVisitor extends Document {
    name: string;
    email?: string;
    phone: string;
    gender?: 'male' | 'female' | 'other';
    address: IAddress;
    idProof: IIdProof;
    photo?: string;

    // Safety & Categorization
    blacklisted: boolean;
    blacklistReason?: string;
    tags?: string[];
    emergencyContacts?: Array<{
        name: string;
        countryCode: string;
        phone: string; // Must total exactly 15 digits with country code
    }>;

    createdBy: mongoose.Types.ObjectId; // Reference to User who created the visitor
    isDeleted: boolean;
    deletedAt?: Date;
    deletedBy?: mongoose.Types.ObjectId; // Reference to User who deleted the visitor
    createdAt: Date;
    updatedAt: Date;
}

const addressSchema = new Schema<IAddress>({
    street: {
        type: String,
        required: false,
        trim: true,
        validate: {
            validator: function (value: string) {
                if (!value || value.trim().length === 0) return true;
                return value.trim().length >= 2;
            },
            message: 'Street address must be at least 2 characters. Please enter a complete address or leave it empty.'
        },
        maxlength: [200, 'Street address cannot exceed 200 characters'],
        default: ''
    },
    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
        minlength: [2, 'City must be at least 2 characters long'],
        maxlength: [100, 'City cannot exceed 100 characters']
    },
    state: {
        type: String,
        required: [true, 'State is required'],
        trim: true,
        minlength: [2, 'State must be at least 2 characters long'],
        maxlength: [100, 'State cannot exceed 100 characters']
    },
    country: {
        type: String,
        required: [true, 'Country is required'],
        trim: true,
        minlength: [2, 'Country must be at least 2 characters long'],
        maxlength: [100, 'Country cannot exceed 100 characters']
    }
}, { _id: false });

const idProofSchema = new Schema<IIdProof>({
    type: {
        type: String,
        required: false,
        trim: true,
        validate: {
            validator: function (value: string) {
                if (!value || value.trim().length === 0) return true;
                return value.trim().length >= 2;
            },
            message: 'ID proof type must be at least 2 characters. Please enter a complete ID type or leave it empty.'
        },
        maxlength: [50, 'ID proof type cannot exceed 50 characters'],
        default: ''
    },
    number: {
        type: String,
        required: false,
        trim: true,
        validate: {
            validator: function (value: string) {
                if (!value || value.trim().length === 0) return true;
                return value.trim().length >= 2;
            },
            message: 'ID proof number must be at least 2 characters. Please enter a complete ID number or leave it empty.'
        },
        maxlength: [50, 'ID proof number cannot exceed 50 characters'],
        default: ''
    },
    image: {
        type: String,
        trim: true,
        maxlength: [500, 'ID proof image URL cannot exceed 500 characters']
    }
}, { _id: false });

const visitorSchema = new Schema<IVisitor>({
    name: {
        type: String,
        required: [true, 'Visitor name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters long'],
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: false,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
        default: null
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
        match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
    },
    gender: {
        type: String,
        enum: {
            values: ['male', 'female', 'other'],
            message: 'Gender must be one of: male, female, other'
        }
    },
    address: {
        type: addressSchema,
        required: [true, 'Address is required']
    },
    idProof: {
        type: idProofSchema,
        required: false
    },
    photo: {
        type: String,
        trim: true,
        maxlength: [500, 'Photo URL cannot exceed 500 characters']
    },
    blacklisted: {
        type: Boolean,
        default: false
    },
    blacklistReason: {
        type: String,
        trim: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    emergencyContacts: [{
        name: {
            type: String,
            required: [true, 'Emergency contact name is required'],
            trim: true,
            minlength: [2, 'Emergency contact name must be at least 2 characters'],
            maxlength: [100, 'Emergency contact name cannot exceed 100 characters']
        },
        countryCode: {
            type: String,
            required: [true, 'Country code is required'],
            trim: true,
            match: [/^\+\d{1,4}$/, 'Country code must start with + and contain 1-4 digits (e.g., +91, +1)']
        },
        phone: {
            type: String,
            required: [true, 'Emergency contact phone is required'],
            trim: true,
            validate: {
                validator: function (value: string) {
                    // Phone number should contain only digits
                    if (!/^\d+$/.test(value)) return false;

                    // Get the country code from the same document
                    const countryCode = (this as any).countryCode || '';
                    const countryCodeDigits = countryCode.replace(/^\+/, ''); // Remove + sign

                    // Total digits (country code + phone) must be exactly 15
                    const totalDigits = countryCodeDigits.length + value.length;
                    return totalDigits === 15;
                },
                message: 'Total phone number (country code + phone) must be exactly 15 digits'
            }
        }
    }],
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Created by user ID is required']
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
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

visitorSchema.index({ email: 1 });
visitorSchema.index({ phone: 1 });
visitorSchema.index({ 'address.city': 1 });
visitorSchema.index({ 'address.state': 1 });
visitorSchema.index({ 'address.country': 1 });
visitorSchema.index({ isDeleted: 1 });
visitorSchema.index({ deletedAt: 1 });
visitorSchema.index({ createdBy: 1 });

visitorSchema.index({ createdBy: 1, email: 1 }, {
    unique: true,
    partialFilterExpression: { email: { $type: "string" } }
});
visitorSchema.index({ createdBy: 1, phone: 1 }, { unique: true });

visitorSchema.virtual('fullName').get(function () {
    return this.name;
});

visitorSchema.statics.findActive = function () {
    return this.find({ isDeleted: false });
};

visitorSchema.statics.findDeleted = function () {
    return this.find({ isDeleted: true });
};

visitorSchema.methods.softDelete = function (deletedBy: mongoose.Types.ObjectId) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = deletedBy;
    return this.save();
};

visitorSchema.methods.restore = function () {
    this.isDeleted = false;
    this.deletedAt = null;
    this.deletedBy = null;
    return this.save();
};

export const Visitor = mongoose.model<IVisitor>('Visitor', visitorSchema);
