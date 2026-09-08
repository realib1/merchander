import { describe, it, expect } from 'vitest';
import {
  buildStorefrontOrderPaymentUrl,
  formatOrderPaymentLinkMessage,
  formatProviderLabel,
  formatPaymentReceiptMessage,
  formatPaymentReminderMessage,
} from './paymentLinks';

describe('paymentLinks utils', () => {
  describe('buildStorefrontOrderPaymentUrl', () => {
    it('builds standard storefront checkout URL with pay=true', () => {
      const url = buildStorefrontOrderPaymentUrl({
        baseUrl: 'https://app.merchander.com',
        storeSlug: 'duapa-store',
        orderShortIdOrId: 'ORD-A1B2C3',
      });

      expect(url).toBe('https://app.merchander.com/store/duapa-store/orders/ORD-A1B2C3?pay=true');
    });

    it('handles baseUrl with trailing slash and query token', () => {
      const url = buildStorefrontOrderPaymentUrl({
        baseUrl: 'https://app.merchander.com///',
        storeSlug: 'duapa-store',
        orderShortIdOrId: 'ORD-123456',
        token: 'sec_tok_xyz',
      });

      expect(url).toBe('https://app.merchander.com/store/duapa-store/orders/ORD-123456?pay=true&token=sec_tok_xyz');
    });

    it('respects autoOpenPayment=false', () => {
      const url = buildStorefrontOrderPaymentUrl({
        baseUrl: 'https://app.merchander.com',
        storeSlug: 'duapa-store',
        orderShortIdOrId: 'ORD-123456',
        autoOpenPayment: false,
      });

      expect(url).toBe('https://app.merchander.com/store/duapa-store/orders/ORD-123456');
    });

    it('falls back when baseUrl is omitted', () => {
      const url = buildStorefrontOrderPaymentUrl({
        storeSlug: 'my-store',
        orderShortIdOrId: 'ORD-999',
      });

      expect(url).toContain('/store/my-store/orders/ORD-999?pay=true');
    });
  });

  describe('formatProviderLabel', () => {
    it('formats known payment providers', () => {
      expect(formatProviderLabel('paystack')).toBe('Paystack (Card / MoMo)');
      expect(formatProviderLabel('hubtel')).toBe('Hubtel Mobile Money');
      expect(formatProviderLabel('mtn_momo')).toBe('MTN Mobile Money');
      expect(formatProviderLabel('telecel_cash')).toBe('Telecel Cash');
      expect(formatProviderLabel('at_money')).toBe('AT Money');
      expect(formatProviderLabel('card')).toBe('Debit/Credit Card');
      expect(formatProviderLabel('bank_transfer')).toBe('Bank Transfer');
      expect(formatProviderLabel('cash_on_delivery')).toBe('Cash on Delivery');
    });

    it('falls back gracefully on empty or unknown providers', () => {
      expect(formatProviderLabel('')).toBe('Online Payment');
      expect(formatProviderLabel(undefined)).toBe('Online Payment');
      expect(formatProviderLabel(null)).toBe('Online Payment');
      expect(formatProviderLabel('crypto_usdt')).toBe('Crypto Usdt');
    });
  });

  describe('formatOrderPaymentLinkMessage', () => {
    it('formats a complete payment link request message with items', () => {
      const msg = formatOrderPaymentLinkMessage({
        customerName: 'Kofi Mensah',
        orderNumber: 'ORD-88231',
        totalAmount: 450,
        currency: 'GHS',
        paymentUrl: 'https://merchander.com/store/duapa/orders/ORD-88231?pay=true',
        itemsSummary: '2x Nike Sneakers, 1x Cap',
      });

      expect(msg).toContain('Hello Kofi Mensah! 🎉');
      expect(msg).toContain('order #ORD-88231');
      expect(msg).toContain('Items: 2x Nike Sneakers, 1x Cap');
      expect(msg).toContain('Total Amount: GHS 450.00');
      expect(msg).toContain('https://merchander.com/store/duapa/orders/ORD-88231?pay=true');
      expect(msg).toContain('Mobile Money');
    });

    it('handles missing customer name and item summary fallbacks', () => {
      const msg = formatOrderPaymentLinkMessage({
        customerName: null,
        orderNumber: 'ORD-001',
        totalAmount: 75.5,
        paymentUrl: 'https://merchander.com/pay',
      });

      expect(msg).toContain('Hello Valued Customer! 🎉');
      expect(msg).toContain('Total Amount: GHS 75.50');
      expect(msg).not.toContain('Items:');
      expect(msg).toContain('https://merchander.com/pay');
    });
  });

  describe('formatPaymentReceiptMessage', () => {
    it('formats payment confirmation receipt with reference and tracking URL', () => {
      const msg = formatPaymentReceiptMessage({
        customerName: 'Ama Boateng',
        orderNumber: 'ORD-44123',
        amountPaid: 250,
        currency: 'GHS',
        provider: 'hubtel',
        transactionRef: 'HUB-9821-XYZ',
        trackingUrl: 'https://merchander.com/store/duapa/orders/ORD-44123',
      });

      expect(msg).toContain('Payment Confirmed! ✅');
      expect(msg).toContain('Hello Ama Boateng');
      expect(msg).toContain('GHS 250.00 for Order #ORD-44123');
      expect(msg).toContain('Reference: HUB-9821-XYZ');
      expect(msg).toContain('Payment Channel: Hubtel Mobile Money');
      expect(msg).toContain('Track your live order progress here:');
      expect(msg).toContain('https://merchander.com/store/duapa/orders/ORD-44123');
    });

    it('formats receipt without tracking link if not provided', () => {
      const msg = formatPaymentReceiptMessage({
        customerName: undefined,
        orderNumber: 'ORD-999',
        amountPaid: 100,
        transactionRef: 'TX-12345',
      });

      expect(msg).toContain('Hello Customer');
      expect(msg).toContain('GHS 100.00 for Order #ORD-999');
      expect(msg).not.toContain('Track your live order progress here:');
    });
  });

  describe('formatPaymentReminderMessage', () => {
    it('formats friendly reminder with payment link', () => {
      const msg = formatPaymentReminderMessage({
        customerName: 'Kwame',
        orderNumber: 'ORD-77112',
        totalAmount: 180,
        currency: 'GHS',
        paymentUrl: 'https://merchander.com/store/duapa/orders/ORD-77112?pay=true',
        hoursSinceOrder: 24,
      });

      expect(msg).toContain('Friendly Payment Reminder ⏳');
      expect(msg).toContain('Hi Kwame');
      expect(msg).toContain('Order #ORD-77112 (GHS 180.00)');
      expect(msg).toContain('https://merchander.com/store/duapa/orders/ORD-77112?pay=true');
      expect(msg).toContain('Your reserved items are currently waiting');
    });

    it('falls back on missing customer name', () => {
      const msg = formatPaymentReminderMessage({
        orderNumber: 'ORD-77112',
        totalAmount: 50,
        paymentUrl: 'https://merchander.com/pay',
      });

      expect(msg).toContain('Hi there');
      expect(msg).toContain('Order #ORD-77112 (GHS 50.00)');
    });
  });
});
