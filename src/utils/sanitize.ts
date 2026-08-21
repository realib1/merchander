/**
 * Input sanitization and security helpers.
 */

const HTML_ENTITY_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
};

/**
 * Escapes unsafe HTML characters to prevent XSS injection in raw strings.
 *
 * @param str - Input string to escape.
 * @returns Sanitized string safe for rendering.
 */
export function escapeHtml(str: string): string {
  if (!str) return "";
  return str.replace(/[&<>"'/]/g, (match) => HTML_ENTITY_MAP[match] || match);
}

/**
 * Strips non-printable ASCII control characters and trims leading/trailing whitespace.
 *
 * @param input - Raw user input string.
 * @returns Cleaned input string.
 */
export function sanitizeInput(input: string): string {
  if (!input) return "";
  // Removes control characters (ASCII 0-31, 127) except standard newline and tab
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
}

/**
 * Converts a string into a URL-friendly slug.
 *
 * @param str - Input string (e.g. "Smart Boutique Accra!").
 * @returns Normalized slug (e.g. "smart-boutique-accra").
 */
export function slugify(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9\s-]/g, "") // Remove invalid characters
    .replace(/[\s_-]+/g, "-") // Replace multiple spaces/underscores with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Truncates a string to a given length without cutting off middle of words when possible.
 *
 * @param str - String to truncate.
 * @param maxLength - Maximum permitted character count.
 * @param suffix - Ellipsis or suffix (defaults to "...").
 * @returns Truncated string.
 */
export function truncate(str: string, maxLength: number, suffix: string = "..."): string {
  if (!str || str.length <= maxLength) return str || "";
  if (maxLength <= suffix.length) return str.slice(0, maxLength);

  const targetLength = maxLength - suffix.length;
  const sliced = str.slice(0, targetLength);
  const lastSpace = sliced.lastIndexOf(" ");

  // If there's a space within the last 30% of the slice, break on word boundary
  if (lastSpace > targetLength * 0.7) {
    return sliced.slice(0, lastSpace).trim() + suffix;
  }

  return sliced.trim() + suffix;
}

/**
 * Parses and sanitizes a numeric string into a safe finite number.
 *
 * @param value - Value to parse.
 * @param fallback - Default number if parsing fails (defaults to 0).
 * @returns Parsed number or fallback.
 */
export function sanitizeNumeric(value: string | number, fallback: number = 0): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }
  if (!value || typeof value !== "string") return fallback;

  const cleaned = value.replace(/[^0-9.-]/g, "");
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : fallback;
}
