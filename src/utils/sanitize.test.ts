import { describe, it, expect } from 'vitest';
import { escapeHtml, sanitizeInput, slugify, truncate, sanitizeNumeric } from './sanitize';

describe('escapeHtml', () => {
  it('escapes HTML special characters', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
    );
  });

  it('escapes ampersands', () => {
    expect(escapeHtml('A & B')).toBe('A &amp; B');
  });

  it('returns empty string for empty input', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('passes through safe strings unchanged', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World');
  });
});

describe('sanitizeInput', () => {
  it('strips control characters', () => {
    expect(sanitizeInput('hello\x00world')).toBe('helloworld');
  });

  it('trims whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
  });

  it('preserves newlines and tabs', () => {
    expect(sanitizeInput('hello\n\tworld')).toBe('hello\n\tworld');
  });

  it('returns empty for empty input', () => {
    expect(sanitizeInput('')).toBe('');
  });
});

describe('slugify', () => {
  it('converts string to URL-friendly slug', () => {
    expect(slugify('Smart Boutique Accra!')).toBe('smart-boutique-accra');
  });

  it('handles accented characters', () => {
    expect(slugify('Café Résumé')).toBe('cafe-resume');
  });

  it('collapses multiple spaces and hyphens', () => {
    expect(slugify('hello   world--test')).toBe('hello-world-test');
  });

  it('returns empty for empty input', () => {
    expect(slugify('')).toBe('');
  });

  it('removes leading/trailing hyphens', () => {
    expect(slugify('--hello--')).toBe('hello');
  });
});

describe('truncate', () => {
  it('returns original if under max length', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('truncates long strings with ellipsis', () => {
    const result = truncate('This is a very long string that should be truncated', 25);
    expect(result.length).toBeLessThanOrEqual(25);
    expect(result).toContain('...');
  });

  it('breaks at word boundary when possible', () => {
    const result = truncate('Hello world from Ghana', 20);
    expect(result.endsWith('...')).toBe(true);
    expect(result.length).toBeLessThanOrEqual(20);
  });

  it('handles empty string', () => {
    expect(truncate('', 10)).toBe('');
  });
});

describe('sanitizeNumeric', () => {
  it('parses valid numeric string', () => {
    expect(sanitizeNumeric('42')).toBe(42);
  });

  it('handles currency-formatted strings', () => {
    expect(sanitizeNumeric('$1,500.75')).toBe(1500.75);
  });

  it('returns fallback for non-numeric input', () => {
    expect(sanitizeNumeric('not a number')).toBe(0);
    expect(sanitizeNumeric('abc', 99)).toBe(99);
  });

  it('handles numeric type input', () => {
    expect(sanitizeNumeric(42)).toBe(42);
  });

  it('returns fallback for Infinity', () => {
    expect(sanitizeNumeric(Infinity)).toBe(0);
  });

  it('returns fallback for NaN number', () => {
    expect(sanitizeNumeric(NaN)).toBe(0);
  });
});
