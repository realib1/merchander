
import { getCustomerPageMetrics, getCustomerAttributionBreakdownAction } from './customers';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';

describe('Customer server actions resilience', () => {
  let mockSupabase: {
    auth: {
      getUser: ReturnType<typeof vi.fn>;
    };
    rpc: ReturnType<typeof vi.fn>;
    from: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'usr_test_123' } },
          error: null,
        }),
      },
      rpc: vi.fn(),
      from: vi.fn(),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as Awaited<ReturnType<typeof createClient>>);
  });

  describe('getCustomerPageMetrics', () => {
    it('returns guaranteed zeroes for all fields when database RPC returns null or empty object', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: null,
      });

      const metrics = await getCustomerPageMetrics();

      expect(metrics).toEqual({
        totalCustomers: 0,
        currentNewCustomers: 0,
        previousNewCustomers: 0,
        activeCustomers: 0,
        totalOrders: 0,
        currentOrders: 0,
        previousOrders: 0,
        totalRevenue: 0,
      });
    });

    it('safely parses stringified or partial numerical fields and coerces nulls to 0', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: {
          totalCustomers: '42',
          currentNewCustomers: null,
          previousNewCustomers: undefined,
          activeCustomers: 15,
          totalOrders: '100',
          currentOrders: 10,
          previousOrders: '5',
          totalRevenue: '1250.75',
        },
        error: null,
      });

      const metrics = await getCustomerPageMetrics();

      expect(metrics).toEqual({
        totalCustomers: 42,
        currentNewCustomers: 0,
        previousNewCustomers: 0,
        activeCustomers: 15,
        totalOrders: 100,
        currentOrders: 10,
        previousOrders: 5,
        totalRevenue: 1250.75,
      });
    });

    it('throws error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(getCustomerPageMetrics()).rejects.toThrow('Not authenticated');
    });

    it('throws error when RPC fails', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(getCustomerPageMetrics()).rejects.toThrow('Failed to fetch customer metrics');
    });
  });

  describe('getCustomerAttributionBreakdownAction', () => {
    it('returns zeroed safe fallback when user is unauthenticated or error occurs', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await getCustomerAttributionBreakdownAction();

      expect(result.totalAttributedCustomers).toBe(0);
      expect(result.topChannel).toBe('Direct Storefront');
      expect(result.channels.length).toBeGreaterThanOrEqual(3);
    });

    it('returns calculated attribution breakdown for authenticated tenant', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: { tenant_id: 't_test_1' },
        error: null,
      });

      const mockFrom = vi.fn((table: string) => {
        if (table === 'tenant_users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: mockSingle,
              }),
            }),
          };
        }
        if (table === 'customers') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [
                  { id: 'c1', first_touch_source: 'whatsapp' },
                  { id: 'c2', first_touch_source: 'whatsapp' },
                  { id: 'c3', first_touch_source: 'instagram' },
                ],
                error: null,
              }),
            }),
          };
        }
        if (table === 'orders') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                neq: vi.fn().mockResolvedValue({
                  data: [
                    { customer_id: 'c1', total_amount: 500, status: 'completed', attribution_source: 'whatsapp' },
                  ],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      mockSupabase.from = mockFrom;

      const result = await getCustomerAttributionBreakdownAction();

      expect(result.totalAttributedCustomers).toBe(3);
      expect(result.channels.find((c) => c.source === 'whatsapp')?.totalGmv).toBe(500);
      expect(result.topChannel).toBe('WhatsApp Catalog & Chat');
    });
  });
});
