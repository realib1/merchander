
import { getOrderPaymentLinkAction, sendOrderPaymentReminderAction } from './payments-online';

const mockGetUser = vi.fn();
const mockMaybeSingle = vi.fn();

const mockSupabase = {
  auth: {
    getUser: mockGetUser,
  },
  from: vi.fn().mockImplementation((table: string) => {
    if (table === 'orders') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: mockMaybeSingle,
      };
    }
    if (table === 'storefront_settings') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { slug: 'kofi-store' }, error: null }),
      };
    }
    return {};
  }),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockImplementation(() => Promise.resolve(mockSupabase)),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/supabase/queries', () => ({
  getTenantInfo: vi.fn().mockResolvedValue({ tenantId: 'tenant-123', role: 'owner' }),
}));

vi.mock('@/lib/intelligence/outreach', () => ({
  evaluateAndProcessOutreach: vi.fn().mockResolvedValue({
    success: true,
    status: 'dispatched',
    actionId: 'act-outreach-1',
    messageText: 'Payment reminder dispatched',
  }),
}));

describe('payments-online server actions for Feature 22', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOrderPaymentLinkAction', () => {
    it('returns error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } });
      const res = await getOrderPaymentLinkAction('order-1');
      expect(res.error).toBe('Not authenticated');
    });

    it('returns error when order is not found', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

      const res = await getOrderPaymentLinkAction('order-missing');
      expect(res.error).toBe('Order not found');
    });

    it('returns payment URL with store slug and shortId', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
      mockMaybeSingle.mockResolvedValueOnce({
        data: {
          id: 'order-123',
          short_id: 'ORD-9911',
          status: 'pending_payment',
          total_amount: 150,
          tenant_id: 'tenant-123',
        },
        error: null,
      });

      const res = await getOrderPaymentLinkAction('order-123');
      expect(res.success).toBe(true);
      expect(res.orderNumber).toBe('ORD-9911');
      expect(res.paymentUrl).toContain('/store/kofi-store/orders/ORD-9911?pay=true');
      expect(res.totalAmount).toBe(150);
    });
  });

  describe('sendOrderPaymentReminderAction', () => {
    it('returns error if order is already paid', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
      mockMaybeSingle.mockResolvedValueOnce({
        data: {
          id: 'order-paid',
          status: 'paid',
          tenant_id: 'tenant-123',
          customer: { phone: '0241234567', name: 'Ama' },
        },
        error: null,
      });

      const res = await sendOrderPaymentReminderAction({ orderId: 'order-paid' });
      expect(res.error).toBe('This order is already paid.');
    });

    it('returns error if customer has no phone number', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
      mockMaybeSingle.mockResolvedValueOnce({
        data: {
          id: 'order-no-phone',
          status: 'pending_payment',
          tenant_id: 'tenant-123',
          customer: { phone: null, name: 'Guest' },
        },
        error: null,
      });

      const res = await sendOrderPaymentReminderAction({ orderId: 'order-no-phone' });
      expect(res.error).toContain('Customer phone number is required');
    });

    it('evaluates and dispatches payment reminder for unpaid order', async () => {
      const { evaluateAndProcessOutreach } = await import('@/lib/intelligence/outreach');
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
      mockMaybeSingle.mockResolvedValueOnce({
        data: {
          id: 'order-valid',
          short_id: 'ORD-4455',
          status: 'pending_payment',
          total_amount: 220,
          tenant_id: 'tenant-123',
          customer_id: 'cust-1',
          customer: { phone: '0244000111', name: 'Kojo' },
        },
        error: null,
      });

      const res = await sendOrderPaymentReminderAction({
        orderId: 'order-valid',
        forceImmediate: true,
      });

      expect(res.success).toBe(true);
      expect(res.status).toBe('dispatched');
      expect(res.paymentUrl).toContain('/store/kofi-store/orders/ORD-4455?pay=true');
      expect(evaluateAndProcessOutreach).toHaveBeenCalledWith(
        expect.objectContaining({
          request: expect.objectContaining({
            triggerType: 'payment_reminder',
            orderId: 'order-valid',
            orderNumber: 'ORD-4455',
            customerPhone: '0244000111',
            totalAmount: 220,
            forceBypassQuietHours: true,
          }),
        })
      );
    });
  });
});
