import { describe, it, expect } from 'vitest';
import { PaymentSettings } from '@/types/settings';

describe('PaymentSettings data contract', () => {
  it('defines valid initial payment configuration structure', () => {
    const sample: PaymentSettings = {
      methods: {
        mobileMoney: true,
        cash: true,
        bankTransfer: true,
        card: false,
        other: false,
      },
      momoDetails: {
        mtnNumber: '0241234567',
        mtnAccountName: 'Unique Fashion',
      },
      bankDetails: {
        bankName: 'Stanbic Bank',
        accountNumber: '0140123456701',
      },
      p2pAccounts: [
        {
          id: 'p2p-1',
          type: 'mtn_momo',
          providerName: 'MTN Mobile Money',
          accountNumber: '0241234567',
          accountName: 'Unique Fashion Ltd',
        },
      ],
      codMaxOrderAmount: 500,
      paymentInstructions: 'Please use your Order Number as payment reference.',
      providers: {
        paystack: { connected: false },
        hubtel: { connected: false },
      },
      currency: 'GHS',
      recording: {
        allowManualRecording: true,
        requirePaymentReference: true,
        allowPartialPayments: true,
        recordSupplierPayments: true,
      },
      supplierPayments: {
        enabled: true,
        defaultMethods: ['momo', 'bank', 'cash'],
      },
    };

    expect(sample.methods.mobileMoney).toBe(true);
    expect(sample.p2pAccounts?.[0].accountNumber).toBe('0241234567');
    expect(sample.currency).toBe('GHS');
    expect(sample.supplierPayments.defaultMethods).toContain('momo');
    expect(sample.recording.allowManualRecording).toBe(true);
  });
});
