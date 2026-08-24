import { describe, it, expect } from 'vitest';
import { formatCurrency, formatNumber, formatDate, formatRelativeTime, formatPhoneNumber } from './format';

describe('formatCurrency', () => {
  it('formats GHS amount correctly', () => {
    const result = formatCurrency(1500);
    expect(result).toContain('1,500.00');
    expect(result).toContain('GHS');
  });

  it('returns fallback for NaN', () => {
    expect(formatCurrency(NaN)).toBe('GHS 0.00');
  });

  it('handles zero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0.00');
  });

  it('handles custom currency', () => {
    const result = formatCurrency(100, 'USD', 'en-US');
    expect(result).toContain('100.00');
    expect(result).toContain('USD');
  });
});

describe('formatNumber', () => {
  it('formats basic numbers', () => {
    expect(formatNumber(1234)).toBe('1,234');
  });

  it('returns "0" for NaN', () => {
    expect(formatNumber(NaN)).toBe('0');
  });

  it('formats compact notation', () => {
    const result = formatNumber(1500, { compact: true });
    expect(result).toMatch(/1\.5K|1\.5k|2K|2k/i);
  });

  it('respects decimal places', () => {
    const result = formatNumber(1.23456, { decimals: 2 });
    expect(result).toBe('1.23');
  });
});

describe('formatDate', () => {
  it('formats a valid ISO date', () => {
    const result = formatDate('2026-01-15T12:00:00Z');
    expect(result).toContain('Jan');
    expect(result).toContain('15');
    expect(result).toContain('2026');
  });

  it('returns empty string for invalid date', () => {
    expect(formatDate('invalid')).toBe('');
  });

  it('handles Date objects', () => {
    const d = new Date(2026, 0, 1);
    const result = formatDate(d);
    expect(result).toContain('Jan');
  });
});

describe('formatRelativeTime', () => {
  const base = new Date('2026-08-23T12:00:00Z');

  it('returns "just now" for recent dates', () => {
    const recent = new Date(base.getTime() - 10 * 1000); // 10 seconds ago
    expect(formatRelativeTime(recent, base)).toBe('just now');
  });

  it('returns minutes ago', () => {
    const fiveMinAgo = new Date(base.getTime() - 5 * 60 * 1000);
    expect(formatRelativeTime(fiveMinAgo, base)).toBe('5m ago');
  });

  it('returns hours ago', () => {
    const threeHoursAgo = new Date(base.getTime() - 3 * 60 * 60 * 1000);
    expect(formatRelativeTime(threeHoursAgo, base)).toBe('3h ago');
  });

  it('returns days ago', () => {
    const twoDaysAgo = new Date(base.getTime() - 2 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(twoDaysAgo, base)).toBe('2d ago');
  });

  it('returns empty for invalid input', () => {
    expect(formatRelativeTime('invalid', base)).toBe('');
  });

  it('returns "in the future" for future dates', () => {
    const future = new Date(base.getTime() + 60 * 1000);
    expect(formatRelativeTime(future, base)).toBe('in the future');
  });
});

describe('formatPhoneNumber', () => {
  it('formats Ghana local number', () => {
    expect(formatPhoneNumber('0241234567')).toBe('+233 24 123 4567');
  });

  it('formats number with country code', () => {
    expect(formatPhoneNumber('233241234567')).toBe('+233 24 123 4567');
  });

  it('returns empty for empty input', () => {
    expect(formatPhoneNumber('')).toBe('');
  });

  it('preserves already formatted numbers', () => {
    expect(formatPhoneNumber('+233 24 123 4567')).toBe('+233 24 123 4567');
  });
});
