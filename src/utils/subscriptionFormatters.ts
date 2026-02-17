

/**
 * Common subscription history response mapper
 * Used by both SuperAdminService and UserSubscriptionService
 */
export const mapSubscriptionHistoryItem = (item: any) => {
    return {
        _id: item._id?.toString(),
        subscriptionId: item.subscriptionId?.toString() || '',
        planType: item.planType,
        planName: (item.planId as any)?.name || `${item.planType || 'Unknown'} Plan`,
        invoiceNumber: item.invoiceNumber,
        purchaseDate: item.purchaseDate,
        startDate: item.startDate,
        endDate: item.endDate,
        amount: item.amount || 0,
        currency: item.currency || 'INR',
        paymentStatus: item.paymentStatus,
        razorpayOrderId: item.razorpayOrderId,
        razorpayPaymentId: item.razorpayPaymentId,
        remainingDaysFromPrevious: item.remainingDaysFromPrevious || 0,
        taxAmount: item.taxAmount || 0,
        taxPercentage: item.taxPercentage || 0,
        billingDetails: item.billingDetails,
        source: item.source,
        createdAt: item.createdAt,
    };
};

