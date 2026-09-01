import { describe, it, expect } from 'vitest';
import { generateOrderAccessToken, hashOrderToken, verifyOrderToken, buildStorefrontTrackingUrl } from './order-token';

describe('Order Access Token Utilities', () => {
  it('generates a 64-character high entropy hex token', () => {
    const token = generateOrderAccessToken();
    expect(token).toHaveLength(64);
    expect(/^[a-f0-9]{64}$/.test(token)).toBe(true);

    const token2 = generateOrderAccessToken();
    expect(token).not.toBe(token2);
  });

  it('correctly hashes tokens deterministically with SHA-256', () => {
    const token = 'sample-token-1234567890abcdef1234567890abcdef1234567890abcdef12345678';
    const hash1 = hashOrderToken(token);
    const hash2 = hashOrderToken(token);

    expect(hash1).toHaveLength(64);
    expect(hash1).toBe(hash2);
  });

  it('verifies valid raw token against stored hash', () => {
    const token = generateOrderAccessToken();
    const hash = hashOrderToken(token);

    expect(verifyOrderToken(token, hash)).toBe(true);
  });

  it('rejects invalid or tampered tokens', () => {
    const token = generateOrderAccessToken();
    const hash = hashOrderToken(token);

    expect(verifyOrderToken('invalid-token', hash)).toBe(false);
    expect(verifyOrderToken('', hash)).toBe(false);
    expect(verifyOrderToken(token, 'invalid-hash')).toBe(false);
  });

  it('constructs well-formatted storefront tracking URLs', () => {
    const url = buildStorefrontTrackingUrl('https://merchander.com', 'uniquefashion', 'ORD-1092', 'token123456');
    expect(url).toBe('https://merchander.com/store/uniquefashion/orders/ORD-1092?token=token123456');
  });
});
