/**
 * String utility functions
 */

/**
 * Escape special regex characters in a string
 * This is useful when using user input in MongoDB regex queries
 * to prevent regex injection attacks and invalid patterns
 *
 * @param str - The string to escape
 * @returns The escaped string safe for use in regex
 *
 * @example
 * escapeRegex("test@example.com") // Returns "test\\@example\\.com"
 * escapeRegex("_id") // Returns "\\_id"
 */
export function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
