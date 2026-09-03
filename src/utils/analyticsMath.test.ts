import { describe, it, expect } from 'vitest';
import { computeAnalyticsData, type RawAnalyticsInput } from './analyticsMath';

/**
 * All assertions here are timezone-independent. `computeAnalyticsData` buckets
 * the timeline and peak-trading sections by local-time `getHours`/`getDay`, so
 * those are only checked by shape and by invariant totals, never by which
 * hour/day bucket a row landed in.
 */
function baseInput(overrides: Partial<RawAnalyticsInput> = {}): RawAnalyticsInput {
  const items = (productId: string, sku: string, name: string, categoryId: string, qty: number, unit: number) => [
    {
      variant_id: `v-${productId}`,
      quantity: qty,
      unit_price: unit,
      product_variants: { product_id: productId, sku, products: { id: productId, name, category_id: categoryId } },
    },
  ];

  return {
    period: '30d',
    orders: [
      {
        id: 'o1',
        total_amount: 100,
        status: 'delivered',
        channel: 'whatsapp',
        payment_method: 'mtn_momo',
        created_at: '2026-01-05T09:00:00.000Z',
        customer_id: 'c1',
        customers: { id: 'c1', name: 'Ama', phone: '024', created_at: '2026-01-01T00:00:00.000Z' },
        order_items: items('p1', 'BAG-1', 'Bag', 'cat1', 2, 50),
      },
      {
        id: 'o2',
        total_amount: 200,
        status: 'paid',
        channel: 'storefront',
        payment_method: 'card',
        created_at: '2026-01-10T12:00:00.000Z',
        customer_id: 'c1',
        customers: { id: 'c1', name: 'Ama', phone: '024', created_at: '2026-01-01T00:00:00.000Z' },
        order_items: items('p2', 'SHOE-1', 'Shoe', 'cat2', 1, 200),
      },
      {
        id: 'o3',
        total_amount: 300,
        status: 'delivered',
        channel: 'whatsapp',
        payment_method: 'mtn_momo',
        created_at: '2026-01-15T15:00:00.000Z',
        customer_id: 'c2',
        customers: { id: 'c2', name: 'Kofi', phone: '020', created_at: '2026-01-14T00:00:00.000Z' },
        order_items: items('p1', 'BAG-1', 'Bag', 'cat1', 3, 100),
      },
      {
        id: 'o4',
        total_amount: 999,
        status: 'cancelled',
        channel: 'pos',
        payment_method: 'cash',
        created_at: '2026-01-20T10:00:00.000Z',
        customer_id: 'c3',
        customers: { id: 'c3', name: 'Esi', phone: '027', created_at: '2026-01-20T00:00:00.000Z' },
        order_items: null,
      },
      {
        id: 'o5',
        total_amount: 50,
        status: 'draft',
        channel: 'whatsapp',
        payment_method: 'mtn_momo',
        created_at: '2026-01-21T10:00:00.000Z',
        customer_id: 'c2',
        customers: { id: 'c2', name: 'Kofi', phone: '020', created_at: '2026-01-14T00:00:00.000Z' },
        order_items: null,
      },
    ],
    priorOrders: [
      { total_amount: 100, status: 'delivered' },
      { total_amount: 50, status: 'cancelled' },
    ],
    categories: [
      { id: 'cat1', name: 'Bags' },
      { id: 'cat2', name: 'Shoes' },
    ],
    products: [
      { id: 'p1', name: 'Bag', category_id: 'cat1' },
      { id: 'p2', name: 'Shoe', category_id: 'cat2' },
    ],
    ...overrides,
  };
}

describe('computeAnalyticsData - headline metrics', () => {
  const data = computeAnalyticsData(baseInput());

  it('excludes cancelled and draft orders from GMV and order count', () => {
    expect(data.metrics.gmv).toBe(600);
    expect(data.metrics.ordersCount).toBe(3);
    expect(data.metrics.aov).toBe(200);
  });

  it('computes fulfilment rate over all orders', () => {
    // delivered/paid = o1,o2,o3 out of 5 total orders
    expect(data.metrics.fulfillmentRatePct).toBe(60);
  });

  it('computes period-over-period change against prior completed orders', () => {
    expect(data.metrics.gmvChange).toBe(500);
    expect(data.metrics.ordersChange).toBe(200);
    expect(data.metrics.aovChange).toBe(100);
  });

  it('leaves change undefined when there is no prior baseline', () => {
    const d = computeAnalyticsData(baseInput({ priorOrders: [] }));
    expect(d.metrics.gmvChange).toBeUndefined();
    expect(d.metrics.ordersChange).toBeUndefined();
    expect(d.metrics.aovChange).toBeUndefined();
  });

  it('labels the period', () => {
    expect(data.periodLabel).toBe('Last 30 Days');
  });
});

describe('computeAnalyticsData - customer cohorts', () => {
  const { customerCohorts } = computeAnalyticsData(baseInput());

  it('splits buyers into new and returning by completed-order count', () => {
    expect(customerCohorts.totalUniqueBuyers).toBe(2);
    expect(customerCohorts.returningBuyersCount).toBe(1);
    expect(customerCohorts.newBuyersCount).toBe(1);
    expect(customerCohorts.repeatRatePct).toBe(50);
  });

  it('attributes revenue to each cohort', () => {
    expect(customerCohorts.returningBuyersRevenue).toBe(300);
    expect(customerCohorts.newBuyersRevenue).toBe(300);
  });

  it('ranks VIPs by spend, highest first', () => {
    const spents = customerCohorts.topVipCustomers.map((c) => c.totalSpent);
    expect(spents).toEqual([...spents].sort((a, b) => b - a));
    expect(customerCohorts.topVipCustomers.length).toBeLessThanOrEqual(10);
  });
});

describe('computeAnalyticsData - distributions', () => {
  const data = computeAnalyticsData(baseInput());

  it('ranks channels by GMV and shares to 100 across the set', () => {
    expect(data.channels[0].channel).toBe('whatsapp');
    expect(data.channels[0].gmv).toBe(400);
    const shareSum = data.channels.reduce((s, c) => s + c.sharePct, 0);
    expect(shareSum).toBeCloseTo(100, 5);
  });

  it('ranks payment methods by volume', () => {
    expect(data.paymentMethods[0].method).toBe('mtn_momo');
    expect(data.paymentMethods[0].volume).toBe(400);
  });

  it('always returns the five fixed status-funnel rows', () => {
    expect(data.statusFunnel.map((r) => r.status)).toEqual([
      'pending_payment',
      'paid',
      'dispatched',
      'delivered',
      'cancelled',
    ]);
    const delivered = data.statusFunnel.find((r) => r.status === 'delivered')!;
    expect(delivered.count).toBe(2);
    expect(delivered.sharePct).toBe(40);
  });

  it('ranks products and categories by revenue, highest first', () => {
    expect(data.topProducts[0].id).toBe('p1');
    expect(data.topProducts[0].unitsSold).toBe(5);
    expect(data.topProducts[0].revenue).toBe(400);
    expect(data.categories[0].name).toBe('Bags');
    expect(data.categories[0].revenue).toBe(400);
  });
});

describe('computeAnalyticsData - time sections (shape only)', () => {
  const data = computeAnalyticsData(baseInput());

  it('keeps GMV invariant across the timeline buckets', () => {
    const total = data.timeline.reduce((s, p) => s + p.gmv, 0);
    expect(total).toBe(600);
    data.timeline.forEach((p) => {
      expect(p.aov).toBe(p.ordersCount > 0 ? p.gmv / p.ordersCount : 0);
    });
  });

  it('returns 7 day rows and 5 hour-window rows that sum to total GMV', () => {
    expect(data.peakTrading.dayOfWeekBreakdown).toHaveLength(7);
    expect(data.peakTrading.hourlyBreakdown).toHaveLength(5);
    const dayGmv = data.peakTrading.dayOfWeekBreakdown.reduce((s, d) => s + d.gmv, 0);
    expect(dayGmv).toBe(600);
    expect(typeof data.peakTrading.busiestDay).toBe('string');
  });
});

describe('computeAnalyticsData - empty input', () => {
  const data = computeAnalyticsData(baseInput({ orders: [], priorOrders: [] }));

  it('produces zeroed metrics without throwing', () => {
    expect(data.metrics.gmv).toBe(0);
    expect(data.metrics.aov).toBe(0);
    expect(data.metrics.fulfillmentRatePct).toBe(0);
    expect(data.customerCohorts.totalUniqueBuyers).toBe(0);
    expect(data.peakTrading.busiestDay).toBe('None recorded');
  });
});
