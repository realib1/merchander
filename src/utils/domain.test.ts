import { describe, it, expect } from 'vitest';
import {
  normalizeDomain,
  isValidCustomDomain,
  getStorefrontSubdomainUrl,
  getDnsHostRecord,
  ROOT_DOMAIN,
} from './domain';

describe('domain utilities', () => {
  describe('normalizeDomain', () => {
    it('strips https://, http://, trailing slashes, and paths', () => {
      expect(normalizeDomain('https://shop.mybrand.com/store')).toBe('shop.mybrand.com');
      expect(normalizeDomain('http://brand.com:3000/')).toBe('brand.com');
      expect(normalizeDomain('  SHOP.BRAND.COM  ')).toBe('shop.brand.com');
    });

    it('returns empty string for falsy input', () => {
      expect(normalizeDomain('')).toBe('');
    });
  });

  describe('isValidCustomDomain', () => {
    it('accepts valid subdomains and apex domains', () => {
      expect(isValidCustomDomain('shop.brand.com')).toBe(true);
      expect(isValidCustomDomain('store.accra-apparel.co.uk')).toBe(true);
      expect(isValidCustomDomain('mybrand.org')).toBe(true);
    });

    it('rejects invalid domains, empty strings, and internal domains', () => {
      expect(isValidCustomDomain('')).toBe(false);
      expect(isValidCustomDomain('invalid_domain')).toBe(false);
      expect(isValidCustomDomain(ROOT_DOMAIN)).toBe(false);
      expect(isValidCustomDomain(`test.${ROOT_DOMAIN}`)).toBe(false);
    });
  });

  describe('getStorefrontSubdomainUrl', () => {
    it('formats clean subdomain URL', () => {
      expect(getStorefrontSubdomainUrl('uniquefashion')).toBe(`https://uniquefashion.${ROOT_DOMAIN}`);
      expect(getStorefrontSubdomainUrl('accra-wear')).toBe(`https://accra-wear.${ROOT_DOMAIN}`);
    });
  });

  describe('getDnsHostRecord', () => {
    it('extracts host correctly for subdomains', () => {
      const record = getDnsHostRecord('shop.mybrand.com');
      expect(record.type).toBe('CNAME');
      expect(record.host).toBe('shop');
      expect(record.target).toContain('merchander');
    });

    it('uses @ for apex domains', () => {
      const record = getDnsHostRecord('mybrand.com');
      expect(record.type).toBe('CNAME');
      expect(record.host).toBe('@');
    });
  });
});
