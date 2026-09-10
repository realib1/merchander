import { describe, it, expect } from 'vitest';
import {
  formatTierName,
  getTrialCountdown,
  formatRenewalDate,
  generateTrialInvoice,
} from './subscription';

describe('formatTierName', () => {
  it('maps standard tiers to human readable plan titles', () => {
    expect(formatTierName('starter')).toBe('Starter');
    expect(formatTierName('growth')).toBe('Growth Pro');
    expect(formatTierName('pro')).toBe('Growth Pro');
    expect(formatTierName('business')).toBe('Business');
    expect(formatTierName('enterprise')).toBe('Enterprise Scale');
    expect(formatTierName('free')).toBe('Free Plan');
  });

  it('handles null, undefined and custom tier names safely', () => {
    expect(formatTierName(null)).toBe('Starter');
    expect(formatTierName(undefined)).toBe('Starter');
    expect(formatTierName('custom_scale')).toBe('Custom_scale');
  });
});

describe('getTrialCountdown', () => {
  const baseTime = new Date('2026-09-09T12:00:00.000Z').getTime();

  it('calculates days remaining, elapsed and percentage for an active trial', () => {
    // Target is 10 days in the future
    const renewalDate = '2026-09-19T12:00:00.000Z';
    const result = getTrialCountdown(renewalDate, 14, baseTime);

    expect(result.isTrial).toBe(true);
    expect(result.daysRemaining).toBe(10);
    expect(result.daysElapsed).toBe(5);
    expect(result.formattedTimeline).toContain('Day 5 of 14 • 10 days remaining');
  });

  it('handles 1 day remaining with singular day word', () => {
    const renewalDate = '2026-09-10T11:00:00.000Z';
    const result = getTrialCountdown(renewalDate, 14, baseTime);

    expect(result.isTrial).toBe(true);
    expect(result.daysRemaining).toBe(1);
    expect(result.formattedTimeline).toContain('Day 14 of 14 • 1 day remaining');
  });

  it('handles expired trial or non-trial safely', () => {
    const renewalDate = '2026-09-08T12:00:00.000Z';
    const result = getTrialCountdown(renewalDate, 14, baseTime);

    expect(result.isTrial).toBe(false);
    expect(result.daysRemaining).toBe(0);
    expect(result.formattedTimeline).toBe('Trial period concluded');
  });

  it('handles null, empty or invalid date safely', () => {
    expect(getTrialCountdown(null).isTrial).toBe(false);
    expect(getTrialCountdown('invalid-date').isTrial).toBe(false);
  });
});

describe('formatRenewalDate', () => {
  const baseTime = new Date('2026-09-09T12:00:00.000Z').getTime();

  it('formats active trial with friendly days remaining and cycle', () => {
    const renewalIso = '2026-09-23T18:46:56.697+00:00';
    const text = formatRenewalDate(renewalIso, 'monthly', true, baseTime);

    expect(text).toContain('Trial ends on');
    expect(text).toContain('Sep 23, 2026');
    expect(text).toContain('days left');
    expect(text).toContain('Billed monthly thereafter');
  });

  it('formats annual active trial with annual cycle text', () => {
    const renewalIso = '2026-09-23T18:46:56.697+00:00';
    const text = formatRenewalDate(renewalIso, 'annual', true, baseTime);

    expect(text).toContain('Billed annually thereafter');
  });

  it('formats active paid renewal without trial prefix', () => {
    const renewalIso = '2026-10-01T00:00:00.000Z';
    const text = formatRenewalDate(renewalIso, 'monthly', false, baseTime);

    expect(text).toBe('Renews on Oct 1, 2026 • Billed monthly');
  });

  it('handles continuous free access without crashing', () => {
    expect(formatRenewalDate('Continuous Free Access')).toBe('Continuous Free Access • No renewal charges');
    expect(formatRenewalDate(null)).toBe('Continuous Free Access • No renewal charges');
  });
});

describe('generateTrialInvoice', () => {
  it('generates zero-amount trial invoice with formatted number', () => {
    const invoice = generateTrialInvoice('tenant-abc-12345', '2026-09-09T00:00:00.000Z', 'growth');

    expect(invoice.amount).toBe(0);
    expect(invoice.currency).toBe('GHS');
    expect(invoice.status).toBe('paid');
    expect(invoice.planName).toBe('14-Day Free Trial (Growth Pro)');
    expect(invoice.invoiceNumber).toBe('INV-TR-TENANT');
    expect(invoice.id).toContain('inv-trial-tenantabc');
  });
});
