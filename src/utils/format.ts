/**
 * Formatting utilities for numbers, currencies, dates, and phone numbers.
 */

/**
 * Formats a monetary amount into localized currency format.
 *
 * @param amount - The numeric monetary value.
 * @param currency - 3-letter ISO currency code (defaults to "GHS").
 * @param locale - BCP 47 language tag (defaults to "en-GH").
 * @returns Formatted currency string (e.g. "GHS 1,500.00").
 */
export function formatCurrency(amount: number, currency: string = 'GHS', locale: string = 'en-GH'): string {
  if (isNaN(amount)) return `${currency} 0.00`;
  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      currencyDisplay: 'code',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const parts = formatter.formatToParts(amount);
    return parts
      .map((p) => (p.type === 'currency' ? p.value + ' ' : p.value))
      .join('')
      .replace(/\s+/g, ' ')
      .trim();
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export interface FormatNumberOptions {
  decimals?: number;
  compact?: boolean;
  locale?: string;
}

/**
 * Formats a numeric value with decimal places or compact notation (1.2k, 3.4M).
 *
 * @param value - Number to format.
 * @param options - Formatting configuration.
 * @returns Formatted numeric string.
 */
export function formatNumber(value: number, options: FormatNumberOptions = {}): string {
  const { decimals, compact = false, locale = 'en-US' } = options;

  if (isNaN(value)) return '0';

  try {
    return new Intl.NumberFormat(locale, {
      notation: compact ? 'compact' : 'standard',
      maximumFractionDigits: decimals ?? (compact ? 1 : 2),
      minimumFractionDigits: decimals ?? 0,
    }).format(value);
  } catch {
    return value.toString();
  }
}

/**
 * Extracts a 1-2 letter uppercase monogram / initials for business branding.
 *
 * @param name - The business name string.
 * @returns 1-2 character uppercase initials (e.g. "Unique Fashion" -> "UF").
 */
export function getBusinessInitials(name?: string | null): string {
  if (!name || !name.trim()) return 'M';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase();
}

/**
 * Formats a date into a localized string.
 *
 * @param date - Date object, ISO timestamp, or milliseconds.
 * @param options - Intl.DateTimeFormatOptions override.
 * @param locale - BCP 47 language tag.
 * @returns Formatted date string or empty string on invalid date.
 */
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  },
  locale: string = 'en-US',
  timeZone?: string
): string {
  const parsed = date instanceof Date ? date : new Date(date);
  if (isNaN(parsed.getTime())) return '';

  try {
    const formatOptions: Intl.DateTimeFormatOptions = {
      ...options,
      ...(timeZone ? { timeZone } : {}),
    };
    return new Intl.DateTimeFormat(locale, formatOptions).format(parsed);
  } catch {
    // Fallback if invalid timeZone provided or Intl error occurs
    try {
      return new Intl.DateTimeFormat(locale, options).format(parsed);
    } catch {
      return parsed.toDateString();
    }
  }
}

/**
 * Formats a date relative to now (e.g. "just now", "5m ago", "2h ago", "3d ago").
 *
 * @param date - Date object, ISO timestamp, or milliseconds.
 * @param baseDate - Reference date (defaults to new Date()).
 * @returns Short human-readable relative time string.
 */
export function formatRelativeTime(date: Date | string | number, baseDate: Date = new Date()): string {
  const parsed = date instanceof Date ? date : new Date(date);
  if (isNaN(parsed.getTime())) return '';

  const diffMs = baseDate.getTime() - parsed.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 0) return 'in the future';
  if (diffSec < 45) return 'just now';
  if (diffSec < 90) return '1m ago';

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;

  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears}y ago`;
}

/**
 * Formats phone numbers into standardized international or readable formats.
 *
 * @param phone - Raw phone number string.
 * @param defaultCountryCode - Country calling code without + (defaults to "233").
 * @returns Cleaned and formatted phone number string.
 */
export function formatPhoneNumber(phone: string, defaultCountryCode: string = '233'): string {
  if (!phone) return '';
  const trimmed = phone.trim();

  // If already formatted with spaces and leading +
  if (trimmed.startsWith('+') && trimmed.includes(' ')) {
    return trimmed;
  }

  const cleaned = trimmed.replace(/[^0-9+]/g, '');

  // If local Ghana number starting with 0 (e.g. 0241234567 -> +233 24 123 4567)
  if (cleaned.startsWith('0') && cleaned.length === 10 && defaultCountryCode === '233') {
    const withoutZero = cleaned.substring(1);
    return `+233 ${withoutZero.slice(0, 2)} ${withoutZero.slice(2, 5)} ${withoutZero.slice(5)}`;
  }

  // If starts with country code without plus (e.g. 233241234567)
  if (cleaned.startsWith(defaultCountryCode) && cleaned.length === 12) {
    const rest = cleaned.substring(defaultCountryCode.length);
    return `+${defaultCountryCode} ${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5)}`;
  }

  return cleaned;
}

/**
 * Converts a text string (such as a product name) into an SEO-friendly URL slug.
 */
export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
