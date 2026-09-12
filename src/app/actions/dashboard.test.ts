
import { getDashboardMetrics } from './dashboard';

const mockGetUser = vi.fn();
const mockRpc = vi.fn();

// Tables
const mockTenantUsersSelect = vi.fn();
const mockTenantSettingsSelect = vi.fn();
const mockPurchaseOrdersSelect = vi.fn();
const mockInventoryLevelsSelect = vi.fn();
const mockSuppliersSelect = vi.fn();
const mockOrderItemsSelect = vi.fn();

const mockSupabase = {
  auth: {
    getUser: mockGetUser,
  },
  rpc: mockRpc,
  from: vi.fn().mockImplementation((table: string) => {
    if (table === 'tenant_users') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: mockTenantUsersSelect,
          }),
        }),
      };
    }

    if (table === 'tenant_settings') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: mockTenantSettingsSelect,
          }),
        }),
      };
    }

    if (table === 'purchase_orders') {
      return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: mockPurchaseOrdersSelect,
            }),
          }),
        }),
      };
    }

    if (table === 'inventory_levels') {
      return {
        select: mockInventoryLevelsSelect,
      };
    }

    if (table === 'suppliers') {
      return {
        select: vi.fn().mockReturnValue({
          gt: vi.fn().mockReturnValue({
            limit: mockSuppliersSelect,
          }),
        }),
      };
    }

    if (table === 'order_items') {
      return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              in: mockOrderItemsSelect,
            }),
          }),
        }),
      };
    }

    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
  }),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockImplementation(() => Promise.resolve(mockSupabase)),
}));

describe('getDashboardMetrics Action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws an error if user is not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });

    await expect(getDashboardMetrics('today')).rejects.toThrow('Not authenticated');
  });

  it('returns empty dashboard and fallback intelligence if no tenant_user found', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'usr-1' } } });
    mockTenantUsersSelect.mockResolvedValueOnce({ data: null, error: null });

    const result = await getDashboardMetrics('today');
    expect(result.totalSales.value).toBe(0);
    expect(result.intelligence.velocityInsight).toBe('No store data found for this account.');
  });

  it('evaluates fresh onboarding merchant properly', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'usr-1' } } });
    mockTenantUsersSelect.mockResolvedValueOnce({ data: { tenant_id: 'tenant-1' }, error: null });
    mockTenantSettingsSelect.mockResolvedValueOnce({
      data: { low_stock_threshold: 10, store_currency: 'GHS' },
      error: null,
    });

    mockRpc.mockResolvedValueOnce({
      data: {
        current_sales: 0,
        previous_sales: 0,
        current_orders: 0,
        previous_orders: 0,
        current_cost: 0,
        previous_cost: 0,
        current_customers: 0,
        total_customers: 0,
        sales_chart: [],
        top_products: [],
      },
      error: null,
    });

    mockPurchaseOrdersSelect.mockResolvedValueOnce({ data: [], error: null });

    // Inventory queries in Promise.all
    mockInventoryLevelsSelect
      .mockReturnValueOnce({
        lt: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce({ data: [], error: null }),
          }),
        }),
      })
      .mockResolvedValueOnce({ count: 0, error: null }) // totalTrackedVariants
      .mockReturnValueOnce({
        lte: vi.fn().mockResolvedValueOnce({ count: 0, error: null }), // outOfStockCount
      });

    mockSuppliersSelect.mockResolvedValueOnce({ data: [], error: null });

    const result = await getDashboardMetrics('30d');

    expect(result.currency).toBe('GHS');
    expect(result.intelligence.velocityInsight).toContain('Welcome to Merchander!');
    expect(result.intelligence.recommendation).toContain('Add your first products in Catalog');
  });

  it('handles zero sales velocity on low-stock items without fabricating velocity', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'usr-1' } } });
    mockTenantUsersSelect.mockResolvedValueOnce({ data: { tenant_id: 'tenant-1' }, error: null });
    mockTenantSettingsSelect.mockResolvedValueOnce({
      data: { low_stock_threshold: 10, store_currency: 'USD' },
      error: null,
    });

    mockRpc.mockResolvedValueOnce({
      data: {
        current_sales: 100,
        previous_sales: 50,
        current_orders: 5,
        previous_orders: 2,
        current_cost: 40,
        previous_cost: 20,
        current_customers: 3,
        total_customers: 10,
        sales_chart: [],
        top_products: [],
      },
      error: null,
    });

    mockPurchaseOrdersSelect.mockResolvedValueOnce({ data: [], error: null });

    // Low stock items: 1 variant with 3 units remaining, but 0 sales
    mockInventoryLevelsSelect
      .mockReturnValueOnce({
        lt: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce({
              data: [
                {
                  quantity: 3,
                  product_variants: {
                    id: 'var-1',
                    sku: 'VAR-1',
                    name: 'Large',
                    products: { name: 'Kente Cloth' },
                  },
                },
              ],
              error: null,
            }),
          }),
        }),
      })
      .mockResolvedValueOnce({ count: 15, error: null }) // totalTrackedVariants
      .mockReturnValueOnce({
        lte: vi.fn().mockResolvedValueOnce({ count: 0, error: null }), // outOfStockCount
      });

    mockSuppliersSelect.mockResolvedValueOnce({ data: [], error: null });

    // Sales query for variant - zero sales
    mockOrderItemsSelect.mockResolvedValueOnce({ data: [], error: null });

    const result = await getDashboardMetrics('30d');

    expect(result.attention.lowStock[0].avgWeeklySales).toBe(0);
    expect(result.intelligence.velocityInsight).toContain('with no orders recorded in the last 30 days');
    expect(result.intelligence.supplyInsight[0]).toContain('No active purchase orders or shipments');
    expect(result.intelligence.recommendation).toContain('Place a purchase order for Kente Cloth');
  });

  it('correctly incorporates incoming purchase orders when stock is stable', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'usr-1' } } });
    mockTenantUsersSelect.mockResolvedValueOnce({ data: { tenant_id: 'tenant-1' }, error: null });
    mockTenantSettingsSelect.mockResolvedValueOnce({
      data: { low_stock_threshold: 5, store_currency: 'GHS' },
      error: null,
    });

    mockRpc.mockResolvedValueOnce({
      data: {
        current_sales: 500,
        previous_sales: 400,
        current_orders: 15,
        previous_orders: 12,
        current_cost: 200,
        previous_cost: 150,
        current_customers: 8,
        total_customers: 25,
        sales_chart: [],
        top_products: [],
      },
      error: null,
    });

    // In-transit PO with 150 units from Guangzhou
    mockPurchaseOrdersSelect.mockResolvedValueOnce({
      data: [
        {
          id: 'po-99',
          po_number: 'PO-2026-0099',
          tracking_number: 'TRK-12345',
          status: 'ordered',
          eta: '2026-09-25T00:00:00Z',
          suppliers: { name: 'Guangzhou Textiles', country: 'China' },
          purchase_order_items: [{ quantity: 150 }],
        },
      ],
      error: null,
    });

    // No low-stock items
    mockInventoryLevelsSelect
      .mockReturnValueOnce({
        lt: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce({ data: [], error: null }),
          }),
        }),
      })
      .mockResolvedValueOnce({ count: 20, error: null }) // totalTrackedVariants
      .mockReturnValueOnce({
        lte: vi.fn().mockResolvedValueOnce({ count: 0, error: null }), // outOfStockCount
      });

    mockSuppliersSelect.mockResolvedValueOnce({ data: [], error: null });

    const result = await getDashboardMetrics('7d');

    expect(result.attention.purchaseOrders.length).toBe(1);
    expect(result.intelligence.supplyInsight[0]).toContain('All 20 tracked catalog variants are stocked above minimum threshold');
    expect(result.intelligence.supplyInsight[1]).toContain('150 units total');
    expect(result.intelligence.recommendation).toContain('Track incoming shipment (PO-2026-0099)');
  });
});
