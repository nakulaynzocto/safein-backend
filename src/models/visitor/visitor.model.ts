import mongoose, { Schema, Document } from 'mongoose';

export interface IAddress {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
}

export interface IIdProof {
    type: string;
    number: string;
    image?: string;
}

export interface IVisitor extends Document {
    visitorId?: string; // Add this field if needed
    name: string;
    email: string;
    phone: string;
    company: string;
    designation: string;
    address: IAddress;
    idProof: IIdProof;
    photo?: string;
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
        required: [true, 'Street address is required'],
        trim: true,
        minlength: [2, 'Street address must be at least 2 characters long'],
        maxlength: [200, 'Street address cannot exceed 200 characters']
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
    },
    zipCode: {
        type: String,
        required: [true, 'ZIP code is required'],
        trim: true,
        minlength: [3, 'ZIP code must be at least 3 characters long'],
        maxlength: [20, 'ZIP code cannot exceed 20 characters']
    }
}, { _id: false });

const idProofSchema = new Schema<IIdProof>({
    type: {
        type: String,
        required: [true, 'ID proof type is required'],
        trim: true,
        minlength: [2, 'ID proof type must be at least 2 characters long'],
        maxlength: [50, 'ID proof type cannot exceed 50 characters']
    },
    number: {
        type: String,
        required: [true, 'ID proof number is required'],
        trim: true,
        minlength: [2, 'ID proof number must be at least 2 characters long'],
        maxlength: [50, 'ID proof number cannot exceed 50 characters']
    },
    image: {
        type: String,
        trim: true,
        maxlength: [500, 'ID proof image URL cannot exceed 500 characters']
    }
}, { _id: false });

const visitorSchema = new Schema<IVisitor>({
    visitorId: {
        type: String,
        sparse: true, // Allow null values but ensure uniqueness when present
        default: function() {
            // Generate a unique visitor ID
            return 'VIS' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
        }
    },
    name: {
        type: String,
        required: [true, 'Visitor name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters long'],
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
        match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
    },
    company: {
        type: String,
        required: [true, 'Company is required'],
        trim: true,
        minlength: [2, 'Company must be at least 2 characters long'],
        maxlength: [100, 'Company cannot exceed 100 characters']
    },
    designation: {
        type: String,
        required: [true, 'Designation is required'],
        trim: true,
        minlength: [2, 'Designation must be at least 2 characters long'],
        maxlength: [100, 'Designation cannot exceed 100 characters']
    },
    address: {
        type: addressSchema,
        required: [true, 'Address is required']
    },
    idProof: {
        type: idProofSchema,
        required: [true, 'ID proof is required']
    },
    photo: {
        type: String,
        trim: true,
        maxlength: [500, 'Photo URL cannot exceed 500 characters']
    },
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

// Indexes for better performance
visitorSchema.index({ visitorId: 1 }, { sparse: true });
visitorSchema.index({ email: 1 });
visitorSchema.index({ phone: 1 });
visitorSchema.index({ company: 1 });
visitorSchema.index({ 'address.city': 1 });
visitorSchema.index({ 'address.state': 1 });
visitorSchema.index({ 'address.country': 1 });
visitorSchema.index({ isDeleted: 1 });
visitorSchema.index({ deletedAt: 1 });
visitorSchema.index({ createdBy: 1 });

// Compound indexes for user-specific uniqueness
visitorSchema.index({ createdBy: 1, visitorId: 1 }, { unique: true, sparse: true });
visitorSchema.index({ createdBy: 1, email: 1 }, { unique: true });

// Virtual for full name
visitorSchema.virtual('fullName').get(function () {
    return this.name;
});

// Static method to find active visitors
visitorSchema.statics.findActive = function () {
    return this.find({ isDeleted: false });
};

// Static method to find deleted visitors
visitorSchema.statics.findDeleted = function () {
    return this.find({ isDeleted: true });
};

// Instance method to soft delete
visitorSchema.methods.softDelete = function (deletedBy: mongoose.Types.ObjectId) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = deletedBy;
    return this.save();
};

// Instance method to restore
visitorSchema.methods.restore = function () {
    this.isDeleted = false;
    this.deletedAt = null;
    this.deletedBy = null;
    return this.save();
};

export const Visitor = mongoose.model<IVisitor>('Visitor', visitorSchema);
