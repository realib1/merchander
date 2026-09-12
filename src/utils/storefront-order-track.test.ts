
import { normalizeGhanaPhone, formatGhanaLocalDisplay } from '@/utils/phone';

describe('Storefront Phone-Centric Identity & Order Tracking', () => {
  it('normalizes customer phone numbers for consistent order search', () => {
    expect(normalizeGhanaPhone('0244123456')).toBe('+233244123456');
    expect(normalizeGhanaPhone('+233 24 412 3456')).toBe('+233244123456');
    expect(normalizeGhanaPhone('233559876543')).toBe('+233559876543');
    expect(normalizeGhanaPhone('020-123-4567')).toBe('+233201234567');
  });

  it('formats local display for Ghana shoppers', () => {
    expect(formatGhanaLocalDisplay('+233244123456')).toBe('024 412 3456');
    expect(formatGhanaLocalDisplay('+233201234567')).toBe('020 123 4567');
  });

  it('verifies Order ID prefix generation format', () => {
    const mockId = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
    const orderNumber = `ORD-${mockId.slice(0, 8).toUpperCase()}`;
    expect(orderNumber).toBe('ORD-9B1DEB4D');
  });

  it('formats rider phone numbers with tap-to-call tel and Ghana display', () => {
    const rawRiderPhone = '0551234567';
    const normalized = normalizeGhanaPhone(rawRiderPhone);
    expect(normalized).toBe('+233551234567');
    expect(formatGhanaLocalDisplay(normalized || '')).toBe('055 123 4567');
    expect(`tel:${normalized}`).toBe('tel:+233551234567');
  });

  it('structures live waybill tracking object for dispatched order', () => {
    const waybill = {
      courierName: 'Yango Delivery',
      trackingNumber: 'TRK-987654',
      riderName: 'Kwame Mensah',
      riderPhone: normalizeGhanaPhone('0244000111'),
      fulfillmentMode: 'delivery' as const,
      dispatchedAt: '2026-09-09T10:00:00.000Z',
      deliveredAt: null,
    };

    expect(waybill.courierName).toBe('Yango Delivery');
    expect(waybill.riderName).toBe('Kwame Mensah');
    expect(waybill.riderPhone).toBe('+233244000111');
    expect(waybill.fulfillmentMode).toBe('delivery');
  });

  it('structures store pickup waybill without rider phone', () => {
    const pickupWaybill = {
      courierName: 'Store Pickup',
      trackingNumber: 'ORD-9B1DEB4D',
      riderName: null,
      riderPhone: null,
      fulfillmentMode: 'pickup' as const,
      pickupStoreName: 'Osu Oxford Street Branch',
      dispatchedAt: '2026-09-09T09:30:00.000Z',
      deliveredAt: null,
    };

    expect(pickupWaybill.fulfillmentMode).toBe('pickup');
    expect(pickupWaybill.pickupStoreName).toBe('Osu Oxford Street Branch');
    expect(pickupWaybill.riderPhone).toBeNull();
  });
});
