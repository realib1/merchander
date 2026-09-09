import { describe, it, expect } from 'vitest';
import {
  cleanSlug,
  validateMerchantSlug,
  validateOwnerEmail,
  generateInitialPassword,
  formatMerchantCredentials,
  RESERVED_SUBDOMAIN_SLUGS,
} from './merchant-provisioning';

describe('cleanSlug', () => {
  it('handles empty or null inputs', () => {
    expect(cleanSlug('')).toBe('');
    expect(cleanSlug('   ')).toBe('');
  });

  it('normalizes spaces, punctuation and apostrophes correctly', () => {
    expect(cleanSlug("Abena's Fashion & Boutique")).toBe('abenas-fashion-boutique');
    expect(cleanSlug('Kofi & Sons Trading Co.')).toBe('kofi-sons-trading-co');
    expect(cleanSlug('Accra---Wholesale--Mart')).toBe('accra-wholesale-mart');
  });

  it('trims leading and trailing hyphens', () => {
    expect(cleanSlug('-shop-now-')).toBe('shop-now');
    expect(cleanSlug('---hello---')).toBe('hello');
  });

  it('caps length to 60 characters', () => {
    const longName = 'A'.repeat(80);
    const cleaned = cleanSlug(longName);
    expect(cleaned.length).toBe(60);
  });
});

describe('validateMerchantSlug', () => {
  it('rejects empty or missing slugs', () => {
    expect(validateMerchantSlug('')).toEqual({
      isValid: false,
      error: 'Subdomain slug is required',
    });
    expect(validateMerchantSlug('   ')).toEqual({
      isValid: false,
      error: 'Subdomain slug is required',
    });
  });

  it('rejects slugs shorter than 2 characters', () => {
    expect(validateMerchantSlug('a')).toEqual({
      isValid: false,
      error: 'Subdomain slug must be at least 2 characters',
    });
  });

  it('rejects slugs longer than 60 characters', () => {
    const longSlug = 'a'.repeat(61);
    expect(validateMerchantSlug(longSlug)).toEqual({
      isValid: false,
      error: 'Subdomain slug must not exceed 60 characters',
    });
  });

  it('rejects uppercase, spaces, or consecutive hyphens', () => {
    expect(validateMerchantSlug('Abc-shop').isValid).toBe(false);
    expect(validateMerchantSlug('abc--shop').isValid).toBe(false);
    expect(validateMerchantSlug('-abc-shop').isValid).toBe(false);
    expect(validateMerchantSlug('abc-shop-').isValid).toBe(false);
    expect(validateMerchantSlug('abc shop').isValid).toBe(false);
    expect(validateMerchantSlug('abc_shop').isValid).toBe(false);
  });

  it('rejects reserved platform slugs', () => {
    expect(RESERVED_SUBDOMAIN_SLUGS.has('admin')).toBe(true);
    expect(validateMerchantSlug('admin')).toEqual({
      isValid: false,
      error: '"admin" is a reserved platform keyword and cannot be used',
    });
    expect(validateMerchantSlug('dashboard')).toEqual({
      isValid: false,
      error: '"dashboard" is a reserved platform keyword and cannot be used',
    });
    expect(validateMerchantSlug('api')).toEqual({
      isValid: false,
      error: '"api" is a reserved platform keyword and cannot be used',
    });
  });

  it('accepts clean valid slugs', () => {
    expect(validateMerchantSlug('abenas-boutique')).toEqual({ isValid: true });
    expect(validateMerchantSlug('store123')).toEqual({ isValid: true });
    expect(validateMerchantSlug('gh-fresh-mart-2026')).toEqual({ isValid: true });
  });
});

describe('validateOwnerEmail', () => {
  it('rejects empty or invalid emails', () => {
    expect(validateOwnerEmail('')).toEqual({
      isValid: false,
      error: 'Email address is required',
    });
    expect(validateOwnerEmail('invalid-email')).toEqual({
      isValid: false,
      error: 'Please enter a valid email address',
    });
    expect(validateOwnerEmail('user@')).toEqual({
      isValid: false,
      error: 'Please enter a valid email address',
    });
  });

  it('accepts valid email addresses', () => {
    expect(validateOwnerEmail('merchant@example.com')).toEqual({ isValid: true });
    expect(validateOwnerEmail('afia.k@gmail.com')).toEqual({ isValid: true });
  });
});

describe('generateInitialPassword', () => {
  it('generates a password containing the Merchander prefix and year', () => {
    const pwd1 = generateInitialPassword();
    const pwd2 = generateInitialPassword();
    const currentYear = new Date().getFullYear();

    expect(pwd1.startsWith(`Merchander-${currentYear}-`)).toBe(true);
    expect(pwd2.startsWith(`Merchander-${currentYear}-`)).toBe(true);
    expect(pwd1.length).toBeGreaterThan(16);
    expect(pwd1).not.toBe(pwd2);
  });
});

describe('formatMerchantCredentials', () => {
  it('formats credentials message with temporary password', () => {
    const formatted = formatMerchantCredentials({
      businessName: "Afia's Accessories",
      storeUrl: 'https://afia.merchander.app',
      ownerEmail: 'afia@example.com',
      temporaryPassword: 'TempPassword123',
    });

    expect(formatted).toContain("Afia's Accessories");
    expect(formatted).toContain('https://afia.merchander.app');
    expect(formatted).toContain('afia@example.com');
    expect(formatted).toContain('TempPassword123');
    expect(formatted).toContain('https://merchander.app/login');
  });

  it('formats credentials message without password if none provided', () => {
    const formatted = formatMerchantCredentials({
      businessName: 'Ghana Groceries',
      storeUrl: 'https://groceries.merchander.app',
      ownerEmail: 'owner@groceries.com',
      loginUrl: 'https://custom.merchander.app/login',
    });

    expect(formatted).toContain('Ghana Groceries');
    expect(formatted).toContain('owner@groceries.com');
    expect(formatted).not.toContain('Temporary Password:');
    expect(formatted).toContain('https://custom.merchander.app/login');
  });
});
