
import {
  calculateTotalStock,
  calculateTotalUnitsSold,
  getVariantPriceRange,
  getShortId,
  generateSKU,
} from './product';
import type { ProductVariant } from '@/types/product';

describe('product utils', () => {
  describe('calculateTotalStock', () => {
    it('returns 0 when variants is undefined or empty', () => {
      expect(calculateTotalStock(undefined)).toBe(0);
      expect(calculateTotalStock([])).toBe(0);
    });

    it('sums inventory across multiple variants and stores', () => {
      const variants: ProductVariant[] = [
        {
          id: 'v1',
          name: 'Red / S',
          price: 100,
          inventory: [{ store_id: 's1', quantity: 5 }, { store_id: 's2', quantity: 10 }],
        } as unknown as ProductVariant,
        {
          id: 'v2',
          name: 'Red / M',
          price: 100,
          inventory: [{ store_id: 's1', quantity: 8 }],
        } as unknown as ProductVariant,
      ];

      expect(calculateTotalStock(variants)).toBe(23);
    });
  });

  describe('calculateTotalUnitsSold', () => {
    it('returns 0 for empty or undefined variants', () => {
      expect(calculateTotalUnitsSold(undefined)).toBe(0);
      expect(calculateTotalUnitsSold([])).toBe(0);
    });

    it('excludes draft and cancelled orders when summing sold units', () => {
      const variants: ProductVariant[] = [
        {
          id: 'v1',
          order_items: [
            { quantity: 3, order: { status: 'paid' } },
            { quantity: 2, order: { status: 'dispatched' } },
            { quantity: 5, order: { status: 'draft' } },
            { quantity: 4, order: { status: 'cancelled' } },
          ],
        } as unknown as ProductVariant,
        {
          id: 'v2',
          order_items: [
            { quantity: 1, orders: { status: 'delivered' } },
          ],
        } as unknown as ProductVariant,
      ];

      expect(calculateTotalUnitsSold(variants)).toBe(6);
    });
  });

  describe('getVariantPriceRange', () => {
    it('returns min, max, and hasRange accurately', () => {
      const singlePrice: ProductVariant[] = [
        { id: 'v1', price: 150 } as ProductVariant,
        { id: 'v2', price: 150 } as ProductVariant,
      ];
      expect(getVariantPriceRange(singlePrice)).toEqual({ min: 150, max: 150, hasRange: false });

      const multiPrice: ProductVariant[] = [
        { id: 'v1', price: 100 } as ProductVariant,
        { id: 'v2', price: 250 } as ProductVariant,
        { id: 'v3', price: 180 } as ProductVariant,
      ];
      expect(getVariantPriceRange(multiPrice)).toEqual({ min: 100, max: 250, hasRange: true });
    });

    it('handles empty variants safely', () => {
      expect(getVariantPriceRange([])).toEqual({ min: 0, max: 0, hasRange: false });
    });
  });

  describe('getShortId', () => {
    it('returns empty string for falsy id', () => {
      expect(getShortId('')).toBe('');
    });

    it('strips hyphens and upper cases to specified length', () => {
      expect(getShortId('c64a38df-6bf9-455b-b9d9-bb4331008d51', 6)).toBe('C64A38');
      expect(getShortId('c64a38df-6bf9-455b-b9d9-bb4331008d51', 8)).toBe('C64A38DF');
    });
  });

  describe('generateSKU', () => {
    it('generates SKU from single word and uuid', () => {
      const sku = generateSKU('Sneakers', 'c64a38df-6bf9-455b-b9d9-bb4331008d51');
      expect(sku).toBe('SNE-C64A38');
    });

    it('generates initials from multi-word name', () => {
      const sku = generateSKU('Air Jordan Low', 'c64a38df-6bf9-455b-b9d9-bb4331008d51');
      expect(sku).toBe('AJL-C64A38');
    });

    it('pads short initials with X', () => {
      const sku = generateSKU('A', 'c64a38df-6bf9-455b-b9d9-bb4331008d51');
      expect(sku).toBe('AX-C64A38');
    });

    it('generates random digits when no id is provided', () => {
      const sku = generateSKU('Dress');
      expect(sku).toMatch(/^DRE-\d{6}$/);
    });

    it('handles empty product name gracefully', () => {
      const skuWithId = generateSKU('', 'c64a38df-6bf9-455b-b9d9-bb4331008d51');
      expect(skuWithId).toBe('PRD-C64A38');

      const skuWithoutId = generateSKU('');
      expect(skuWithoutId).toMatch(/^PRD-\d{6}$/);
    });
  });
});
