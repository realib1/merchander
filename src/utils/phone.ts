export function normalizeGhanaPhone(phoneInput: string | null | undefined): string | null {
  if (!phoneInput) {
    return null;
  }

  // Remove spaces, hyphens, and parentheses
  let cleaned = phoneInput.replace(/[\s\-\(\)]/g, '').trim();

  // Strip prefixes
  if (cleaned.startsWith('+233')) {
    cleaned = cleaned.substring(4);
  } else if (cleaned.startsWith('233')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // Validate 9-digit Ghana subscriber number starting with valid network prefix
  // network prefixes typically start with 2 or 5
  if (/^[25]\d{8}$/.test(cleaned)) {
    return `+233${cleaned}`;
  }

  return null;
}

export function formatGhanaLocalDisplay(phoneE164: string): string {
  if (phoneE164.startsWith('+233') && phoneE164.length === 13) {
    const sub = phoneE164.substring(4);
    return `0${sub.substring(0, 2)} ${sub.substring(2, 5)} ${sub.substring(5, 9)}`;
  }
  return phoneE164;
}
