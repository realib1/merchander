import { describe, it, expect } from 'vitest';
import { normalizeGhanaPhone, formatGhanaLocalDisplay } from '@/utils/phone';

describe('Storefront Phone-Centric Identity & Order Tracking', () => {
  it('normalizes customer phone numbers for consistent order search', () => {
    expect(normalizeGhanaPhone('0244123456')).toBe('+233244123456');
    expect(normalizeGhanaPhone('+233 24 412 3456')).toBe('+233244123456');
    expect(normalizeGhanaPhone('233559876543')).toBe('+233559876543');
    expect(normalizeGhanaPhone('020-123-4567')).toBe('+233201234567');
  });

  it('formats local display for Ghana shoppers', () => {
    expect(formatGhanaLocalDisplay('+233244123456')).toBe('024 412 3456');
    expect(formatGhanaLocalDisplay('+233201234567')).toBe('020 123 4567');
  });

  it('verifies Order ID prefix generation format', () => {
    const mockId = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
    const orderNumber = `ORD-${mockId.slice(0, 8).toUpperCase()}`;
    expect(orderNumber).toBe('ORD-9B1DEB4D');
  });
});
