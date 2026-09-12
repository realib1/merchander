
import { isValidHex, normalizeHex, getContrastTextColor } from './color';

describe('color utils', () => {
  describe('isValidHex', () => {
    it('accepts valid 6-digit hex values in lowercase', () => {
      expect(isValidHex('#ffffff')).toBe(true);
      expect(isValidHex('#000000')).toBe(true);
      expect(isValidHex('#1a2b3c')).toBe(true);
      expect(isValidHex('#3b82f6')).toBe(true);
    });

    it('accepts valid 6-digit hex values in uppercase and mixed case', () => {
      expect(isValidHex('#FFFFFF')).toBe(true);
      expect(isValidHex('#AABBCC')).toBe(true);
      expect(isValidHex('#1234EF')).toBe(true);
      expect(isValidHex('#AbCdEf')).toBe(true);
    });

    it('accepts valid 3-digit shorthand hex values', () => {
      expect(isValidHex('#fff')).toBe(true);
      expect(isValidHex('#000')).toBe(true);
      expect(isValidHex('#abc')).toBe(true);
      expect(isValidHex('#ABC')).toBe(true);
      expect(isValidHex('#123')).toBe(true);
    });

    it('rejects hex strings missing the leading hash', () => {
      expect(isValidHex('ffffff')).toBe(false);
      expect(isValidHex('fff')).toBe(false);
      expect(isValidHex('123456')).toBe(false);
    });

    it('rejects strings with incorrect lengths', () => {
      expect(isValidHex('#')).toBe(false);
      expect(isValidHex('#f')).toBe(false);
      expect(isValidHex('#ff')).toBe(false);
      expect(isValidHex('#ffff')).toBe(false);
      expect(isValidHex('#fffff')).toBe(false);
      expect(isValidHex('#fffffff')).toBe(false);
      expect(isValidHex('#ffffffff')).toBe(false);
    });

    it('rejects strings with non-hexadecimal characters', () => {
      expect(isValidHex('#gggggg')).toBe(false);
      expect(isValidHex('#xyz123')).toBe(false);
      expect(isValidHex('#12345g')).toBe(false);
      expect(isValidHex('#--ff00')).toBe(false);
    });

    it('rejects empty strings and strings with whitespace', () => {
      expect(isValidHex('')).toBe(false);
      expect(isValidHex(' ')).toBe(false);
      expect(isValidHex('# 12345')).toBe(false);
      expect(isValidHex('#ffffff ')).toBe(false);
    });
  });

  describe('normalizeHex', () => {
    it('passes through valid 6-digit hex colors unchanged', () => {
      expect(normalizeHex('#ffffff')).toBe('#ffffff');
      expect(normalizeHex('#000000')).toBe('#000000');
      expect(normalizeHex('#10b981')).toBe('#10b981');
      expect(normalizeHex('#A1B2C3')).toBe('#A1B2C3');
    });

    it('expands 3-digit shorthand hex to full 6-digit format', () => {
      expect(normalizeHex('#fff')).toBe('#ffffff');
      expect(normalizeHex('#000')).toBe('#000000');
      expect(normalizeHex('#123')).toBe('#112233');
      expect(normalizeHex('#f0a')).toBe('#ff00aa');
      expect(normalizeHex('#ABC')).toBe('#AABBCC');
    });

    it('returns fallback black hex for invalid inputs', () => {
      expect(normalizeHex('#')).toBe('#000000');
      expect(normalizeHex('#12')).toBe('#000000');
      expect(normalizeHex('#1234')).toBe('#000000');
      expect(normalizeHex('#12345')).toBe('#000000');
      expect(normalizeHex('#gggggg')).toBe('#000000');
      expect(normalizeHex('ffffff')).toBe('#000000');
      expect(normalizeHex('')).toBe('#000000');
    });
  });

  describe('getContrastTextColor', () => {
    it('returns black text (#000000) for bright and light backgrounds', () => {
      expect(getContrastTextColor('#ffffff')).toBe('#000000');
      expect(getContrastTextColor('#f8fafc')).toBe('#000000');
      expect(getContrastTextColor('#ffff00')).toBe('#000000'); // Yellow
      expect(getContrastTextColor('#00ff00')).toBe('#000000'); // Pure green
      expect(getContrastTextColor('#00ffff')).toBe('#000000'); // Cyan
    });

    it('returns white text (#ffffff) for dark and deep backgrounds', () => {
      expect(getContrastTextColor('#000000')).toBe('#ffffff');
      expect(getContrastTextColor('#0f172a')).toBe('#ffffff');
      expect(getContrastTextColor('#000080')).toBe('#ffffff'); // Navy
      expect(getContrastTextColor('#800080')).toBe('#ffffff'); // Purple
      expect(getContrastTextColor('#7f1d1d')).toBe('#ffffff'); // Deep red
    });

    it('handles 3-digit shorthand hex backgrounds correctly', () => {
      expect(getContrastTextColor('#fff')).toBe('#000000');
      expect(getContrastTextColor('#000')).toBe('#ffffff');
      expect(getContrastTextColor('#ff0')).toBe('#000000');
      expect(getContrastTextColor('#008')).toBe('#ffffff');
    });

    it('handles hex codes without the leading hash', () => {
      expect(getContrastTextColor('ffffff')).toBe('#000000');
      expect(getContrastTextColor('000000')).toBe('#ffffff');
      expect(getContrastTextColor('fff')).toBe('#000000');
      expect(getContrastTextColor('000')).toBe('#ffffff');
    });

    it('handles threshold boundary around YIQ 128', () => {
      // YIQ = (128*299 + 128*587 + 128*114) / 1000 = 128.0 -> >= 128 returns #000000
      expect(getContrastTextColor('#808080')).toBe('#000000');
      // YIQ = (127*299 + 127*587 + 127*114) / 1000 = 127.0 -> < 128 returns #ffffff
      expect(getContrastTextColor('#7f7f7f')).toBe('#ffffff');
    });

    it('returns fallback black text (#000000) for invalid inputs', () => {
      expect(getContrastTextColor('')).toBe('#000000');
      expect(getContrastTextColor('#')).toBe('#000000');
      expect(getContrastTextColor('#12')).toBe('#000000');
      expect(getContrastTextColor('#1234')).toBe('#000000');
      expect(getContrastTextColor('#gggggg')).toBe('#000000');
      expect(getContrastTextColor('invalid')).toBe('#000000');
    });
  });
});
