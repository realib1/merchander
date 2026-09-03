import crypto from 'crypto';

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

  const received = Buffer.from(signatureHeader);
  const expectedBuffer = Buffer.from(expected);
  if (received.length !== expectedBuffer.length) return false;

  return crypto.timingSafeEqual(received, expectedBuffer);
}
