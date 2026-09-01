import { describe, it, expect } from 'vitest';

describe('Help & Support Utility Logic', () => {
  it('formats WhatsApp support messages with store context properly', () => {
    const storeName = 'Accra Luxury Wear';
    const tenantId = 'tenant-accra-123';
    const msg = encodeURIComponent(
      `Hello Merchander Support Team! I need assistance with my store dashboard (Store: ${storeName}, ID: ${tenantId}).`
    );

    expect(msg).toContain('Accra%20Luxury%20Wear');
    expect(msg).toContain('tenant-accra-123');
  });

  it('generates a clean ticket reference code format', () => {
    const generateRefCode = () => `TKT-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const code = generateRefCode();

    expect(code.startsWith('TKT-')).toBe(true);
    expect(code.length).toBeGreaterThanOrEqual(7);
  });
});
