
import crypto from 'crypto';
import { ghsToPesewas, pesewasToGhs, validatePaystackSignature } from '@/lib/payments/paystack';
import { formatPhoneForHubtel, validateHubtelAuth } from '@/lib/payments/hubtel';

describe('Payment Provider API Engine & Cryptography', () => {
  describe('Paystack Currency Converter', () => {
    it('converts Ghana Cedis (GH₵) to Paystack pesewas correctly', () => {
      expect(ghsToPesewas(250)).toBe(25000);
      expect(ghsToPesewas(0.5)).toBe(50);
      expect(ghsToPesewas(120.75)).toBe(12075);
      expect(ghsToPesewas(750)).toBe(75000);
    });

    it('converts Paystack pesewas to Ghana Cedis (GH₵) correctly', () => {
      expect(pesewasToGhs(25000)).toBe(250);
      expect(pesewasToGhs(50)).toBe(0.5);
      expect(pesewasToGhs(12075)).toBe(120.75);
      expect(pesewasToGhs(75000)).toBe(750);
    });
  });

  describe('Paystack HMAC SHA-512 Signature Verification', () => {
    const secretKey = 'sk_test_mock_secret_key_12345';
    const payload = JSON.stringify({
      event: 'charge.success',
      data: {
        reference: 'pst_123456789',
        amount: 25000,
        metadata: { type: 'saas_subscription', tier: 'pro' },
      },
    });

    it('validates a correct HMAC SHA-512 signature', () => {
      const validSignature = crypto.createHmac('sha512', secretKey).update(payload).digest('hex');
      const isValid = validatePaystackSignature(payload, validSignature, secretKey);
      expect(isValid).toBe(true);
    });

    it('rejects an invalid signature', () => {
      const invalidSignature = 'deadbeef1234567890abcdef1234567890abcdef1234567890abcdef12345678';
      const isValid = validatePaystackSignature(payload, invalidSignature, secretKey);
      expect(isValid).toBe(false);
    });

    it('rejects a signature when payload has been tampered with', () => {
      const validSignature = crypto.createHmac('sha512', secretKey).update(payload).digest('hex');
      const tamperedPayload = JSON.stringify({
        event: 'charge.success',
        data: { reference: 'pst_123456789', amount: 100 }, // altered amount
      });
      const isValid = validatePaystackSignature(tamperedPayload, validSignature, secretKey);
      expect(isValid).toBe(false);
    });

    it('returns false when secretKey or signature is missing', () => {
      expect(validatePaystackSignature(payload, '', secretKey)).toBe(false);
      expect(validatePaystackSignature(payload, 'sig', '')).toBe(false);
    });
  });

  describe('Hubtel Phone & Auth Operations', () => {
    it('normalizes Ghana international phone numbers for Hubtel USSD push', () => {
      expect(formatPhoneForHubtel('+233244123456')).toBe('0244123456');
      expect(formatPhoneForHubtel('233559876543')).toBe('0559876543');
      expect(formatPhoneForHubtel('0201234567')).toBe('0201234567');
    });

    it('validates Hubtel basic authorization headers', () => {
      const clientId = 'client_123';
      const clientSecret = 'secret_456';
      const validHeader = 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

      expect(validateHubtelAuth(validHeader, clientId, clientSecret)).toBe(true);
      expect(validateHubtelAuth('Basic invalid_base64', clientId, clientSecret)).toBe(false);
      expect(validateHubtelAuth(null, clientId, clientSecret)).toBe(false);
    });
  });
});
