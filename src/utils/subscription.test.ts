import { describe, it, expect } from 'vitest';
import { SubscriptionSettings } from '@/types/settings';

describe('SubscriptionSettings Contract', () => {
  it('should support structured subscription tier, usage meters, and billing invoices', () => {
    const settings: SubscriptionSettings = {
      tier: 'pro',
      billingCycle: 'monthly',
      status: 'active',
      renewalDate: '1st of next month',
      monthlyPrice: 250,
      annualPrice: 2400,
      paymentMethod: {
        type: 'mtn_momo',
        identifier: '•••• 4567',
        holderName: 'Unique Fashion Ltd',
        isVerified: true,
      },
      usage: {
        products: { label: 'Products in Catalog', current: 18, limit: -1, unit: 'products' },
        staffSeats: { label: 'Active Staff Accounts', current: 2, limit: 5, unit: 'seats' },
        botMessages: { label: 'Bot Message Quota', current: 420, limit: 2500, unit: 'messages' },
      },
      invoices: [
        {
          id: 'inv-101',
          invoiceNumber: 'INV-2026-08-014',
          date: '2026-08-01',
          amount: 250,
          currency: 'GHS',
          status: 'paid',
          planName: 'Merchander Pro (Monthly)',
        },
      ],
    };

    expect(settings.tier).toBe('pro');
    expect(settings.paymentMethod?.type).toBe('mtn_momo');
    expect(settings.usage.products.limit).toBe(-1);
    expect(settings.invoices[0].amount).toBe(250);
  });
});
