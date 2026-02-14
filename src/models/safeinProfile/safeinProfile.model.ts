import mongoose, { Schema, Document } from 'mongoose';

export interface ISafeinProfile extends Document {
    companyDetails: {
        name: string;
        email: string;
        phone?: string;
        cin?: string;
        gstin?: string;
        pan?: string;
        tan?: string;
        logo?: string;
        signature?: string;
        address?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        taxId?: string;
        taxType?: string;
        registrationNumber?: string;
        website?: string;
    };
    bankDetails?: {
        bankName?: string;
        accountNumber?: string;
        ifscCode?: string;
        branchName?: string;
        upiId?: string;
        accountHolderName?: string;
        paymentQR?: string;
    };
    documentSettings?: {
        header?: string;
        footer?: string;
        watermark?: string;
        invoicePrefix?: string;
        nextInvoiceNumber?: number;
        quotationPrefix?: string;
        nextQuotationNumber?: number;
    };
    localization?: {
        currency?: string;
        currencySymbol?: string;
        timezone?: string;
        language?: string;
    };
    appearance?: {
        brandColors?: {
            primary?: string;
            secondary?: string;
        };
        socialLinks?: {
            linkedin?: string;
            twitter?: string;
            facebook?: string;
            instagram?: string;
        };
        showCompanyLogo?: boolean;
        showSignature?: boolean;
        showBankDetails?: boolean;
        showPaymentQR?: boolean;
        footerText?: string;
        quantityLabel?: string;
        showTaxDetails?: boolean;
        showDiscountColumn?: boolean;
        showGST?: boolean;
    };
    defaults?: {
        defaultNotes?: {
            invoice?: string;
            quotation?: string;
        };
        defaultTerms?: {
            invoice?: string;
            quotation?: string;
        };
    };
    isActive?: boolean;
    isDefault?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const SafeinProfileSchema = new Schema(
    {
        companyDetails: {
            name: { type: String, required: true },
            email: { type: String, required: true },
            phone: { type: String },
            cin: { type: String },
            gstin: { type: String },
            pan: { type: String },
            tan: { type: String },
            logo: { type: String },
            signature: { type: String },
            address: { type: String },
            city: { type: String },
            state: { type: String },
            country: { type: String },
            postalCode: { type: String },
            taxId: { type: String },
            taxType: { type: String },
            registrationNumber: { type: String },
            website: { type: String },
        },
        bankDetails: {
            bankName: { type: String },
            accountNumber: { type: String },
            ifscCode: { type: String },
            branchName: { type: String },
            upiId: { type: String },
            accountHolderName: { type: String },
            paymentQR: { type: String },
        },
        documentSettings: {
            header: { type: String },
            footer: { type: String },
            watermark: { type: String },
            invoicePrefix: { type: String },
            nextInvoiceNumber: { type: Number },
            quotationPrefix: { type: String },
            nextQuotationNumber: { type: Number },
        },
        localization: {
            currency: { type: String },
            currencySymbol: { type: String },
            timezone: { type: String },
            language: { type: String },
        },
        appearance: {
            brandColors: {
                primary: { type: String },
                secondary: { type: String },
            },
            socialLinks: {
                linkedin: { type: String },
                twitter: { type: String },
                facebook: { type: String },
                instagram: { type: String },
            },
            showCompanyLogo: { type: Boolean },
            showSignature: { type: Boolean },
            showBankDetails: { type: Boolean },
            showPaymentQR: { type: Boolean },
            footerText: { type: String },
            quantityLabel: { type: String },
            showTaxDetails: { type: Boolean },
            showDiscountColumn: { type: Boolean },
            showGST: { type: Boolean },
        },
        defaults: {
            defaultNotes: {
                invoice: { type: String },
                quotation: { type: String },
            },
            defaultTerms: {
                invoice: { type: String },
                quotation: { type: String },
            },
        },
        isActive: { type: Boolean, default: true },
        isDefault: { type: Boolean, default: false },
    },
    {
        timestamps: true,
    }
);

// Point to 'businessprofiles' collection to share data with super-admin-backend
export const SafeinProfile = mongoose.model<ISafeinProfile>('BusinessProfile', SafeinProfileSchema, 'businessprofiles');
