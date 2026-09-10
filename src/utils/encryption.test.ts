import { describe, it, expect } from 'vitest';
import {
  encryptSecret,
  decryptSecret,
  isEncrypted,
  maskSecret,
} from './encryption';

describe('AES-256-GCM Secret Key Encryption & Masking', () => {
  it('encrypts and decrypts a plain text secret accurately', () => {
    const rawSecret = 'sk_live_test_secret_key_1234567890abcdef';
    const encrypted = encryptSecret(rawSecret);

    expect(encrypted).not.toBe(rawSecret);
    expect(isEncrypted(encrypted)).toBe(true);
    expect(encrypted.startsWith('enc:gcm:')).toBe(true);

    const decrypted = decryptSecret(encrypted);
    expect(decrypted).toBe(rawSecret);
  });

  it('handles empty, null, or undefined strings gracefully', () => {
    expect(encryptSecret('')).toBe('');
    expect(encryptSecret(null)).toBe('');
    expect(encryptSecret(undefined)).toBe('');

    expect(decryptSecret('')).toBe('');
    expect(decryptSecret(null)).toBe('');
    expect(decryptSecret(undefined)).toBe('');
  });

  it('is idempotent when given an already encrypted string', () => {
    const rawSecret = 'sk_test_12345678';
    const encryptedOnce = encryptSecret(rawSecret);
    const encryptedTwice = encryptSecret(encryptedOnce);

    expect(encryptedTwice).toBe(encryptedOnce);
    expect(decryptSecret(encryptedTwice)).toBe(rawSecret);
  });

  it('returns plaintext unmodified if decrypting non-encrypted legacy string', () => {
    const legacyPlainSecret = 'legacy_plaintext_key_value';
    expect(isEncrypted(legacyPlainSecret)).toBe(false);
    expect(decryptSecret(legacyPlainSecret)).toBe(legacyPlainSecret);
  });

  it('masks sensitive secrets for safe client-side UI display', () => {
    const key = 'sk_live_abcdef1234567890';
    const masked = maskSecret(key);
    expect(masked).toBe('sk_l••••••••7890');
    expect(masked).not.toContain('abcdef');

    // Also works when passed an encrypted string
    const encrypted = encryptSecret(key);
    expect(maskSecret(encrypted)).toBe('sk_l••••••••7890');

    // Short secrets masked completely
    expect(maskSecret('12345')).toBe('••••••••');
    expect(maskSecret('')).toBe('');
    expect(maskSecret(null)).toBe('');
  });

  it('throws error when tampering with encrypted payload', () => {
    const encrypted = encryptSecret('very_sensitive_api_token');
    const tampered = encrypted.slice(0, -4) + 'ffff';
    expect(() => decryptSecret(tampered)).toThrow('Secret decryption failed');
  });
});
