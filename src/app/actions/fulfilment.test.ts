import { describe, it, expect, vi, beforeEach } from 'vitest';
import { assignOrderRiderAction, markOrderDeliveredAction } from './fulfilment';

const mockGetUser = vi.fn();
const mockSingle = vi.fn();
const mockUpdate = vi.fn();
const mockInsert = vi.fn();

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
    if (table === 'orders') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: mockSingle,
        update: mockUpdate.mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      };
    }
    if (table === 'messages') {
      return {
        insert: mockInsert.mockResolvedValue({ error: null }),
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

vi.mock('@/lib/channels/identity', () => ({
  resolveChannelIdentity: vi.fn().mockResolvedValue({ id: 'ident-456' }),
}));

const mockSendWhatsApp = vi.fn().mockResolvedValue({ success: true, messageId: 'wa-msg-1' });
vi.mock('@/lib/channels/whatsapp/service', () => ({
  sendOutboundWhatsAppMessage: (params: unknown) => mockSendWhatsApp(params),
}));

describe('fulfilment server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('assignOrderRiderAction', () => {
    it('returns error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } });
      const res = await assignOrderRiderAction({ orderId: 'ord-1' });
      expect(res.success).toBe(false);
      expect(res.error).toBe('Not authenticated');
    });

    it('returns error when order is not found', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
      mockSingle.mockResolvedValueOnce({ data: null, error: new Error('Not found') });

      const res = await assignOrderRiderAction({ orderId: 'ord-missing' });
      expect(res.success).toBe(false);
      expect(res.error).toBe('Order not found');
    });

    it('successfully assigns rider, marks dispatched, and notifies customer', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'ord-123',
          short_id: 'ORD-123',
          status: 'paid',
          customer: { id: 'cust-1', name: 'Ama Kofi', phone: '0244112233' },
          store: { name: 'Kofi Fashions' },
        },
        error: null,
      });

      const res = await assignOrderRiderAction({
        orderId: 'ord-123',
        riderName: 'Kwame Rider',
        riderPhone: '0201234567',
        courierName: 'Yango Delivery',
        trackingNumber: 'TRK-556',
        dispatchNotes: 'Leave at the gate',
      });

      expect(res.success).toBe(true);
      expect(res.data?.status).toBe('dispatched');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          rider_name: 'Kwame Rider',
          rider_phone: '+233201234567',
          courier_name: 'Yango Delivery',
          tracking_number: 'TRK-556',
          status: 'dispatched',
        })
      );
      expect(mockSendWhatsApp).toHaveBeenCalled();
    });

    it('handles pickup mode without rider phone', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'ord-456',
          short_id: 'ORD-456',
          status: 'paid',
          customer: { id: 'cust-2', name: 'Esi Doe', phone: '0559876543' },
          store: { name: 'Kofi Fashions' },
        },
        error: null,
      });

      const res = await assignOrderRiderAction({
        orderId: 'ord-456',
        fulfillmentMode: 'pickup',
        pickupStoreId: 'store-branch-2',
      });

      expect(res.success).toBe(true);
      expect(res.data?.status).toBe('dispatched');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          fulfillment_mode: 'pickup',
          pickup_store_id: 'store-branch-2',
          status: 'dispatched',
        })
      );
    });
  });

  describe('markOrderDeliveredAction', () => {
    it('returns error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } });
      const res = await markOrderDeliveredAction({ orderId: 'ord-1' });
      expect(res.success).toBe(false);
      expect(res.error).toBe('Not authenticated');
    });

    it('successfully transitions order to delivered and notifies customer', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'ord-123',
          short_id: 'ORD-123',
          status: 'dispatched',
          customer: { id: 'cust-1', name: 'Ama Kofi', phone: '0244112233' },
          store: { name: 'Kofi Fashions' },
        },
        error: null,
      });

      const res = await markOrderDeliveredAction({
        orderId: 'ord-123',
      });

      expect(res.success).toBe(true);
      expect(res.data?.status).toBe('delivered');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'delivered',
        })
      );
      expect(mockSendWhatsApp).toHaveBeenCalled();
    });
  });
});
