
import {
  normalizeGhanaPhone,
  isValidGhanaPhone,
  detectGhanaNetwork,
  formatGhanaLocalDisplay,
  toWhatsAppMsisdn,
} from './phone';

describe('Phone Utilities (Ghana MSISDN)', () => {
  describe('normalizeGhanaPhone', () => {
    it('normalizes local 10-digit format starting with 0', () => {
      expect(normalizeGhanaPhone('0244123456')).toBe('+233244123456');
      expect(normalizeGhanaPhone('0501234567')).toBe('+233501234567');
      expect(normalizeGhanaPhone('0271234567')).toBe('+233271234567');
    });

    it('normalizes numbers with spaces, hyphens, and parentheses', () => {
      expect(normalizeGhanaPhone('024 123 4567')).toBe('+233241234567');
      expect(normalizeGhanaPhone('(055) 987-6543')).toBe('+233559876543');
    });

    it('preserves and normalizes +233 prefix', () => {
      expect(normalizeGhanaPhone('+233244123456')).toBe('+233244123456');
      expect(normalizeGhanaPhone('233244123456')).toBe('+233244123456');
    });

    it('rejects invalid lengths and invalid characters', () => {
      expect(normalizeGhanaPhone('12345')).toBeNull();
      expect(normalizeGhanaPhone('0123456789')).toBeNull();
      expect(normalizeGhanaPhone('0244123456789')).toBeNull();
      expect(normalizeGhanaPhone(null)).toBeNull();
      expect(normalizeGhanaPhone(undefined)).toBeNull();
    });
  });

  describe('isValidGhanaPhone', () => {
    it('validates correct Ghana numbers', () => {
      expect(isValidGhanaPhone('0244123456')).toBe(true);
      expect(isValidGhanaPhone('+233501234567')).toBe(true);
      expect(isValidGhanaPhone('0201112233')).toBe(true);
    });

    it('rejects invalid numbers', () => {
      expect(isValidGhanaPhone('08012345678')).toBe(false);
      expect(isValidGhanaPhone('')).toBe(false);
    });
  });

  describe('detectGhanaNetwork', () => {
    it('correctly identifies MTN numbers', () => {
      expect(detectGhanaNetwork('0244123456')).toBe('MTN');
      expect(detectGhanaNetwork('0541234567')).toBe('MTN');
      expect(detectGhanaNetwork('0551234567')).toBe('MTN');
      expect(detectGhanaNetwork('0591234567')).toBe('MTN');
      expect(detectGhanaNetwork('0251234567')).toBe('MTN');
    });

    it('correctly identifies Telecel numbers', () => {
      expect(detectGhanaNetwork('0201234567')).toBe('Telecel');
      expect(detectGhanaNetwork('0501234567')).toBe('Telecel');
    });

    it('correctly identifies AT numbers', () => {
      expect(detectGhanaNetwork('0261234567')).toBe('AT');
      expect(detectGhanaNetwork('0271234567')).toBe('AT');
      expect(detectGhanaNetwork('0561234567')).toBe('AT');
      expect(detectGhanaNetwork('0571234567')).toBe('AT');
    });

    it('returns Unknown for unrecognized numbers', () => {
      expect(detectGhanaNetwork('0231234567')).toBe('Unknown');
      expect(detectGhanaNetwork('invalid')).toBe('Unknown');
    });
  });

  describe('formatGhanaLocalDisplay', () => {
    it('formats E.164 phone into readable local representation', () => {
      expect(formatGhanaLocalDisplay('+233244123456')).toBe('024 412 3456');
      expect(formatGhanaLocalDisplay('0244123456')).toBe('024 412 3456');
    });
  });

  describe('toWhatsAppMsisdn', () => {
    it('returns digits-only 233 MSISDN with no leading plus', () => {
      expect(toWhatsAppMsisdn('0244123456')).toBe('233244123456');
      expect(toWhatsAppMsisdn('+233244123456')).toBe('233244123456');
      expect(toWhatsAppMsisdn('233 24 412 3456')).toBe('233244123456');
    });

    it('returns null for numbers that do not normalize', () => {
      expect(toWhatsAppMsisdn('12345')).toBeNull();
      expect(toWhatsAppMsisdn('')).toBeNull();
      expect(toWhatsAppMsisdn(null)).toBeNull();
      expect(toWhatsAppMsisdn(undefined)).toBeNull();
    });
  });
});
