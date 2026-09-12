
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

  describe('Password Security & Complexity Requirements', () => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

    it('accepts strong passwords meeting all complexity criteria', () => {
      expect(passwordRegex.test('Merchander@2026!')).toBe(true);
      expect(passwordRegex.test('P@ssw0rdSecure#9')).toBe(true);
    });

    it('rejects passwords shorter than 8 characters', () => {
      expect(passwordRegex.test('Ab1!xyz')).toBe(false);
    });

    it('rejects passwords missing uppercase letters', () => {
      expect(passwordRegex.test('merchander@2026!')).toBe(false);
    });

    it('rejects passwords missing numbers', () => {
      expect(passwordRegex.test('Merchander@Password!')).toBe(false);
    });

    it('rejects passwords missing special characters', () => {
      expect(passwordRegex.test('Merchander2026Secure')).toBe(false);
    });
  });

  describe('Two-Factor Authentication (TOTP) Validation', () => {
    const totpCodeRegex = /^\d{6}$/;

    it('accepts valid 6-digit numerical TOTP codes', () => {
      expect(totpCodeRegex.test('123456')).toBe(true);
      expect(totpCodeRegex.test('000999')).toBe(true);
    });

    it('rejects TOTP codes with letters or special characters', () => {
      expect(totpCodeRegex.test('12345a')).toBe(false);
      expect(totpCodeRegex.test('12-456')).toBe(false);
    });

    it('rejects TOTP codes with incorrect length', () => {
      expect(totpCodeRegex.test('12345')).toBe(false);
      expect(totpCodeRegex.test('1234567')).toBe(false);
    });
  });

  describe('Emergency Backup Recovery Codes Utilities', () => {
    it('normalizes backup codes by removing whitespace and hyphens and converting to uppercase', async () => {
      const { normalizeBackupCode } = await import('./backup-codes');
      expect(normalizeBackupCode('ab12-cd34')).toBe('AB12CD34');
      expect(normalizeBackupCode('  5678 - 90EF  ')).toBe('567890EF');
    });

    it('generates the specified count of unique backup codes with matching hashes', async () => {
      const { generateBackupCodeBatch, hashBackupCode, normalizeBackupCode } = await import('./backup-codes');
      const { plaintextCodes, hashedCodes } = generateBackupCodeBatch(8);

      expect(plaintextCodes.length).toBe(8);
      expect(hashedCodes.length).toBe(8);

      // All codes are unique
      const uniqueSet = new Set(plaintextCodes);
      expect(uniqueSet.size).toBe(8);

      // Each plaintext code matches its hash
      plaintextCodes.forEach((code, idx) => {
        expect(code).toMatch(/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{5}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{5}$/);
        expect(hashBackupCode(code)).toBe(hashedCodes[idx]);
        expect(hashBackupCode(normalizeBackupCode(code))).toBe(hashedCodes[idx]);
      });
    });
  });
});
