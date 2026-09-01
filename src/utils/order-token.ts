import { createHash, timingSafeEqual, randomBytes } from 'crypto';

/**
 * Generates a cryptographically secure random token for passwordless order access.
 * Returns a 64-character hex string (256 bits of entropy).
 */
export function generateOrderAccessToken(): string {
  // Use Web Crypto API if available
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buffer = new Uint8Array(32);
    crypto.getRandomValues(buffer);
    return Array.from(buffer, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Node.js crypto fallback
  return randomBytes(32).toString('hex');
}

/**
 * Creates a SHA-256 hash of the order access token for safe database persistence.
 */
export function hashOrderToken(token: string): string {
  return createHash('sha256').update(token.trim()).digest('hex');
}

/**
 * Performs a timing-safe comparison between a provided raw token and the stored hash.
 */
export function verifyOrderToken(rawToken: string, storedHash: string): boolean {
  if (!rawToken || !storedHash) return false;

  try {
    const computedHash = hashOrderToken(rawToken);
    const bufA = Buffer.from(computedHash, 'hex');
    const bufB = Buffer.from(storedHash, 'hex');

    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Generates a secure tracking URL for an order.
 */
export function buildStorefrontTrackingUrl(
  baseUrl: string,
  storeSlug: string,
  orderIdOrShortId: string,
  token: string
): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  return `${cleanBase}/store/${storeSlug}/orders/${orderIdOrShortId}?token=${encodeURIComponent(token)}`;
}
