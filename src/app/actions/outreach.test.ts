
import {
  scanPendingPaymentRemindersAction,
  broadcastBatchMilestoneAction,
  notifyBackInStockAction,
  sendOrderDeliveryUpdateAction,
} from './outreach';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/queries', () => ({
  getTenantInfo: vi.fn(),
}));

vi.mock('@/lib/intelligence/outreach', () => ({
  evaluateAndProcessOutreach: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { getTenantInfo } from '@/lib/supabase/queries';
import { evaluateAndProcessOutreach } from '@/lib/intelligence/outreach';

describe('Outreach Server Actions', () => {
  const mockTenantId = 'tenant-uuid-123';
  const mockUserId = 'user-uuid-456';

  beforeEach(() => {
    vi.clearAllMocks();
    (getTenantInfo as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      tenantId: mockTenantId,
    });
  });

  describe('scanPendingPaymentRemindersAction', () => {
    it('returns unauthorized when user is not signed in', async () => {
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
      });

      const res = await scanPendingPaymentRemindersAction();
      expect(res.success).toBe(false);
      expect(res.error).toBe('Unauthorized');
    });

    it('scans eligible orders and triggers outreach evaluation', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          order_number: 'ORD-101',
          total_amount: 250,
          customer_id: 'cust-1',
          customer_name: 'Kofi Mensah',
          customer_phone: '0241234567',
          created_at: '2026-09-06T10:00:00Z',
        },
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const chain: Record<string, any> = {};
      chain.select = vi.fn().mockReturnValue(chain);
      chain.eq = vi.fn().mockReturnValue(chain);
      chain.lte = vi.fn().mockReturnValue(chain);
      chain.order = vi.fn().mockResolvedValue({ data: mockOrders, error: null });
      chain.maybeSingle = vi.fn().mockResolvedValue({
        data: { store_name: 'Shero Store', store_currency: 'GHS' },
      });

      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: mockUserId } } }),
        },
        from: vi.fn().mockReturnValue(chain),
      });

      (evaluateAndProcessOutreach as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        status: 'queued',
        tier: 'yellow',
        actionId: 'action-uuid-1',
      });

      const res = await scanPendingPaymentRemindersAction({ minAgeHours: 24, forceBypassQuietHours: true });
      expect(res.success).toBe(true);
      expect(res.scannedCount).toBe(1);
      expect(res.processedCount).toBe(1);
      expect(evaluateAndProcessOutreach).toHaveBeenCalledWith(
        expect.objectContaining({
          request: expect.objectContaining({
            triggerType: 'payment_reminder',
            orderId: 'order-1',
            orderNumber: 'ORD-101',
          }),
        })
      );
    });
  });

  describe('broadcastBatchMilestoneAction', () => {
    it('returns error when batch does not exist', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const chain: Record<string, any> = {};
      chain.select = vi.fn().mockReturnValue(chain);
      chain.eq = vi.fn().mockReturnValue(chain);
      chain.single = vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } });

      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: mockUserId } } }),
        },
        from: vi.fn().mockReturnValue(chain),
      });

      const res = await broadcastBatchMilestoneAction({ batchId: 'non-existent', milestone: 'IN_TRANSIT' });
      expect(res.success).toBe(false);
      expect(res.error).toContain('not found');
    });

    it('triggers batch milestone evaluation for all batch recipients', async () => {
      const mockBatch = {
        id: 'batch-1',
        name: 'Batch Sep Bags',
        code: 'SEP-BAGS',
        expected_arrival_start: '2026-09-18',
        expected_arrival_end: '2026-09-22',
      };

      const mockOrders = [
        {
          id: 'ord-10',
          order_number: 'ORD-10',
          customer_id: 'cust-10',
          customer_name: 'Ama Boateng',
          customer_phone: '0501234567',
        },
      ];

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const chain: Record<string, any> = {};
        chain.select = vi.fn().mockReturnValue(chain);
        chain.eq = vi.fn().mockReturnValue(chain);
        if (table === 'preorder_batches') {
          chain.single = vi.fn().mockResolvedValue({ data: mockBatch, error: null });
        } else if (table === 'orders') {
          chain.eq = vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: mockOrders, error: null }),
          });
        } else if (table === 'tenant_settings') {
          chain.maybeSingle = vi.fn().mockResolvedValue({ data: { store_name: 'Shero Mart', slug: 'shero' } });
        }
        return chain;
      });

      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: mockUserId } } }),
        },
        from: mockFrom,
      });

      (evaluateAndProcessOutreach as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        status: 'queued',
        tier: 'yellow',
      });

      const res = await broadcastBatchMilestoneAction({
        batchId: 'batch-1',
        milestone: 'IN_TRANSIT',
        forceBypassQuietHours: true,
      });

      expect(res.success).toBe(true);
      expect(res.recipientCount).toBe(1);
      expect(evaluateAndProcessOutreach).toHaveBeenCalledWith(
        expect.objectContaining({
          request: expect.objectContaining({
            triggerType: 'batch_milestone',
            batchId: 'batch-1',
            milestone: 'IN_TRANSIT',
          }),
        })
      );
    });
  });

  describe('notifyBackInStockAction', () => {
    it('evaluates back in stock alerts for waiting customers', async () => {
      const mockVariant = {
        id: 'var-1',
        name: 'Red / Large',
        price: 220,
        product: { id: 'prod-1', name: 'Silk Dress' },
      };

      const mockWaitlist = [
        {
          id: 'wait-1',
          customer_name: 'Akosua Darko',
          phone: '0241112233',
          status: 'waiting',
        },
      ];

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const chain: Record<string, any> = {};
        chain.select = vi.fn().mockReturnValue(chain);
        chain.eq = vi.fn().mockReturnValue(chain);
        chain.update = vi.fn().mockReturnValue(chain);

        if (table === 'product_variants') {
          chain.single = vi.fn().mockResolvedValue({ data: mockVariant, error: null });
        } else if (table === 'product_waitlist') {
          chain.eq = vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: mockWaitlist, error: null }),
            }),
          });
        } else if (table === 'tenant_settings') {
          chain.maybeSingle = vi.fn().mockResolvedValue({
            data: { store_name: 'Shero Boutique', store_currency: 'GHS', slug: 'shero' },
          });
        }
        return chain;
      });

      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: mockUserId } } }),
        },
        from: mockFrom,
      });

      (evaluateAndProcessOutreach as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        status: 'dispatched',
        tier: 'green',
      });

      const res = await notifyBackInStockAction({ variantId: 'var-1', forceBypassQuietHours: true });
      expect(res.success).toBe(true);
      expect(res.waitlistCount).toBe(1);
      expect(evaluateAndProcessOutreach).toHaveBeenCalledWith(
        expect.objectContaining({
          request: expect.objectContaining({
            triggerType: 'back_in_stock',
            variantId: 'var-1',
            productName: 'Silk Dress',
          }),
        })
      );
    });
  });

  describe('sendOrderDeliveryUpdateAction', () => {
    it('sends delivery status update for an order', async () => {
      const mockOrder = {
        id: 'ord-99',
        order_number: 'ORD-99',
        customer_id: 'cust-99',
        customer_name: 'Kwesi Appiah',
        customer_phone: '0245556677',
        delivery_address: 'Spintex Road, Accra',
      };

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const chain: Record<string, any> = {};
        chain.select = vi.fn().mockReturnValue(chain);
        chain.eq = vi.fn().mockReturnValue(chain);
        if (table === 'orders') {
          chain.single = vi.fn().mockResolvedValue({ data: mockOrder, error: null });
        } else if (table === 'tenant_settings') {
          chain.maybeSingle = vi.fn().mockResolvedValue({ data: { store_name: 'Shero', slug: 'shero' } });
        }
        return chain;
      });

      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: mockUserId } } }),
        },
        from: mockFrom,
      });

      (evaluateAndProcessOutreach as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        status: 'dispatched',
        tier: 'green',
      });

      const res = await sendOrderDeliveryUpdateAction({
        orderId: 'ord-99',
        deliveryStatus: 'out_for_delivery',
        forceBypassQuietHours: true,
      });

      expect(res.success).toBe(true);
      expect(res.result?.status).toBe('dispatched');
    });
  });
});
