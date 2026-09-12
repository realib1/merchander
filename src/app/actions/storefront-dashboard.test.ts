
import { getStorefrontOverview, updateFeaturedProductIds } from './storefront-dashboard';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/queries', () => ({
  getTenantInfo: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { getTenantInfo } from '@/lib/supabase/queries';

describe('storefront-dashboard server actions', () => {
  const mockTenantId = 'tenant-uuid-123';
  const mockUserId = 'user-uuid-456';

  beforeEach(() => {
    vi.clearAllMocks();
    (getTenantInfo as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      tenantId: mockTenantId,
      role: 'owner',
    });
  });

  it('returns null when user is not authenticated', async () => {
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    });

    const res = await getStorefrontOverview();
    expect(res).toBeNull();
  });

  it('correctly reports payment gateways as disconnected for unconfigured tenants', async () => {
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: mockUserId } } }),
      },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'products') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [] }),
          };
        }
        if (table === 'orders') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [] }),
          };
        }
        if (table === 'tenant_settings') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                store_currency: 'GHS',
                settings_data: {}, // no payment_settings
              },
            }),
          };
        }
        if (table === 'storefront_settings') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          };
        }
        return {};
      }),
    });

    const res = await getStorefrontOverview();
    expect(res).not.toBeNull();
    // Prior bug: isHubtelConnected was true due to ?? true fallback
    expect(res?.isHubtelConnected).toBe(false);
    expect(res?.isPaystackConnected).toBe(false);
  });

  it('correctly reports Hubtel and Paystack as connected when configured in payment_settings', async () => {
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: mockUserId } } }),
      },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'products') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: [
                {
                  id: 'prod-1',
                  name: 'Test Product',
                  image_urls: ['https://example.com/img.jpg'],
                  variants: [{ id: 'var-1', price: 100, inventory: [{ quantity: 5 }] }],
                },
              ],
            }),
          };
        }
        if (table === 'orders') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [{ id: 'ord-1', total_amount: 100, status: 'delivered', created_at: '2026-09-10' }],
            }),
          };
        }
        if (table === 'tenant_settings') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                store_currency: 'GHS',
                settings_data: {
                  payment_settings: {
                    providers: {
                      hubtel: { connected: true },
                      paystack: { connected: true },
                    },
                  },
                },
              },
            }),
          };
        }
        if (table === 'storefront_settings') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { featured_product_ids: ['prod-1'] },
            }),
          };
        }
        return {};
      }),
    });

    const res = await getStorefrontOverview();
    expect(res).not.toBeNull();
    expect(res?.isHubtelConnected).toBe(true);
    expect(res?.isPaystackConnected).toBe(true);
    expect(res?.productsCount).toBe(1);
    expect(res?.totalGmv).toBe(100);
    expect(res?.allProducts[0]?.isFeatured).toBe(true);
  });

  it('updates featured product ids successfully', async () => {
    const mockUpdateSf = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    const mockUpdateTenant = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: mockUserId } } }),
      },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'storefront_settings') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: 'sf-1', store_name: 'My Store', slug: 'my-store' },
                }),
              }),
            }),
            update: mockUpdateSf,
          };
        }
        if (table === 'tenant_settings') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { settings_data: {} },
                }),
              }),
            }),
            update: mockUpdateTenant,
          };
        }
        return {};
      }),
    });

    const res = await updateFeaturedProductIds(['prod-1', 'prod-2']);
    expect(res.success).toBe(true);
    expect(mockUpdateSf).toHaveBeenCalledWith({
      featured_product_ids: ['prod-1', 'prod-2'],
    });
  });
});
