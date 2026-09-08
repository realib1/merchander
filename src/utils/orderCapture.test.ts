import { describe, it, expect } from 'vitest';
import {
  calculateOrderTotals,
  formatOrderConfirmationMessage,
  formatOrderAssuranceNotice,
  buildGroundedOrderFacts,
  MatchedVariantData,
} from './orderCapture';

describe('orderCapture utility', () => {
  const sampleVariant1: MatchedVariantData = {
    id: 'var-001',
    sku: 'KENTE-RED-M',
    name: 'Medium',
    productName: 'Authentic Kente Cloth',
    price: 150.0,
    availableStock: 10,
    isPreorder: false,
  };

  const sampleVariant2: MatchedVariantData = {
    id: 'var-002',
    sku: 'SCARF-BLU',
    name: 'Default',
    productName: 'Silk Scarf',
    price: 50.0,
    availableStock: 2,
    isPreorder: false,
  };

  const preorderVariant: MatchedVariantData = {
    id: 'var-003',
    sku: 'BAG-PRE-L',
    name: 'Large',
    productName: 'Leather Tote Bag',
    price: 300.0,
    availableStock: 0,
    isPreorder: true,
  };

  describe('calculateOrderTotals', () => {
    it('calculates totals correctly for in-stock items without delivery fee', () => {
      const result = calculateOrderTotals([
        { variant: sampleVariant1, quantity: 2 },
        { variant: sampleVariant2, quantity: 1 },
      ]);

      expect(result.subtotal).toBe(350.0);
      expect(result.deliveryFee).toBe(0);
      expect(result.totalAmount).toBe(350.0);
      expect(result.hasStockDeficit).toBe(false);
      expect(result.warnings).toHaveLength(0);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].displayName).toBe('Authentic Kente Cloth - Medium');
      expect(result.items[1].displayName).toBe('Silk Scarf'); // 'Default' omitted
    });

    it('adds delivery fee to grand total', () => {
      const result = calculateOrderTotals([{ variant: sampleVariant1, quantity: 1 }], 25.5);

      expect(result.subtotal).toBe(150.0);
      expect(result.deliveryFee).toBe(25.5);
      expect(result.totalAmount).toBe(175.5);
    });

    it('flags stock deficit warning when quantity exceeds available stock', () => {
      const result = calculateOrderTotals([{ variant: sampleVariant2, quantity: 5 }]); // available is 2

      expect(result.hasStockDeficit).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Insufficient stock');
      expect(result.items[0].hasStockWarning).toBe(true);
    });

    it('does not trigger stock warning for preorder items with 0 stock', () => {
      const result = calculateOrderTotals([{ variant: preorderVariant, quantity: 3 }]);

      expect(result.hasStockDeficit).toBe(false);
      expect(result.warnings).toHaveLength(0);
      expect(result.items[0].hasStockWarning).toBe(false);
    });

    it('normalizes negative or invalid quantities to at least 1', () => {
      const result = calculateOrderTotals([{ variant: sampleVariant1, quantity: -5 }]);

      expect(result.items[0].quantity).toBe(1);
      expect(result.totalAmount).toBe(150.0);
    });
  });

  describe('formatOrderConfirmationMessage', () => {
    it('formats a clean WhatsApp message with order details and customer name', () => {
      const message = formatOrderConfirmationMessage({
        customerName: 'Ama Osei',
        orderNumber: 'ORD-1042',
        items: [
          {
            displayName: 'Authentic Kente Cloth - Medium',
            quantity: 2,
            unitPrice: 150.0,
            lineTotal: 300.0,
          },
        ],
        totalAmount: 325.0,
        deliveryFee: 25.0,
        currency: 'GHS',
      });

      expect(message).toContain('Hello Ama Osei! 🎉');
      expect(message).toContain('We have prepared your order #ORD-1042:');
      expect(message).toContain('• 2x Authentic Kente Cloth - Medium (GHS 150.00) = GHS 300.00');
      expect(message).toContain('Delivery Fee: GHS 25.00');
      expect(message).toContain('Total Amount: GHS 325.00');
    });

    it('uses Customer fallback when name is omitted or whitespace', () => {
      const message = formatOrderConfirmationMessage({
        customerName: '   ',
        orderNumber: 'ORD-9999',
        items: [{ displayName: 'Scarf', quantity: 1, unitPrice: 50.0, lineTotal: 50.0 }],
        totalAmount: 50.0,
      });

      expect(message).toContain('Hello Customer! 🎉');
      expect(message).not.toContain('Delivery Fee:');
      expect(message).toContain('Total Amount: GHS 50.00');
    });

    it('embeds payment link when paymentUrl is provided', () => {
      const message = formatOrderConfirmationMessage({
        customerName: 'Kojo',
        orderNumber: 'ORD-1234',
        items: [{ displayName: 'Shoes', quantity: 1, unitPrice: 200.0, lineTotal: 200.0 }],
        totalAmount: 200.0,
        paymentUrl: 'https://store.merchander.com/orders/ORD-1234?pay=true',
      });

      expect(message).toContain('👉 Complete payment securely here:');
      expect(message).toContain('https://store.merchander.com/orders/ORD-1234?pay=true');
    });
  });

  describe('formatOrderAssuranceNotice', () => {
    it('returns the standard assurance notice string', () => {
      const notice = formatOrderAssuranceNotice();
      expect(notice).toContain("We've received your order request!");
      expect(notice).toContain('confirming stock');
    });
  });

  describe('buildGroundedOrderFacts', () => {
    it('generates factual grounding strings for each line item', () => {
      const calculation = calculateOrderTotals(
        [
          { variant: sampleVariant1, quantity: 2 },
          { variant: sampleVariant2, quantity: 10 }, // stock deficit
        ],
        0
      );

      const facts = buildGroundedOrderFacts(calculation.items, 'Accra Main Store');

      expect(facts).toHaveLength(2);
      expect(facts[0]).toContain('Validated "Authentic Kente Cloth - Medium" (SKU: KENTE-RED-M)');
      expect(facts[0]).toContain('10 in stock at Accra Main Store');

      expect(facts[1]).toContain('⚠️ LOW/DEFICIT STOCK');
      expect(facts[1]).toContain('only 2 available at Accra Main Store');
    });
  });
});
