
import {
  computeCustomerAttribution,
  type AttributionCustomerRow,
  type AttributionOrderRow,
} from './customer-attribution';

describe('computeCustomerAttribution', () => {
  it('returns zeroed always-shown channels and a storefront default for empty data', () => {
    const result = computeCustomerAttribution([], []);

    expect(result.totalAttributedCustomers).toBe(0);
    expect(result.topChannel).toBe('Direct Storefront');
    expect(result.channels.map((c) => c.source)).toEqual(['instagram', 'whatsapp', 'direct']);
    expect(result.channels.every((c) => c.customerCount === 0 && c.percentage === 0 && c.totalGmv === 0)).toBe(true);
  });

  it('maps null and unrecognized first_touch_source to direct', () => {
    const customers: AttributionCustomerRow[] = [
      { id: 'c1', first_touch_source: null },
      { id: 'c2', first_touch_source: 'myspace' },
      { id: 'c3', first_touch_source: 'WhatsApp' }, // case-insensitive
    ];

    const result = computeCustomerAttribution(customers, []);
    const direct = result.channels.find((c) => c.source === 'direct')!;
    const whatsapp = result.channels.find((c) => c.source === 'whatsapp')!;

    expect(direct.customerCount).toBe(2);
    expect(whatsapp.customerCount).toBe(1);
    expect(result.totalAttributedCustomers).toBe(3);
  });

  it('rounds channel percentages to whole numbers', () => {
    const customers: AttributionCustomerRow[] = [
      { id: 'c1', first_touch_source: 'whatsapp' },
      { id: 'c2', first_touch_source: 'whatsapp' },
      { id: 'c3', first_touch_source: 'instagram' },
    ];

    const result = computeCustomerAttribution(customers, []);
    const whatsapp = result.channels.find((c) => c.source === 'whatsapp')!;
    const instagram = result.channels.find((c) => c.source === 'instagram')!;

    expect(whatsapp.percentage).toBe(67); // 2/3 -> 66.66 -> 67
    expect(instagram.percentage).toBe(33); // 1/3 -> 33.33 -> 33
  });

  it('attributes GMV to the order source, falling back to the customer first touch then direct', () => {
    const customers: AttributionCustomerRow[] = [
      { id: 'c1', first_touch_source: 'whatsapp' },
      { id: 'c2', first_touch_source: 'instagram' },
    ];
    const orders: AttributionOrderRow[] = [
      { customer_id: 'c1', attribution_source: null, total_amount: 100 }, // -> whatsapp (customer first touch)
      { customer_id: 'c2', attribution_source: 'instagram', total_amount: '250.50' }, // string amount
      { customer_id: null, attribution_source: null, total_amount: 30 }, // -> direct (no signal)
    ];

    const result = computeCustomerAttribution(customers, orders);

    expect(result.channels.find((c) => c.source === 'whatsapp')!.totalGmv).toBe(100);
    expect(result.channels.find((c) => c.source === 'instagram')!.totalGmv).toBe(250.5);
    expect(result.channels.find((c) => c.source === 'direct')!.totalGmv).toBe(30);
  });

  it('ranks channels by customer count and names the top channel', () => {
    const customers: AttributionCustomerRow[] = [
      { id: 'c1', first_touch_source: 'whatsapp' },
      { id: 'c2', first_touch_source: 'whatsapp' },
      { id: 'c3', first_touch_source: 'instagram' },
    ];

    const result = computeCustomerAttribution(customers, []);

    expect(result.channels[0].source).toBe('whatsapp');
    expect(result.topChannel).toBe('WhatsApp Catalog & Chat');
  });
});
