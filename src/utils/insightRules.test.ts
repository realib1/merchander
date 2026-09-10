import { describe, it, expect } from 'vitest';
import {
  evaluateInventoryInsights,
  evaluateMarginInsights,
  evaluateCustomerCreditInsights,
  evaluateLogisticsAndVipInsights,
  evaluateEmptyStoreInsights,
  type InsightProduct,
  type InsightCustomer,
  type InsightShipment,
} from './insightRules';

function product(overrides: Partial<InsightProduct> = {}): InsightProduct {
  return {
    id: 'p1',
    name: 'Ankara Bag',
    sku: 'AB-1',
    stock_quantity: 100,
    cost_price: 40,
    selling_price: 100,
    ...overrides,
  };
}

function customer(overrides: Partial<InsightCustomer> = {}): InsightCustomer {
  return {
    id: 'c1',
    name: 'Ama',
    phone: '0241234567',
    credit_balance: 0,
    total_spent: 0,
    updated_at: null,
    ...overrides,
  };
}

describe('evaluateInventoryInsights', () => {
  it('flags an imminent stockout as critical when days of supply <= 4', () => {
    // 70 units sold / 14 days = 5/day; 16 units -> ~3.2 days of supply
    const out = evaluateInventoryInsights([product({ id: 'p1', stock_quantity: 16 })], new Map([['p1', 70]]));
    expect(out).toHaveLength(1);
    expect(out[0].severity).toBe('critical');
    expect(out[0].id).toBe('stockout-critical-p1');
    expect(out[0].category).toBe('inventory');
  });

  it('flags low velocity as a warning when days of supply is between 5 and 9', () => {
    // 5/day, 35 units -> 7 days
    const out = evaluateInventoryInsights([product({ id: 'p1', stock_quantity: 35 })], new Map([['p1', 70]]));
    expect(out).toHaveLength(1);
    expect(out[0].severity).toBe('warning');
    expect(out[0].id).toBe('stockout-warning-p1');
  });

  it('flags a zero-stock product with no sales as critical', () => {
    const out = evaluateInventoryInsights([product({ id: 'p1', stock_quantity: 0 })], new Map());
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('stockout-zero-p1');
    expect(out[0].severity).toBe('critical');
  });

  it('returns nothing for a healthy, well-stocked product', () => {
    const out = evaluateInventoryInsights([product({ id: 'p1', stock_quantity: 500 })], new Map([['p1', 70]]));
    expect(out).toEqual([]);
  });

  it('ignores a product with stock but no recorded sales', () => {
    const out = evaluateInventoryInsights([product({ id: 'p1', stock_quantity: 3 })], new Map());
    expect(out).toEqual([]);
  });
});

describe('evaluateMarginInsights', () => {
  it('flags a negative-profit product as critical', () => {
    const out = evaluateMarginInsights([product({ cost_price: 120, selling_price: 100 })]);
    expect(out).toHaveLength(1);
    expect(out[0].severity).toBe('critical');
    expect(out[0].id).toBe('margin-negative-p1');
  });

  it('flags a thin margin (< 15%) as a warning', () => {
    const out = evaluateMarginInsights([product({ cost_price: 90, selling_price: 100 })]);
    expect(out).toHaveLength(1);
    expect(out[0].severity).toBe('warning');
    expect(out[0].id).toBe('margin-low-p1');
  });

  it('says nothing about a healthy margin', () => {
    expect(evaluateMarginInsights([product({ cost_price: 40, selling_price: 100 })])).toEqual([]);
  });

  it('skips products missing a cost or a price', () => {
    expect(evaluateMarginInsights([product({ cost_price: 0 })])).toEqual([]);
    expect(evaluateMarginInsights([product({ selling_price: 0 })])).toEqual([]);
  });
});

describe('evaluateCustomerCreditInsights', () => {
  it('only considers customers with a positive credit balance, capped at three', () => {
    const custs = [
      customer({ id: 'c1', credit_balance: 100 }),
      customer({ id: 'c2', credit_balance: 200 }),
      customer({ id: 'c3', credit_balance: 300 }),
      customer({ id: 'c4', credit_balance: 400 }),
      customer({ id: 'c5', credit_balance: 0 }),
    ];
    const out = evaluateCustomerCreditInsights(custs);
    expect(out).toHaveLength(3);
    expect(out.map((i) => i.id)).toEqual(['credit-overdue-c1', 'credit-overdue-c2', 'credit-overdue-c3']);
  });

  it('escalates a balance over 500 to critical', () => {
    const out = evaluateCustomerCreditInsights([customer({ credit_balance: 750 })]);
    expect(out[0].severity).toBe('critical');
  });

  it('keeps a balance of 500 or less as a warning', () => {
    const out = evaluateCustomerCreditInsights([customer({ credit_balance: 500 })]);
    expect(out[0].severity).toBe('warning');
  });

  it('uses a WhatsApp action when a phone is present and an internal link otherwise', () => {
    const withPhone = evaluateCustomerCreditInsights([customer({ credit_balance: 100, phone: '024 123 4567' })]);
    expect(withPhone[0].action.type).toBe('whatsapp');
    expect(withPhone[0].action.href).toContain('wa.me/');

    const noPhone = evaluateCustomerCreditInsights([customer({ credit_balance: 100, phone: null })]);
    expect(noPhone[0].action.type).toBe('internal_link');
  });

  it('returns nothing when no one owes anything', () => {
    expect(evaluateCustomerCreditInsights([customer({ credit_balance: 0 })])).toEqual([]);
  });
});

describe('evaluateLogisticsAndVipInsights', () => {
  const now = new Date('2026-02-01T00:00:00.000Z');

  function shipment(overrides: Partial<InsightShipment> = {}): InsightShipment {
    return {
      id: 's1',
      title: 'Container 1',
      tracking_number: 'TRK1',
      status: 'in_transit',
      carrier: 'Maersk',
      created_at: '2026-01-01T00:00:00.000Z',
      ...overrides,
    };
  }

  it('flags a shipment in transit for 10 or more days', () => {
    const out = evaluateLogisticsAndVipInsights([shipment()], [], now);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('shipment-delay-s1');
    expect(out[0].severity).toBe('warning');
  });

  it('ignores a recently created shipment', () => {
    const out = evaluateLogisticsAndVipInsights([shipment({ created_at: '2026-01-28T00:00:00.000Z' })], [], now);
    expect(out).toEqual([]);
  });

  it('raises a VIP re-engagement opportunity for a lapsed high-value customer, capped at two', () => {
    const vips = [
      customer({ id: 'v1', total_spent: 2000, updated_at: '2025-12-01T00:00:00.000Z' }),
      customer({ id: 'v2', total_spent: 5000, updated_at: '2025-12-01T00:00:00.000Z' }),
      customer({ id: 'v3', total_spent: 9000, updated_at: '2025-12-01T00:00:00.000Z' }),
    ];
    const out = evaluateLogisticsAndVipInsights([], vips, now);
    expect(out).toHaveLength(2);
    expect(out.every((i) => i.severity === 'opportunity')).toBe(true);
  });

  it('does not re-engage a VIP who ordered recently', () => {
    const out = evaluateLogisticsAndVipInsights(
      [],
      [customer({ total_spent: 3000, updated_at: '2026-01-20T00:00:00.000Z' })],
      now
    );
    expect(out).toEqual([]);
  });

  it('does not treat a low-spend customer as a VIP', () => {
    const out = evaluateLogisticsAndVipInsights(
      [],
      [customer({ total_spent: 200, updated_at: '2025-01-01T00:00:00.000Z' })],
      now
    );
    expect(out).toEqual([]);
  });
});

describe('evaluateEmptyStoreInsights', () => {
  it('returns onboarding insight when products, orders, and customers are all zero', () => {
    const out = evaluateEmptyStoreInsights(0, 0, 0);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('onboarding-empty-store');
    expect(out[0].category).toBe('velocity');
    expect(out[0].severity).toBe('info');
    expect(out[0].title).toBe('Welcome to Merchander!');
    expect(out[0].recommendation).toContain('Add your first products and record orders');
    expect(out[0].action.href).toBe('/dashboard/products/new');
  });

  it('returns empty array when tenant already has products', () => {
    const out = evaluateEmptyStoreInsights(5, 0, 0);
    expect(out).toEqual([]);
  });

  it('returns empty array when tenant already has orders', () => {
    const out = evaluateEmptyStoreInsights(0, 2, 0);
    expect(out).toEqual([]);
  });

  it('returns empty array when tenant already has customers', () => {
    const out = evaluateEmptyStoreInsights(0, 0, 1);
    expect(out).toEqual([]);
  });
});

