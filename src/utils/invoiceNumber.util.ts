/**
 * Generate invoice number with dynamic date placeholders
 * Supports: {YYYY}, {YY}, {MM}, {DD}, {SEQ}
 * 
 * @param prefix - Invoice prefix template (e.g., "INV-{YYYY}-{MM}-")
 * @param sequenceNumber - Sequential number for the invoice
 * @param date - Date to use for placeholders (defaults to current date)
 * @returns Formatted invoice number
 * 
 * @example
 * generateInvoiceNumber("INV-{YYYY}-{MM}-", 1001) // "INV-2026-01-1001"
 * generateInvoiceNumber("INV-{YY}{MM}-{SEQ}", 1001) // "INV2601-1001"
 */
export function generateInvoiceNumber(
    prefix: string = "INV",
    sequenceNumber: number,
    date: Date = new Date()
): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    let formattedPrefix = prefix
        .replace(/{YYYY}/g, String(year))
        .replace(/{YY}/g, String(year).slice(-2))
        .replace(/{MM}/g, month)
        .replace(/{DD}/g, day);

    // Check if user specified sequence placement
    if (formattedPrefix.includes("{SEQ}")) {
        return formattedPrefix.replace(/{SEQ}/g, String(sequenceNumber));
    } else {
        // Default behavior: Prefix + Sequence
        return `${formattedPrefix}-${sequenceNumber}`;
    }
}
