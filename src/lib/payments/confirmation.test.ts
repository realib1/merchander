import { describe, it, expect, vi } from 'vitest';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { dispatchPaymentConfirmationReceipt } from './confirmation';

// Mock resolveChannelIdentity
vi.mock('@/lib/channels/identity', () => ({
  resolveChannelIdentity: vi.fn().mockResolvedValue({
    id: 'identity-whatsapp-1',
    channel: 'whatsapp',
    channel_handle: '233241234567',
    profile_name: 'Kofi Mensah',
  }),
}));

// Mock sendOutboundWhatsAppMessage
vi.mock('@/lib/channels/whatsapp/service', () => ({
  sendOutboundWhatsAppMessage: vi.fn().mockResolvedValue({
    messages: [{ id: 'msg-receipt-999' }],
  }),
}));

describe('dispatchPaymentConfirmationReceipt', () => {
  it('successfully resolves customer, formats receipt, and dispatches outbound message', async () => {
    const mockOrder = {
      id: 'order-123',
      short_id: 'ORD-7788',
      customer_id: 'cust-1',
      customer: {
        id: 'cust-1',
        name: 'Kofi Mensah',
        phone: '0241234567',
      },
    };

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'orders') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: mockOrder, error: null }),
          };
        }
        if (table === 'storefront_settings') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: { slug: 'kofi-shop' }, error: null }),
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient<Database>;

    const res = await dispatchPaymentConfirmationReceipt({
      supabase: mockSupabase,
      tenantId: 'tenant-123',
      orderId: 'order-123',
      amount: 150.0,
      provider: 'hubtel',
      transactionRef: 'HUB-TXN-1234',
    });

    expect(res.sent).toBe(true);
    expect(res.messageId).toBe('msg-receipt-999');
  });

  it('skips dispatch gracefully when no customer phone is found', async () => {
    const mockOrder = {
      id: 'order-123',
      short_id: 'ORD-7788',
      customer_id: null,
      customer: null,
    };

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'orders') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: mockOrder, error: null }),
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient<Database>;

    const res = await dispatchPaymentConfirmationReceipt({
      supabase: mockSupabase,
      tenantId: 'tenant-123',
      orderId: 'order-123',
      amount: 50.0,
      provider: 'paystack',
      transactionRef: 'PST-999',
    });

    expect(res.sent).toBe(false);
    expect(res.reason).toBe('no_phone');
  });

  it('catches outbound dispatch errors without throwing', async () => {
    const { sendOutboundWhatsAppMessage } = await import('@/lib/channels/whatsapp/service');
    vi.mocked(sendOutboundWhatsAppMessage).mockRejectedValueOnce(new Error('WhatsApp Graph API Down'));

    const mockOrder = {
      id: 'order-123',
      short_id: 'ORD-7788',
      customer_id: 'cust-1',
      customer: {
        id: 'cust-1',
        name: 'Ama',
        phone: '0241234567',
      },
    };

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'orders') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: mockOrder, error: null }),
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient<Database>;

    const res = await dispatchPaymentConfirmationReceipt({
      supabase: mockSupabase,
      tenantId: 'tenant-123',
      orderId: 'order-123',
      amount: 200,
      provider: 'paystack',
      transactionRef: 'PST-ERR',
    });

    expect(res.sent).toBe(false);
    expect(res.error).toBe('WhatsApp Graph API Down');
  });
});
