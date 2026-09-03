import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { verifyMetaSignature } from './webhook-signature';

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
