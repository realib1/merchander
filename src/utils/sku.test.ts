import { describe, it, expect } from 'vitest';
import { extractInitials, formatVariantCode, generateProductSku } from './sku';

describe('SKU Generator Utility', () => {
  describe('extractInitials', () => {
    it('extracts initials from multi-word product names', () => {
      expect(extractInitials('Air Jordan Retro High')).toBe('AJRH');
      expect(extractInitials('Oversized Heavyweight T-Shirt')).toBe('OHT');
      expect(extractInitials('Kente Handwoven Fabric')).toBe('KHF');
    });

    it('handles single-word product names', () => {
      expect(extractInitials('Hoodie')).toBe('HOOD');
      expect(extractInitials('Cap')).toBe('CAP');
    });

    it('handles empty input gracefully', () => {
      expect(extractInitials('')).toBe('PRD');
    });
  });

  describe('formatVariantCode', () => {
    it('formats common clothing sizes to abbreviations', () => {
      expect(formatVariantCode('Extra Large')).toBe('XL');
      expect(formatVariantCode('Medium')).toBe('M');
      expect(formatVariantCode('Small')).toBe('S');
    });

    it('formats color and size pairs', () => {
      expect(formatVariantCode('Black / Large')).toBe('BLACK-L');
      expect(formatVariantCode('Navy Blue / XL')).toBe('NAVYBLUE-XL');
    });

    it('returns empty string for standard variant', () => {
      expect(formatVariantCode('Standard')).toBe('');
      expect(formatVariantCode('Default')).toBe('');
      expect(formatVariantCode('')).toBe('');
    });
  });

  describe('generateProductSku', () => {
    it('generates initials-based SKU with variant and sequence number', () => {
      const sku = generateProductSku({
        productName: 'Air Jordan Low',
        variantName: 'Black / Large',
        options: { style: 'initials', sequenceNumber: 1 },
      });
      expect(sku).toBe('AJL-BLACK-L-01');
    });

    it('generates prefix-based SKU when style is prefix', () => {
      const sku = generateProductSku({
        productName: 'Summer Dress',
        variantName: 'Red / Small',
        options: { style: 'prefix', prefix: 'DRS', sequenceNumber: 5 },
      });
      expect(sku).toBe('DRS-RED-S-05');
    });

    it('generates category initials combined SKU', () => {
      const sku = generateProductSku({
        productName: 'Leather Boots',
        categoryName: 'Footwear',
        variantName: '42',
        options: { style: 'category_initials', sequenceNumber: 2 },
      });
      expect(sku).toBe('FOO-LB-42-02');
    });
  });
});
