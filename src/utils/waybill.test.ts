
import {
  generateDispatchSlip,
  formatWaybillForWhatsApp,
  buildRiderWhatsAppShareUrl,
  WaybillOrder,
} from './waybill';

describe('waybill utils', () => {
  const sampleDeliveryOrder: WaybillOrder = {
    orderId: 'c64a38df-6bf9-455b-b9d9-bb4331008d51',
    shortId: 'ORD-7890',
    storeName: 'Sika Boutique',
    customerName: 'Akosua Mensah',
    customerPhone: '0244112233',
    fulfillmentMode: 'delivery',
    deliveryAddress: 'House 14, Ring Road Central, Kokomlemle',
    gpsLocation: 'GA-183-9021',
    landmark: 'Near City Galleria Mall',
    items: [
      { name: 'Zara Floral Dress', variantName: 'Red / M', price: 250, quantity: 2 },
      { name: 'Gold Clasp Belt', price: 80, quantity: 1 },
    ],
    deliveryFee: 35,
    totalAmount: 580,
    paymentStatus: 'draft',
    riderName: 'Kwesi Rider',
    riderPhone: '0205556677',
    courierName: 'Yango Delivery',
    trackingNumber: 'TRK-9901',
    dispatchNotes: 'Fragile fabric, handle with care',
  };

  const samplePaidDeliveryOrder: WaybillOrder = {
    ...sampleDeliveryOrder,
    paymentStatus: 'paid',
    transactionRef: 'HUB-PAY-55829',
  };

  const samplePickupOrder: WaybillOrder = {
    orderId: 'a12b34cd-5ef6-7890-abcd-1234567890ab',
    shortId: 'ORD-PICKUP-1',
    storeName: 'Sika Boutique',
    customerName: 'Kofi Mensah',
    customerPhone: '0551234567',
    fulfillmentMode: 'pickup',
    pickupStoreName: 'Sika Boutique - Osu Oxford St',
    pickupCode: 'PU-7788',
    items: [{ name: 'Leather Loafers', variantName: 'Size 43', price: 450, quantity: 1 }],
    deliveryFee: 0,
    totalAmount: 450,
    paymentStatus: 'paid',
  };

  describe('generateDispatchSlip', () => {
    it('generates a formatted thermal slip for Cash on Delivery orders', () => {
      const slip = generateDispatchSlip(sampleDeliveryOrder);

      expect(slip).toContain('MERCHANDER DISPATCH SLIP');
      expect(slip).toContain('ORD-7890');
      expect(slip).toContain('Branch: Sika Boutique');
      expect(slip).toContain('Customer: Akosua Mensah');
      expect(slip).toContain('Phone: 0244112233');
      expect(slip).toContain('Location: House 14, Ring Road Central, Kokomlemle');
      expect(slip).toContain('GhanaPost GPS: GA-183-9021');
      expect(slip).toContain('Landmark: Near City Galleria Mall');
      expect(slip).toContain('2x Zara Floral Dress (Red / M)');
      expect(slip).toContain('1x Gold Clasp Belt');
      expect(slip).toContain('CASH ON DELIVERY (COD) - COLLECT: GHS 580.00');
      expect(slip).toContain('Courier: Yango Delivery');
      expect(slip).toContain('Rider: Kwesi Rider (0205556677)');
      expect(slip).toContain('Tracking #: TRK-9901');
      expect(slip).toContain('Notes: Fragile fabric, handle with care');
    });

    it('generates a formatted thermal slip for Paid orders with transaction ref and fallback shortId', () => {
      const orderWithoutShortId = {
        ...samplePaidDeliveryOrder,
        shortId: undefined,
      };
      const slip = generateDispatchSlip(orderWithoutShortId);

      expect(slip).toContain('C64A38DF');
      expect(slip).toContain('PAID ONLINE - DO NOT COLLECT CASH [Ref: HUB-PAY-55829]');
    });

    it('generates a formatted thermal slip for In-Store Pickup orders', () => {
      const slip = generateDispatchSlip(samplePickupOrder);

      expect(slip).toContain('FULFILMENT: CUSTOMER STORE PICKUP');
      expect(slip).toContain('Pickup Branch: Sika Boutique - Osu Oxford St');
      expect(slip).toContain('Pickup Code: PU-7788');
      expect(slip).toContain('PAID ONLINE - DO NOT COLLECT CASH');
      expect(slip).not.toContain('DISPATCH / COURIER DETAILS:');
    });
  });

  describe('formatWaybillForWhatsApp', () => {
    it('generates a WhatsApp dispatch message with COD collection instructions', () => {
      const waText = formatWaybillForWhatsApp(sampleDeliveryOrder);

      expect(waText).toContain('🛵 *DISPATCH WAYBILL* - #ORD-7890');
      expect(waText).toContain('👤 *Customer:* Akosua Mensah');
      expect(waText).toContain('📞 *Phone:* 0244112233');
      expect(waText).toContain('📍 *Delivery Address:* House 14, Ring Road Central, Kokomlemle');
      expect(waText).toContain('🗺️ *GPS:* GA-183-9021');
      expect(waText).toContain('🚩 *Landmark:* Near City Galleria Mall');
      expect(waText).toContain('🛵 *Assigned Rider/Courier:* Kwesi Rider (0205556677)');
      expect(waText).toContain('📝 *Notes:* Fragile fabric, handle with care');
      expect(waText).toContain('• 2x Zara Floral Dress (Red / M) - GHS 500.00');
      expect(waText).toContain('• 1x Gold Clasp Belt - GHS 80.00');
      expect(waText).toContain('🚨 *CASH ON DELIVERY (COD) - COLLECT GHS 580.00 FROM CUSTOMER*');
    });

    it('generates a WhatsApp dispatch message with Paid Online instructions', () => {
      const waText = formatWaybillForWhatsApp(samplePaidDeliveryOrder);

      expect(waText).toContain('✅ *PAID ONLINE - DO NOT COLLECT ANY CASH*');
    });

    it('generates a WhatsApp pickup message for customer pickup orders', () => {
      const waText = formatWaybillForWhatsApp(samplePickupOrder);

      expect(waText).toContain('📦 *ORDER READY FOR PICKUP* - #ORD-PICKUP-1');
      expect(waText).toContain('🏬 *Pickup Location:* Sika Boutique - Osu Oxford St');
      expect(waText).toContain('🔑 *Pickup Code:* PU-7788');
      expect(waText).toContain('💰 *Payment:* ✅ *PAID ONLINE*');
    });

    it('handles unpaid pickup order with collect cash notice', () => {
      const unpaidPickup: WaybillOrder = {
        ...samplePickupOrder,
        paymentStatus: 'pending',
      };
      const waText = formatWaybillForWhatsApp(unpaidPickup);

      expect(waText).toContain('⚠️ *COLLECT CASH:* GHS 450.00');
    });
  });

  describe('buildRiderWhatsAppShareUrl', () => {
    it('constructs a valid wa.me url with normalized Ghana phone and encoded waybill message', () => {
      const url = buildRiderWhatsAppShareUrl('0244112233', sampleDeliveryOrder);

      expect(url).not.toBeNull();
      expect(url).toContain('https://wa.me/233244112233?text=');
      expect(url).toContain(encodeURIComponent('DISPATCH WAYBILL'));
    });

    it('handles phone with country code prefix', () => {
      const url = buildRiderWhatsAppShareUrl('+233205556677', sampleDeliveryOrder);

      expect(url).not.toBeNull();
      expect(url).toContain('https://wa.me/233205556677?text=');
    });

    it('returns null for invalid phone numbers', () => {
      expect(buildRiderWhatsAppShareUrl('12345', sampleDeliveryOrder)).toBeNull();
      expect(buildRiderWhatsAppShareUrl('', sampleDeliveryOrder)).toBeNull();
    });
  });
});
