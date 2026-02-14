export interface ISafeinProfileResponse {
    _id: string;
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

export interface IUpdateSafeinProfileDTO {
    companyDetails?: {
        name?: string;
        email?: string;
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
    localization?: {
        currency?: string;
        currencySymbol?: string;
        timezone?: string;
        language?: string;
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
}
