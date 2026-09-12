
import {
  getRestockRecommendationsAction,
  createDraftPOFromRestockAction,
  getSupplierScorecardsAction,
  recordPODeliveryAction,
} from './intelligence-demand';

const mockGetUser = vi.fn();
const mockVariantsSelect = vi.fn();
const mockOrderItemsSelect = vi.fn();
const mockSuppliersSelect = vi.fn();
const mockPOsSelect = vi.fn();
const mockPOInsert = vi.fn();
const mockPOItemsInsert = vi.fn();
const mockPOUpdate = vi.fn();

const mockSupabase = {
  auth: {
    getUser: mockGetUser,
  },
  from: vi.fn().mockImplementation((table: string) => {
    if (table === 'tenant_users') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { tenant_id: 'tenant-123', role: 'owner' }, error: null }),
      };
    }

    if (table === 'product_variants') {
      return {
        select: mockVariantsSelect,
      };
    }

    if (table === 'order_items') {
      return {
        select: mockOrderItemsSelect,
      };
    }

    if (table === 'suppliers') {
      return {
        select: mockSuppliersSelect,
      };
    }

    if (table === 'purchase_orders') {
      return {
        select: mockPOsSelect,
        insert: mockPOInsert,
        update: mockPOUpdate,
      };
    }

    if (table === 'purchase_order_items') {
      return {
        insert: mockPOItemsInsert,
      };
    }

    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
  }),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockImplementation(() => Promise.resolve(mockSupabase)),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Demand & Supplier Intelligence Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRestockRecommendationsAction', () => {
    it('returns error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } });
      const res = await getRestockRecommendationsAction();
      expect(res.success).toBe(false);
      expect(res.error).toBe('Not authenticated');
    });

    it('returns empty list and summary when tenant has no products', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
      mockVariantsSelect.mockReturnValueOnce({
        eq: vi.fn().mockResolvedValueOnce({ data: [], error: null }),
      });

      const res = await getRestockRecommendationsAction();
      expect(res.success).toBe(true);
      expect(res.data?.recommendations).toEqual([]);
      expect(res.data?.summary.totalVariantsTracked).toBe(0);
    });

    it('calculates velocity and prioritizes critical stockout items', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });

      // 1 variant: 5 in stock, reorder point 15
      mockVariantsSelect.mockReturnValueOnce({
        eq: vi.fn().mockResolvedValueOnce({
          data: [
            {
              id: 'var-1',
              name: 'Large / Black',
              sku: 'BAG-L-BLK',
              price: 100,
              cost_price: 60,
              reorder_point: 15,
              reorder_quantity: 30,
              product: { id: 'prod-1', name: 'Leather Handbag', tenant_id: 'tenant-123' },
              inventory: [{ store_id: 'store-1', quantity: 5 }],
              supplier: {
                id: 'sup-1',
                name: 'Guangzhou Leather Factory',
                default_lead_days: 14,
                reliability_score: 95.0,
              },
            },
          ],
          error: null,
        }),
      });

      // 30 sales over past 30 days = 1 unit/day
      mockOrderItemsSelect.mockReturnValueOnce({
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValueOnce({
          data: [{ variant_id: 'var-1', quantity: 30, order: { status: 'delivered' } }],
          error: null,
        }),
      });

      const res = await getRestockRecommendationsAction();
      expect(res.success).toBe(true);
      expect(res.data?.recommendations.length).toBe(1);

      const rec = res.data?.recommendations[0];
      expect(rec?.variantId).toBe('var-1');
      expect(rec?.currentStock).toBe(5);
      expect(rec?.dailyVelocity).toBe(1);
      expect(rec?.daysOfStockRemaining).toBe(5);
      // days remaining (5) <= lead time (14) -> critical
      expect(rec?.healthStatus).toBe('critical');
      expect(rec?.suggestedReorderQuantity).toBe(30);
      expect(rec?.totalEstimatedCost).toBe(1800); // 30 * 60

      expect(res.data?.summary.criticalStockoutsCount).toBe(1);
    });
  });

  describe('createDraftPOFromRestockAction', () => {
    it('returns error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } });
      const res = await createDraftPOFromRestockAction({
        supplierId: 'sup-1',
        items: [{ variantId: 'var-1', quantity: 10, costPrice: 50 }],
      });
      expect(res.success).toBe(false);
      expect(res.error).toBe('Not authenticated');
    });

    it('creates draft PO and items successfully', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });

      // Supplier check
      mockSuppliersSelect.mockReturnValueOnce({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValueOnce({
              data: { id: 'sup-1', name: 'Yiwu Imports', default_lead_days: 20 },
              error: null,
            }),
          }),
        }),
      });

      // PO insert
      mockPOInsert.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValueOnce({
            data: { id: 'po-100', po_number: 'PO-1001' },
            error: null,
          }),
        }),
      });

      // Items insert
      mockPOItemsInsert.mockResolvedValueOnce({ error: null });

      const res = await createDraftPOFromRestockAction({
        supplierId: 'sup-1',
        items: [{ variantId: 'var-1', quantity: 25, costPrice: 40 }],
        notes: 'Urgent restock',
      });

      expect(res.success).toBe(true);
      expect(res.data?.purchaseOrderId).toBe('po-100');
      expect(res.data?.poNumber).toBe('PO-1001');
      expect(mockPOInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          supplier_id: 'sup-1',
          status: 'draft',
        })
      );
      expect(mockPOItemsInsert).toHaveBeenCalledWith([
        {
          purchase_order_id: 'po-100',
          variant_id: 'var-1',
          quantity: 25,
          cost_price: 40,
        },
      ]);
    });
  });

  describe('getSupplierScorecardsAction', () => {
    it('returns calculated scores, on-time rate, and grade for suppliers', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });

      mockSuppliersSelect.mockReturnValueOnce({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValueOnce({
            data: [
              {
                id: 'sup-1',
                name: 'Kofi Global Trading',
                country: 'Ghana',
                outstanding_balance: 500,
                default_lead_days: 14,
                reliability_score: 90,
              },
            ],
            error: null,
          }),
        }),
      });

      mockPOsSelect.mockReturnValueOnce({
        eq: vi.fn().mockResolvedValueOnce({
          data: [
            {
              id: 'po-1',
              supplier_id: 'sup-1',
              status: 'received',
              expected_delivery_date: '2026-09-01T00:00:00.000Z',
              actual_delivery_date: '2026-09-01T00:00:00.000Z',
              quality_rating: 5,
              defect_count: 0,
              items: [{ quantity: 50 }],
            },
          ],
          error: null,
        }),
      });

      const res = await getSupplierScorecardsAction();
      expect(res.success).toBe(true);
      expect(res.data?.scorecards.length).toBe(1);

      const sc = res.data?.scorecards[0];
      expect(sc?.supplierName).toBe('Kofi Global Trading');
      expect(sc?.onTimeDeliveryRate).toBe(100);
      expect(sc?.grade).toBe('A');
      expect(res.data?.summary.gradeACount).toBe(1);
    });
  });

  describe('recordPODeliveryAction', () => {
    it('updates PO with delivery date, rating, and defects', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });

      mockPOUpdate.mockReturnValueOnce({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValueOnce({
                data: { id: 'po-1', supplier_id: 'sup-1' },
                error: null,
              }),
            }),
          }),
        }),
      });

      const res = await recordPODeliveryAction({
        purchaseOrderId: 'po-1',
        actualDeliveryDate: '2026-09-10T00:00:00.000Z',
        qualityRating: 4,
        defectCount: 1,
      });

      expect(res.success).toBe(true);
      expect(res.data?.purchaseOrderId).toBe('po-1');
      expect(mockPOUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'received',
          actual_delivery_date: '2026-09-10T00:00:00.000Z',
          quality_rating: 4,
          defect_count: 1,
        })
      );
    });
  });
});
