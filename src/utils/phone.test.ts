import { describe, it, expect } from 'vitest';
import { normalizeGhanaPhone, formatGhanaLocalDisplay } from './phone';

describe('normalizeGhanaPhone', () => {
  it('returns null for empty input', () => {
    expect(normalizeGhanaPhone('')).toBeNull();
    expect(normalizeGhanaPhone(null)).toBeNull();
    expect(normalizeGhanaPhone(undefined)).toBeNull();
  });

  it('normalizes local 0-prefixed number', () => {
    expect(normalizeGhanaPhone('0241234567')).toBe('+233241234567');
  });

  it('normalizes +233 prefixed number', () => {
    expect(normalizeGhanaPhone('+233241234567')).toBe('+233241234567');
  });

  it('normalizes 233 prefixed number without +', () => {
    expect(normalizeGhanaPhone('233241234567')).toBe('+233241234567');
  });

  it('handles numbers with spaces and hyphens', () => {
    expect(normalizeGhanaPhone('024-123-4567')).toBe('+233241234567');
    expect(normalizeGhanaPhone('024 123 4567')).toBe('+233241234567');
  });

  it('returns null for invalid number (wrong length)', () => {
    expect(normalizeGhanaPhone('024123')).toBeNull();
  });

  it('returns null for invalid prefix', () => {
    // Ghana subscriber numbers start with 2 or 5
    expect(normalizeGhanaPhone('0801234567')).toBeNull();
  });

  it('normalizes Telecel (055) numbers', () => {
    expect(normalizeGhanaPhone('0551234567')).toBe('+233551234567');
  });
});

describe('formatGhanaLocalDisplay', () => {
  it('formats E.164 to local display', () => {
    expect(formatGhanaLocalDisplay('+233241234567')).toBe('024 123 4567');
  });

  it('returns original for non-Ghana numbers', () => {
    expect(formatGhanaLocalDisplay('+14155551234')).toBe('+14155551234');
  });

  it('returns original for short numbers', () => {
    expect(formatGhanaLocalDisplay('+23324')).toBe('+23324');
  });
});
