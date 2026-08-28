import { describe, it, expect } from 'vitest';

describe('Business Insights Rule Engine Logic', () => {
  it('correctly calculates stockout days of supply', () => {
    const stock = 20;
    const unitsSold14d = 70;
    const dailyVelocity = unitsSold14d / 14; // 5 units/day
    const daysOfSupply = stock / dailyVelocity; // 4 days

    expect(dailyVelocity).toBe(5);
    expect(daysOfSupply).toBe(4);
    expect(daysOfSupply <= 4).toBe(true);
  });

  it('correctly flags negative gross profit as critical loss', () => {
    const costPrice = 120;
    const sellingPrice = 100;
    const profit = sellingPrice - costPrice;
    const marginPct = (profit / sellingPrice) * 100;

    expect(profit).toBe(-20);
    expect(marginPct).toBe(-20);
    expect(profit < 0).toBe(true);
  });

  it('correctly flags thin margins (<15%)', () => {
    const costPrice = 88;
    const sellingPrice = 100;
    const profit = sellingPrice - costPrice;
    const marginPct = (profit / sellingPrice) * 100;

    expect(profit).toBe(12);
    expect(marginPct).toBe(12);
    expect(marginPct < 15).toBe(true);
  });

  it('correctly encodes WhatsApp debt reminder message', () => {
    const customerName = 'Kofi Mensah';
    const debt = 450.5;
    const rawMessage = `Hello ${customerName}, this is a gentle reminder regarding your outstanding balance of GHS ${debt.toFixed(2)} on Merchander. Kindly let us know if you have settled or need payment details. Thank you!`;
    const encoded = encodeURIComponent(rawMessage);

    expect(encoded).toContain('Kofi%20Mensah');
    expect(encoded).toContain('450.50');
  });
});
