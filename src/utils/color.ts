/**
 * Color utility functions for brand themes and accessibility.
 */

/**
 * Validates whether a string is a valid 3-digit or 6-digit hex color with a leading #.
 */
export function isValidHex(hex: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex);
}

/**
 * Normalizes a 3-digit hex (#rgb) or 6-digit hex (#rrggbb) into a standard 6-digit hex (#rrggbb).
 * Returns '#000000' fallback if invalid.
 */
export function normalizeHex(hex: string): string {
  if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    return hex;
  }
  if (/^#[0-9A-Fa-f]{3}$/.test(hex)) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  return '#000000';
}

/**
 * Calculates YIQ perceived brightness contrast to return either '#000000' or '#ffffff'
 * ensuring text readability over dynamic background colors.
 */
export function getContrastTextColor(hexColor: string): '#000000' | '#ffffff' {
  const cleanHex = hexColor.replace('#', '');
  if (cleanHex.length !== 6 && cleanHex.length !== 3) {
    return '#000000';
  }

  const r = cleanHex.length === 3 ? parseInt(cleanHex[0] + cleanHex[0], 16) : parseInt(cleanHex.substring(0, 2), 16);
  const g = cleanHex.length === 3 ? parseInt(cleanHex[1] + cleanHex[1], 16) : parseInt(cleanHex.substring(2, 4), 16);
  const b = cleanHex.length === 3 ? parseInt(cleanHex[2] + cleanHex[2], 16) : parseInt(cleanHex.substring(4, 6), 16);

  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return '#000000';
  }

  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#000000' : '#ffffff';
}
