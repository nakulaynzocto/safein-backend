import { getTaxSplit, amountToWords, getStateCode } from "./invoiceHelpers";

/**
 * Common subscription history response mapper
 * Used by both SuperAdminService and UserSubscriptionService
 */
export const mapSubscriptionHistoryItem = (item: any) => {
    const amount = item.amount || 0;
    const taxAmount = item.taxAmount || 0;
    const taxPercentage = item.taxPercentage || 0;
    const totalAmount = amount + taxAmount;

    let taxSplit = item.taxSplit;
    if (!taxSplit && taxAmount > 0) {
        const billingDetails = item.billingDetails || {};
        const companyDetails = billingDetails.companyDetails || {};
        const companyState = companyDetails.address?.state || companyDetails.state || 'Karnataka';
        const companyCountry = companyDetails.address?.country || companyDetails.country || 'India';

        taxSplit = getTaxSplit(
            taxAmount,
            taxPercentage,
            item.userId?.address || {}, // Attempt to get user address from populated user
            companyState,
            companyCountry
        );
    }

    let amountInWords = item.amountInWords;
    if (!amountInWords && totalAmount > 0) {
        amountInWords = amountToWords(Math.round(totalAmount));
    }

    const userState = item.userId?.address?.state || '';
    const placeOfSupplyCode = getStateCode(userState) || '';

    return {
        _id: item._id?.toString(),
        subscriptionId: item.subscriptionId?.toString() || '',
        planType: item.planType,
        planName: (item.planId as any)?.name || `${item.planType || 'Unknown'} Plan`,
        invoiceNumber: item.invoiceNumber,
        purchaseDate: item.purchaseDate,
        startDate: item.startDate,
        endDate: item.endDate,
        amount: amount,
        currency: item.currency || 'INR',
        paymentStatus: item.paymentStatus,
        razorpayOrderId: item.razorpayOrderId,
        razorpayPaymentId: item.razorpayPaymentId,
        remainingDaysFromPrevious: item.remainingDaysFromPrevious || 0,
        taxAmount: taxAmount,
        taxPercentage: taxPercentage,
        taxSplit: taxSplit,
        amountInWords: amountInWords,
        placeOfSupplyCode: placeOfSupplyCode,
        billingDetails: item.billingDetails,
        source: item.source,
        createdAt: item.createdAt,
    };
};

