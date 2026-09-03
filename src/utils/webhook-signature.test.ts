import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { verifyMetaSignature, timingSafeStringEqual } from './webhook-signature';

const SECRET = 'test_app_secret';
const BODY = JSON.stringify({ object: 'whatsapp_business_account', entry: [{ id: '1' }] });

function sign(body: string, secret: string): string {
  return 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');
}

describe('verifyMetaSignature', () => {
  it('accepts a correctly signed body', () => {
    expect(verifyMetaSignature(BODY, sign(BODY, SECRET), SECRET)).toBe(true);
  });

  it('rejects a body that was tampered with after signing', () => {
    const signature = sign(BODY, SECRET);
    const tampered = BODY.replace('whatsapp_business_account', 'evil');
    expect(verifyMetaSignature(tampered, signature, SECRET)).toBe(false);
  });

  it('rejects a signature made with the wrong secret', () => {
    expect(verifyMetaSignature(BODY, sign(BODY, 'wrong_secret'), SECRET)).toBe(false);
  });

  it('rejects a missing signature header', () => {
    expect(verifyMetaSignature(BODY, null, SECRET)).toBe(false);
    expect(verifyMetaSignature(BODY, '', SECRET)).toBe(false);
  });

  it('rejects a header without the sha256= prefix', () => {
    const bareHex = crypto.createHmac('sha256', SECRET).update(BODY).digest('hex');
    expect(verifyMetaSignature(BODY, bareHex, SECRET)).toBe(false);
  });

  it('rejects when the app secret is not configured', () => {
    expect(verifyMetaSignature(BODY, sign(BODY, SECRET), undefined)).toBe(false);
  });

  it('rejects an empty body', () => {
    expect(verifyMetaSignature('', sign('', SECRET), SECRET)).toBe(false);
  });
});

describe('timingSafeStringEqual', () => {
  it('returns true for identical strings', () => {
    expect(timingSafeStringEqual('a-secret-token', 'a-secret-token')).toBe(true);
  });

  it('returns false for different strings of the same length', () => {
    expect(timingSafeStringEqual('abcdef', 'abcxef')).toBe(false);
  });

  it('returns false for strings of different length', () => {
    expect(timingSafeStringEqual('short', 'longer-value')).toBe(false);
  });

  it('returns false for empty vs non-empty', () => {
    expect(timingSafeStringEqual('', 'x')).toBe(false);
  });

  it('returns true for empty vs empty', () => {
    expect(timingSafeStringEqual('', '')).toBe(true);
  });

  it('treats multi-byte characters by byte length', () => {
    // 'é' is two UTF-8 bytes, 'e' is one - different byte length, not equal.
    expect(timingSafeStringEqual('é', 'e')).toBe(false);
    expect(timingSafeStringEqual('é', 'é')).toBe(true);
  });
});
