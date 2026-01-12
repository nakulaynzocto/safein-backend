/**
 * Format company address from billing details
 * Handles both old (nested) and new (flat) address structures
 */
export const formatAddress = (companyDetails: any): string => {
    return [
        companyDetails.address?.street || companyDetails.address,
        companyDetails.address?.city || companyDetails.city,
        companyDetails.address?.state || companyDetails.state
    ]
        .filter(Boolean)
        .join(', ') || "Company Address, City, State";
};

/**
 * Format registered office address with fallback
 */
export const formatRegisteredAddress = (companyDetails: any): string => {
    return [
        companyDetails.address?.street || companyDetails.address,
        companyDetails.address?.city || companyDetails.city,
        companyDetails.address?.state || companyDetails.state
    ]
        .filter(Boolean)
        .join(', ') || "Registered Office Address, City, State";
};
