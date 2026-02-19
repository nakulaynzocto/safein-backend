/**
 * Convert number to Indian currency words
 */
export function amountToWords(amount: number): string {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function inWords(num: any): string {
        if ((num = num.toString()).length > 9) return 'overflow';
        const n: any = ('000000000' + num).substring(('000000000' + num).length - 9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
        if (!n) return '';
        let str = '';
        str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
        str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Lakh ' : '';
        str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Thousand ' : '';
        str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'Hundred ' : '';
        str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) : '';
        return str;
    }

    const wholeNumber = Math.floor(amount);
    const paise = Math.round((amount - wholeNumber) * 100);

    let result = inWords(wholeNumber) + 'Rupees ';
    if (paise > 0) {
        result += 'and ' + inWords(paise) + 'Paise ';
    }
    return result + 'Only';
}


const INDIAN_STATE_CODES: Record<string, string> = {
    'andaman and nicobar islands': '35', 'an': '35',
    'andhra pradesh': '37', 'ap': '37',
    'arunachal pradesh': '12', 'ar': '12',
    'assam': '18', 'as': '18',
    'bihar': '10', 'br': '10',
    'chandigarh': '04', 'ch': '04',
    'chhattisgarh': '22', 'cg': '22',
    'dadra and nagar haveli and daman and diu': '26', 'dn': '26', 'dd': '26',
    'delhi': '07', 'dl': '07',
    'goa': '30', 'ga': '30',
    'gujarat': '24', 'gj': '24',
    'haryana': '06', 'hr': '06',
    'himachal pradesh': '02', 'hp': '02',
    'jammu and kashmir': '01', 'jk': '01',
    'jharkhand': '20', 'jh': '20',
    'karnataka': '29', 'ka': '29', 'kn': '29',
    'kerala': '32', 'kl': '32',
    'ladakh': '38', 'la': '38',
    'lakshadweep': '31', 'ld': '31',
    'madhya pradesh': '23', 'mp': '23',
    'maharashtra': '27', 'mh': '27',
    'manipur': '14', 'mn': '14',
    'meghalaya': '17', 'ml': '17',
    'mizoram': '15', 'mz': '15',
    'nagaland': '13', 'nl': '13',
    'odisha': '21', 'or': '21', 'od': '21',
    'puducherry': '34', 'py': '34',
    'punjab': '03', 'pb': '03',
    'rajasthan': '08', 'rj': '08',
    'sikkim': '11', 'sk': '11',
    'tamil nadu': '33', 'tn': '33',
    'telangana': '36', 'ts': '36', 'tg': '36',
    'tripura': '16', 'tr': '16',
    'uttar pradesh': '09', 'up': '09',
    'uttarakhand': '05', 'uk': '05', 'ua': '05',
    'west bengal': '19', 'wb': '19'
};

const UT_WITHOUT_LEGISLATURE = ['35', '04', '26', '38', '31'];

/**
 * Get the 2-digit Indian State Code
 */
export const getStateCode = (state: string) => {
    if (!state) return null;
    const s = state.toLowerCase().trim();
    if (/^\d{2}$/.test(s)) return s;
    return INDIAN_STATE_CODES[s] || null;
};

/**
 * Get GST split based on state and country
 * @param taxAmount Total tax amount
 * @param taxPercentage Total tax percentage
 * @param userAddress Address object of the customer
 * @param companyState State or State Code of the seller
 * @param companyCountry Country of the seller
 */
export function getTaxSplit(
    taxAmount: number,
    taxPercentage: number,
    userAddress?: { state?: string; country?: string },
    companyState: string = 'Karnataka',
    companyCountry: string = 'India'
) {
    const userStateOrigin = (userAddress?.state || '').toLowerCase().trim();
    const userCountry = (userAddress?.country || 'India').toLowerCase().trim();

    // 1. Country Match
    const isIndiaMatch = (country: string) =>
        ['india', 'in', 'bharat', 'ind'].includes(country.toLowerCase().trim());

    const isUserInIndia = isIndiaMatch(userCountry);
    const isCompanyInIndia = isIndiaMatch(companyCountry.toLowerCase().trim());

    if (!isUserInIndia || !isCompanyInIndia) {
        return {
            components: [
                { label: 'IGST', rate: taxPercentage, amount: Math.round(taxAmount) }
            ],
            type: 'International Transaction (GST/Export)',
            isIntraState: false
        };
    }

    // 2. Intra-state vs Inter-state
    const userStateCode = getStateCode(userStateOrigin);
    const companyStateCode = getStateCode(companyState) || '29';

    let isIntraState = false;
    if (userStateCode && companyStateCode) {
        isIntraState = userStateCode === companyStateCode;
    } else if (userStateOrigin) {
        isIntraState = userStateOrigin === companyState.toLowerCase().trim();
    }

    // Default to Inter-state if state missing
    if (!userStateOrigin) isIntraState = false;

    if (isIntraState) {
        const stateTaxLabel = (userStateCode && UT_WITHOUT_LEGISLATURE.includes(userStateCode))
            ? 'UTGST'
            : 'SGST';

        return {
            components: [
                { label: 'CGST', rate: taxPercentage / 2, amount: Math.round(taxAmount / 2) },
                { label: stateTaxLabel, rate: taxPercentage / 2, amount: Math.round(taxAmount / 2) }
            ],
            type: `Intra-state (CGST + ${stateTaxLabel})`,
            isIntraState: true
        };
    } else {
        return {
            components: [
                { label: 'IGST', rate: taxPercentage, amount: Math.round(taxAmount) }
            ],
            type: 'Inter-state (IGST)',
            isIntraState: false
        };
    }
}
