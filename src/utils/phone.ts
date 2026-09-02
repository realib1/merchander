/**
 * Ghana phone number normalization, validation, and telco network detection utilities.
 */

export type GhanaTelcoNetwork = 'MTN' | 'Telecel' | 'AT' | 'Unknown';

/**
 * Normalizes any Ghana phone number into standard E.164 format (+233XXXXXXXXX).
 * Accepts: "024 123 4567", "+233241234567", "233241234567", "050-123-4567", etc.
 */
export function normalizeGhanaPhone(phoneInput: string | null | undefined): string | null {
  if (!phoneInput) {
    return null;
  }

  // Remove spaces, hyphens, and parentheses
  let cleaned = phoneInput.replace(/[\s\-\(\)\.]/g, '').trim();

  // Strip prefixes
  if (cleaned.startsWith('+233')) {
    cleaned = cleaned.substring(4);
  } else if (cleaned.startsWith('233')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // Validate 9-digit Ghana subscriber number starting with valid network prefix (2, 5)
  if (/^[25]\d{8}$/.test(cleaned)) {
    return `+233${cleaned}`;
  }

  return null;
}

/**
 * Returns true if the given input is a valid Ghanaian phone number.
 */
export function isValidGhanaPhone(phoneInput: string | null | undefined): boolean {
  return normalizeGhanaPhone(phoneInput) !== null;
}

/**
 * Detects the Ghana Mobile Money / Telco network from phone number.
 */
export function detectGhanaNetwork(phoneInput: string | null | undefined): GhanaTelcoNetwork {
  const normalized = normalizeGhanaPhone(phoneInput);
  if (!normalized) return 'Unknown';

  // Extract the 2-digit local prefix after +233
  const prefix = normalized.substring(4, 6);

  // MTN: 24, 25, 53, 54, 55, 59
  if (['24', '25', '53', '54', '55', '59'].includes(prefix)) {
    return 'MTN';
  }

  // Telecel (formerly Vodafone): 20, 50
  if (['20', '50'].includes(prefix)) {
    return 'Telecel';
  }

  // AT (AirtelTigo): 26, 27, 56, 57
  if (['26', '27', '56', '57'].includes(prefix)) {
    return 'AT';
  }

  return 'Unknown';
}

/**
 * Returns the digits-only MSISDN for WhatsApp deep links (`233XXXXXXXXX`, no
 * leading `+`), or null when the input is not a valid Ghana number.
 */
export function toWhatsAppMsisdn(phoneInput: string | null | undefined): string | null {
  const normalized = normalizeGhanaPhone(phoneInput);
  return normalized ? normalized.slice(1) : null;
}

/**
 * Formats E.164 Ghana phone into local display format: 024 123 4567
 */
export function formatGhanaLocalDisplay(phone: string): string {
  const normalized = normalizeGhanaPhone(phone);
  if (normalized && normalized.startsWith('+233') && normalized.length === 13) {
    const sub = normalized.substring(4);
    return `0${sub.substring(0, 2)} ${sub.substring(2, 5)} ${sub.substring(5, 9)}`;
  }
  return phone;
}
