
import {
  isGhanaQuietHours,
  evaluateFrequencyCap,
  formatPaymentReminderMessage,
  formatBatchMilestoneMessage,
  formatBackInStockMessage,
  formatDeliveryUpdateMessage,
  classifyOutreachSafety,
} from './outreach';

describe('isGhanaQuietHours', () => {
  it('returns true during Ghana night hours (21:00 - 07:59 UTC)', () => {
    // 21:00 UTC (9:00 PM)
    const d21 = new Date('2026-09-08T21:00:00Z');
    expect(isGhanaQuietHours(d21)).toBe(true);

    // 23:30 UTC
    const d23 = new Date('2026-09-08T23:30:00Z');
    expect(isGhanaQuietHours(d23)).toBe(true);

    // 03:00 UTC (3:00 AM)
    const d03 = new Date('2026-09-08T03:00:00Z');
    expect(isGhanaQuietHours(d03)).toBe(true);

    // 07:59 UTC
    const d07 = new Date('2026-09-08T07:59:59Z');
    expect(isGhanaQuietHours(d07)).toBe(true);
  });

  it('returns false during Ghana business & day hours (08:00 - 20:59 UTC)', () => {
    // 08:00 UTC
    const d08 = new Date('2026-09-08T08:00:00Z');
    expect(isGhanaQuietHours(d08)).toBe(false);

    // 14:00 UTC (2:00 PM)
    const d14 = new Date('2026-09-08T14:00:00Z');
    expect(isGhanaQuietHours(d14)).toBe(false);

    // 20:59 UTC
    const d20 = new Date('2026-09-08T20:59:00Z');
    expect(isGhanaQuietHours(d20)).toBe(false);
  });
});

describe('evaluateFrequencyCap', () => {
  const baseNow = new Date('2026-09-08T12:00:00Z');

  it('allows outreach when customer has no prior contact history', () => {
    const res = evaluateFrequencyCap({
      lastContactedAt: null,
      messagesSentInLast24h: 0,
      totalRemindersSent: 0,
      now: baseNow,
    });
    expect(res.allowed).toBe(true);
    expect(res.reason).toBeUndefined();
  });

  it('blocks outreach when order reminder limit is reached', () => {
    const res = evaluateFrequencyCap({
      lastContactedAt: null,
      messagesSentInLast24h: 1,
      totalRemindersSent: 3,
      maxRemindersPerOrder: 3,
      now: baseNow,
    });
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain('Maximum reminder limit (3) reached');
  });

  it('blocks outreach when customer daily volume limit is reached', () => {
    const res = evaluateFrequencyCap({
      lastContactedAt: null,
      messagesSentInLast24h: 5,
      totalRemindersSent: 1,
      now: baseNow,
    });
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain('Daily message frequency cap');
  });

  it('blocks outreach when customer is still in cooldown window', () => {
    // Contacted 6 hours ago with a 24-hour cooldown
    const sixHoursAgo = new Date('2026-09-08T06:00:00Z');
    const res = evaluateFrequencyCap({
      lastContactedAt: sixHoursAgo,
      messagesSentInLast24h: 1,
      totalRemindersSent: 1,
      cooldownHours: 24,
      now: baseNow,
    });
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain('cooldown window');
    expect(res.nextAllowedAt).toEqual(new Date('2026-09-09T06:00:00Z'));
  });

  it('allows outreach when cooldown window has expired', () => {
    // Contacted 25 hours ago
    const yesterday = new Date('2026-09-07T11:00:00Z');
    const res = evaluateFrequencyCap({
      lastContactedAt: yesterday,
      messagesSentInLast24h: 1,
      totalRemindersSent: 1,
      cooldownHours: 24,
      now: baseNow,
    });
    expect(res.allowed).toBe(true);
  });
});

describe('formatPaymentReminderMessage', () => {
  it('formats friendly grounded payment reminder copy', () => {
    const msg = formatPaymentReminderMessage({
      customerName: 'Kofi Mensah',
      orderNumber: 'ORD-1042',
      totalAmount: 350,
      currency: 'GHS',
      itemsSummary: '2x Linen Shirts',
      storeName: 'Shero Apparel',
    });

    expect(msg).toContain('Hello Kofi Mensah!');
    expect(msg).toContain('Shero Apparel');
    expect(msg).toContain('#ORD-1042');
    expect(msg).toContain('GHS 350.00');
    expect(msg).toContain('Items: 2x Linen Shirts');
    expect(msg).toContain('Status: Pending Payment');
  });
});

describe('formatBatchMilestoneMessage', () => {
  it('formats pre-order batch milestone announcement copy', () => {
    const msg = formatBatchMilestoneMessage({
      customerName: 'Ama Boateng',
      batchName: 'Batch Sep-2026 Bags',
      milestone: 'IN_TRANSIT',
      expectedArrival: 'Sep 18 - Sep 22',
      trackingUrl: 'https://merchander.app/store/shero/orders/ORD-1042',
      storeName: 'Shero Boutique',
    });

    expect(msg).toContain('Hello Ama Boateng!');
    expect(msg).toContain('Batch Sep-2026 Bags');
    expect(msg).toContain('In Transit / Shipped');
    expect(msg).toContain('Sep 18 - Sep 22');
    expect(msg).toContain('https://merchander.app/store/shero/orders/ORD-1042');
  });
});

describe('formatBackInStockMessage', () => {
  it('formats back-in-stock notification copy for waitlisted customer', () => {
    const msg = formatBackInStockMessage({
      customerName: 'Kwame Osei',
      productName: 'Classic Leather Loafers',
      variantName: 'Brown / 42',
      price: 450,
      currency: 'GHS',
      storeUrl: 'https://merchander.app/store/shero/products/loafers',
      storeName: 'Shero Shoes',
    });

    expect(msg).toContain('Hello Kwame Osei!');
    expect(msg).toContain('Classic Leather Loafers (Brown / 42) is back in stock!');
    expect(msg).toContain('GHS 450.00');
    expect(msg).toContain('waitlist');
    expect(msg).toContain('https://merchander.app/store/shero/products/loafers');
  });
});

describe('formatDeliveryUpdateMessage', () => {
  it('formats delivery status update copy', () => {
    const msg = formatDeliveryUpdateMessage({
      customerName: 'Akosua Darko',
      orderNumber: 'ORD-1055',
      deliveryStatus: 'out_for_delivery',
      address: 'East Legon, Accra',
      trackingUrl: 'https://merchander.app/store/shero/orders/ORD-1055',
      storeName: 'Shero Mart',
    });

    expect(msg).toContain('Hello Akosua Darko!');
    expect(msg).toContain('order #ORD-1055');
    expect(msg).toContain('Out for Delivery');
    expect(msg).toContain('East Legon, Accra');
    expect(msg).toContain('https://merchander.app/store/shero/orders/ORD-1055');
  });
});

describe('classifyOutreachSafety', () => {
  it('classifies as Red when customer has an open dispute or human escalation', () => {
    const res = classifyOutreachSafety({
      triggerType: 'payment_reminder',
      hasUnresolvedIssue: true,
      confidence: 0.9,
    });
    expect(res.tier).toBe('red');
    expect(res.autoDispatch).toBe(false);
    expect(res.requiresHumanApproval).toBe(true);
    expect(res.escalationReason).toContain('dispute');
  });

  it('classifies as Red when AI confidence is very low (< 0.50)', () => {
    const res = classifyOutreachSafety({
      triggerType: 'delivery_update',
      confidence: 0.45,
    });
    expect(res.tier).toBe('red');
    expect(res.autoDispatch).toBe(false);
  });

  it('classifies as Yellow for bulk batch milestone broadcasts', () => {
    const res = classifyOutreachSafety({
      triggerType: 'batch_milestone',
      isBulk: true,
      confidence: 0.95,
    });
    expect(res.tier).toBe('yellow');
    expect(res.autoDispatch).toBe(false);
    expect(res.requiresHumanApproval).toBe(true);
    expect(res.escalationReason).toContain('Bulk batch broadcast');
  });

  it('classifies as Yellow for back-in-stock waitlist notifications', () => {
    const res = classifyOutreachSafety({
      triggerType: 'back_in_stock',
      confidence: 0.95,
    });
    expect(res.tier).toBe('yellow');
    expect(res.autoDispatch).toBe(false);
    expect(res.requiresHumanApproval).toBe(true);
    expect(res.escalationReason).toContain('Waitlist restock');
  });

  it('classifies as Yellow for high-value payment reminders (>= GHS 5000)', () => {
    const res = classifyOutreachSafety({
      triggerType: 'payment_reminder',
      totalAmount: 6500,
      confidence: 0.9,
    });
    expect(res.tier).toBe('yellow');
    expect(res.escalationReason).toContain('High-value');
  });

  it('classifies as Green for routine individual delivery updates with high confidence', () => {
    const res = classifyOutreachSafety({
      triggerType: 'delivery_update',
      isBulk: false,
      confidence: 0.95,
    });
    expect(res.tier).toBe('green');
    expect(res.autoDispatch).toBe(true);
    expect(res.requiresHumanApproval).toBe(false);
  });

  it('classifies as Green for standard low-value payment reminders with high confidence', () => {
    const res = classifyOutreachSafety({
      triggerType: 'payment_reminder',
      totalAmount: 250,
      confidence: 0.95,
    });
    expect(res.tier).toBe('green');
    expect(res.autoDispatch).toBe(true);
  });
});
