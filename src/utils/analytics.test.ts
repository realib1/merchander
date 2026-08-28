import { describe, it, expect } from 'vitest';
import { computeAnalyticsData, RawAnalyticsInput } from './analyticsMath';

describe('Analytics Math Engine', () => {
  const mockInput: RawAnalyticsInput = {
    period: '30d',
    orders: [
      {
        id: 'ord-1',
        total_amount: 500,
        status: 'delivered',
        channel: 'whatsapp',
        payment_method: 'mtn_momo',
        created_at: '2026-08-20T10:00:00Z',
        customer_id: 'cust-1',
        customers: { id: 'cust-1', name: 'Ama Kofi', phone: '0241112233', created_at: '2026-01-01T00:00:00Z' },
        order_items: [
          {
            variant_id: 'var-1',
            quantity: 2,
            unit_price: 250,
            total_price: 500,
            product_variants: {
              sku: 'WIG-01',
              products: { id: 'prod-1', name: 'Bone Straight Wig', category_id: 'cat-1' },
            },
          },
        ],
      },
      {
        id: 'ord-2',
        total_amount: 300,
        status: 'paid',
        channel: 'storefront',
        payment_method: 'telecel_cash',
        created_at: '2026-08-22T14:00:00Z',
        customer_id: 'cust-1', // Repeat buyer
        customers: { id: 'cust-1', name: 'Ama Kofi', phone: '0241112233', created_at: '2026-01-01T00:00:00Z' },
        order_items: [
          {
            variant_id: 'var-2',
            quantity: 1,
            unit_price: 300,
            total_price: 300,
            product_variants: {
              sku: 'OIL-01',
              products: { id: 'prod-2', name: 'Lace Glue Oil', category_id: 'cat-2' },
            },
          },
        ],
      },
      {
        id: 'ord-3',
        total_amount: 200,
        status: 'cancelled',
        channel: 'pos',
        payment_method: 'cash',
        created_at: '2026-08-25T11:00:00Z',
        customer_id: 'cust-2',
        customers: { id: 'cust-2', name: 'Kwame Mensah', phone: '0559998877', created_at: '2026-08-25T00:00:00Z' },
      },
    ],
    priorOrders: [
      { total_amount: 400, status: 'delivered' },
      { total_amount: 200, status: 'delivered' },
    ],
    allCustomers: [
      { id: 'cust-1', name: 'Ama Kofi', phone: '0241112233', created_at: '2026-01-01T00:00:00Z' },
      { id: 'cust-2', name: 'Kwame Mensah', phone: '0559998877', created_at: '2026-08-25T00:00:00Z' },
    ],
    categories: [
      { id: 'cat-1', name: 'Wigs & Extensions' },
      { id: 'cat-2', name: 'Hair Care' },
    ],
    products: [
      { id: 'prod-1', name: 'Bone Straight Wig', category_id: 'cat-1' },
      { id: 'prod-2', name: 'Lace Glue Oil', category_id: 'cat-2' },
    ],
  };

  it('correctly calculates GMV, Orders Count, and AOV excluding cancelled orders', () => {
    const data = computeAnalyticsData(mockInput);
    expect(data.metrics.gmv).toBe(800); // 500 + 300 (excluding 200 cancelled)
    expect(data.metrics.ordersCount).toBe(2);
    expect(data.metrics.aov).toBe(400); // 800 / 2
    expect(data.metrics.gmvChange).toBeCloseTo(33.33, 1); // 800 vs 600 prior -> +33.3%
  });

  it('correctly calculates customer cohort repeat purchase rates', () => {
    const data = computeAnalyticsData(mockInput);
    // 1 customer (Ama Kofi) with 2 completed orders
    expect(data.customerCohorts.totalUniqueBuyers).toBe(1);
    expect(data.customerCohorts.returningBuyersCount).toBe(1);
    expect(data.customerCohorts.repeatRatePct).toBe(100);
    expect(data.customerCohorts.topVipCustomers[0].name).toBe('Ama Kofi');
    expect(data.customerCohorts.topVipCustomers[0].totalSpent).toBe(800);
  });

  it('correctly breaks down channel performance and payment methods', () => {
    const data = computeAnalyticsData(mockInput);
    const whatsapp = data.channels.find((c) => c.channel === 'whatsapp');
    const storefront = data.channels.find((c) => c.channel === 'storefront');

    expect(whatsapp?.gmv).toBe(500);
    expect(whatsapp?.sharePct).toBe(62.5); // 500 / 800 * 100
    expect(storefront?.gmv).toBe(300);
    expect(storefront?.sharePct).toBe(37.5); // 300 / 800 * 100
  });

  it('handles empty orders safely with 0 fallbacks', () => {
    const emptyData = computeAnalyticsData({
      ...mockInput,
      orders: [],
      priorOrders: [],
    });
    expect(emptyData.metrics.gmv).toBe(0);
    expect(emptyData.metrics.ordersCount).toBe(0);
    expect(emptyData.metrics.aov).toBe(0);
    expect(emptyData.customerCohorts.totalUniqueBuyers).toBe(0);
  });
});
