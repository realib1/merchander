import crypto from 'crypto';

/**
 * Constant-time string comparison. Returns false when the lengths differ (which
 * `crypto.timingSafeEqual` would throw on) and otherwise compares in time that
 * does not depend on where the first mismatch is. Use for comparing a
 * caller-supplied token or signature against an expected value.
 */
export function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Verifies a Meta (WhatsApp Cloud API) webhook signature.
 *
 * Meta signs the raw request body with the app secret and sends the result as
 * `X-Hub-Signature-256: sha256=<hex>`. This recomputes that HMAC and compares in
 * constant time. Returns false on any missing input, malformed header, or
 * mismatch, so a caller can treat false as "reject".
 */
export function verifyMetaSignature(
  rawBody: string,
  signatureHeader: string | null | undefined,
  appSecret: string | undefined
): boolean {
  if (!rawBody || !signatureHeader || !appSecret) return false;
  if (!signatureHeader.startsWith('sha256=')) return false;

  const expected = 'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');

  return timingSafeStringEqual(signatureHeader, expected);
}
