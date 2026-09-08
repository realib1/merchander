import { describe, it, expect, vi } from 'vitest';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { captureDraftOrderFromCart } from './orders';

describe('captureDraftOrderFromCart', () => {
  it('fails gracefully when items array is empty', async () => {
    const mockSupabase = {} as unknown as SupabaseClient<Database>;
    const result = await captureDraftOrderFromCart({
      supabase: mockSupabase,
      tenantId: 'tenant-123',
      customerPhone: '0241234567',
      items: [],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe('no_items');
    }
  });

  it('fails gracefully when no store exists for the tenant', async () => {
    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'stores') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient<Database>;

    const result = await captureDraftOrderFromCart({
      supabase: mockSupabase,
      tenantId: 'tenant-123',
      customerPhone: '0241234567',
      items: [{ sku: 'SKU-1', quantity: 1 }],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe('no_store');
    }
  });

  it('successfully captures a draft order with grounded pricing and stock check', async () => {
    const mockStore = { id: 'store-1', name: 'Osu Flagship Store' };
    const mockVariant = {
      id: 'var-10',
      sku: 'KENTE-M',
      name: 'Medium',
      price: 180,
      product: {
        id: 'prod-1',
        name: 'Kente Cloth',
        tenant_id: 'tenant-123',
        availability_status: 'available',
      },
      inventory_levels: [{ store_id: 'store-1', quantity: 8 }],
    };

    const mockCustomer = { id: 'cust-99' };
    const mockOrder = { id: 'order-abc-123', short_id: 'ORD-5501' };

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'stores') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: mockStore, error: null }),
          };
        }
        if (table === 'storefront_settings') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: { slug: 'osu-flagship' }, error: null }),
          };
        }
        if (table === 'product_variants') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({ data: [mockVariant], error: null }),
          };
        }
        if (table === 'customers') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: mockCustomer, error: null }),
          };
        }
        if (table === 'orders') {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockOrder, error: null }),
          };
        }
        if (table === 'order_items') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient<Database>;

    const result = await captureDraftOrderFromCart({
      supabase: mockSupabase,
      tenantId: 'tenant-123',
      customerId: 'cust-99',
      customerPhone: '0241234567',
      customerName: 'Kofi Mensah',
      items: [{ sku: 'KENTE-M', quantity: 2 }],
      deliveryFee: 20,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.orderId).toBe('order-abc-123');
      expect(result.orderNumber).toBe('ORD-5501');
      expect(result.totalAmount).toBe(380); // 180 * 2 + 20
      expect(result.subtotal).toBe(360);
      expect(result.deliveryFee).toBe(20);
      expect(result.hasStockDeficit).toBe(false);
      expect(result.paymentUrl).toContain('/store/osu-flagship/orders/ORD-5501?pay=true');
      expect(result.proposedReplyText).toContain('Hello Kofi Mensah! 🎉');
      expect(result.proposedReplyText).toContain('ORD-5501');
      expect(result.proposedReplyText).toContain('Total Amount: GHS 380.00');
      expect(result.proposedReplyText).toContain('👉 Complete payment securely here:');
      expect(result.proposedReplyText).toContain('/store/osu-flagship/orders/ORD-5501?pay=true');
      expect(result.groundedFacts).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Draft Order #ORD-5501 created'),
          expect.stringContaining('Payment link:'),
        ])
      );
      expect(result.customerAssuranceNotice).toContain("We've received your order request!");
    }
  });

  it('fails with no_matching_variants when requested SKU is not in catalog', async () => {
    const mockStore = { id: 'store-1', name: 'Osu Store' };

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'stores') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: mockStore, error: null }),
          };
        }
        if (table === 'product_variants') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient<Database>;

    const result = await captureDraftOrderFromCart({
      supabase: mockSupabase,
      tenantId: 'tenant-123',
      customerPhone: '0241234567',
      items: [{ sku: 'NONEXISTENT-SKU', quantity: 1 }],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe('no_matching_variants');
      expect(result.unmatchedSkus).toContain('NONEXISTENT-SKU');
    }
  });
});
