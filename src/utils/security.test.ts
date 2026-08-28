import { describe, it, expect } from 'vitest';
import { escapeHtml, sanitizeInput, slugify } from './sanitize';
import { normalizeGhanaPhone, formatGhanaLocalDisplay } from './phone';
import { generateStoreSlug, calculateCartTotals, formatWhatsAppOrderMessage } from './storefront';
import { StorefrontCartItem, StorefrontConfig } from '@/types/storefront';

describe('Security & Multi-Tenant Input Sanitization Suite', () => {
  describe('Input Sanitization & XSS Prevention', () => {
    it('escapes unsafe HTML characters to prevent XSS injection', () => {
      const malicious = '<script>alert("hacked")</script>';
      const clean = escapeHtml(malicious);
      expect(clean).toContain('&lt;script&gt;');
      expect(clean).toContain('&lt;&#x2F;script&gt;');
      expect(clean).not.toContain('<script>');
    });

    it('escapes quote characters in strings', () => {
      const input = '<img src="x" onerror="alert(1)" />';
      const clean = escapeHtml(input);
      expect(clean).toContain('&quot;');
      expect(clean).toContain('&lt;img');
    });

    it('sanitizes strings without breaking legitimate text', () => {
      const text = 'Glam Hair 24" Bone Straight (100% Virgin Hair)';
      const clean = sanitizeInput(text);
      expect(clean).toBe(text);
    });

    it('slugifies string inputs into normalized URL-safe formats', () => {
      expect(slugify('Glam Hair & Beauty (Accra)')).toBe('glam-hair-beauty-accra');
    });
  });

  describe('Ghana Phone Normalization & Validation', () => {
    it('normalizes local 024 number to international E.164 format', () => {
      const normalized = normalizeGhanaPhone('0241234567');
      expect(normalized).toBe('+233241234567');
    });

    it('handles phone numbers with spaces, dashes, and parentheses', () => {
      const normalized = normalizeGhanaPhone('055-987-6543');
      expect(normalized).toBe('+233559876543');
    });

    it('rejects invalid short or non-Ghana subscriber numbers', () => {
      expect(normalizeGhanaPhone('12345')).toBeNull();
      expect(normalizeGhanaPhone('abcdefghij')).toBeNull();
    });

    it('formats E.164 phone into Ghana national display format', () => {
      expect(formatGhanaLocalDisplay('+233241234567')).toBe('024 123 4567');
    });
  });

  describe('Storefront Slug & Link Security', () => {
    it('sanitizes store names into safe URL slugs', () => {
      expect(generateStoreSlug('Glam Hair & Beauty (Accra)')).toBe('glam-hair-beauty-accra');
      expect(generateStoreSlug('Kofi & Sons / Sea-Freight')).toBe('kofi-sons-sea-freight');
    });

    it('prevents path traversal characters in store slugs', () => {
      const dangerous = '../../../etc/passwd';
      const safe = generateStoreSlug(dangerous);
      expect(safe).not.toContain('/');
      expect(safe).not.toContain('.');
    });
  });

  describe('Cart Mathematics & Financial Calculation Integrity', () => {
    const mockCart: StorefrontCartItem[] = [
      {
        variantId: 'v-1',
        productId: 'p-1',
        productName: 'Wig 24"',
        variantTitle: '1B',
        price: 450,
        quantity: 2,
        sku: 'WIG-24-1B',
        imageUrl: null,
      },
      {
        variantId: 'v-2',
        productId: 'p-2',
        productName: 'Lace Glue',
        variantTitle: 'Standard',
        price: 80,
        quantity: 1,
        sku: 'GLUE-STD',
        imageUrl: null,
      },
    ];

    it('calculates item subtotals and order totals with precision', () => {
      const totals = calculateCartTotals(mockCart);
      expect(totals.subtotal).toBe(980); // (450 * 2) + (80 * 1)
      expect(totals.itemCount).toBe(3);
    });

    it('generates itemized WhatsApp order messages with full details', () => {
      const mockConfig: StorefrontConfig = {
        tenant_id: 't-1',
        store_name: 'Glam Store',
        slug: 'glam-store',
        tagline: null,
        bio: null,
        logo_url: null,
        banner_url: null,
        whatsapp_phone: null,
        instagram_handle: null,
        tiktok_handle: null,
        delivery_policy: null,
        is_active: true,
        currency: 'GHS',
      };

      const message = formatWhatsAppOrderMessage(mockConfig, mockCart, {
        name: 'Ama Serwaa',
        phone: '+233241234567',
        address: 'East Legon, Accra',
        notes: 'Call on arrival',
      });

      expect(message).toContain('GLAM STORE');
      expect(message).toContain('Wig 24"');
      expect(message).toContain('Ama Serwaa');
      expect(message).toContain('East Legon, Accra');
      expect(message).toContain('Call on arrival');
      expect(message).toContain('980');
    });
  });
});
