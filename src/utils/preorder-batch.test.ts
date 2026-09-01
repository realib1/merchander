import { describe, it, expect } from 'vitest';
import {
  getBatchStatusLabel,
  getBatchStatusColor,
  getBatchCountdown,
  formatArrivalWindow,
  formatBatchMilestoneMessage,
} from './preorder-batch';
import { PreorderBatch, BatchBroadcastRecipient } from '@/types/preorder';
import { addDays, subDays } from 'date-fns';

describe('Preorder Batch Utilities', () => {
  it('returns correct status labels and colors', () => {
    expect(getBatchStatusLabel('OPEN')).toBe('Pre-Orders Open');
    expect(getBatchStatusLabel('ORDER_SUBMITTED')).toBe('Supplier Order Submitted');
    expect(getBatchStatusLabel('IN_TRANSIT')).toBe('In Transit / Cargo Shipped');
    expect(getBatchStatusLabel('ARRIVED')).toBe('Arrived at Local Hub');

    const colorOpen = getBatchStatusColor('OPEN');
    expect(colorOpen.bg).toContain('emerald');
  });

  it('calculates countdown accurately for open and closed batches', () => {
    const futureClose = addDays(new Date(), 5).toISOString();
    const countdownOpen = getBatchCountdown(futureClose);
    expect(countdownOpen.isClosed).toBe(false);
    expect(countdownOpen.daysLeft).toBeGreaterThanOrEqual(4);
    expect(countdownOpen.label).toContain('days left');

    const pastClose = subDays(new Date(), 2).toISOString();
    const countdownClosed = getBatchCountdown(pastClose);
    expect(countdownClosed.isClosed).toBe(true);
    expect(countdownClosed.label).toBe('Batch Closed');
  });

  it('formats arrival window date ranges properly', () => {
    expect(formatArrivalWindow('2026-10-15', '2026-10-22')).toBe('Oct 15–22');
    expect(formatArrivalWindow('2026-10-28', '2026-11-05')).toBe('Oct 28 – Nov 5');
  });

  it('formats WhatsApp broadcast milestone messages correctly', () => {
    const mockBatch: PreorderBatch = {
      id: 'batch-123',
      tenant_id: 'tenant-1',
      name: 'Batch A — Aug Wave',
      code: 'BATCH-A',
      status: 'IN_TRANSIT',
      opens_at: '2026-08-01T00:00:00Z',
      closes_at: '2026-08-14T23:59:59Z',
      expected_arrival_start: '2026-10-15',
      expected_arrival_end: '2026-10-22',
    };

    const recipient: BatchBroadcastRecipient = {
      orderId: 'order-1',
      orderShortId: '5YU4WH',
      customerName: 'Kwame Mensah',
      customerPhone: '+233241234567',
      itemsSummary: '1x Nike Air Max (Size 42)',
      trackingUrl: 'https://merchander.com/store/demo/orders/5YU4WH',
    };

    const msg = formatBatchMilestoneMessage(mockBatch, recipient, 'IN_TRANSIT');
    expect(msg).toContain('Kwame Mensah');
    expect(msg).toContain('Order #5YU4WH');
    expect(msg).toContain('Batch A — Aug Wave');
    expect(msg).toContain('Oct 15–22');
    expect(msg).toContain('https://merchander.com/store/demo/orders/5YU4WH');
  });
});
