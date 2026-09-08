import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

// Mock Supabase admin client
const mockInsert = vi.fn().mockResolvedValue({ error: null });
const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
const mockMaybeSingle = vi.fn();

const mockSupabase = {
  from: vi.fn().mockImplementation((table: string) => {
    if (table === 'payments') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: mockMaybeSingle,
        insert: mockInsert,
      };
    }
    if (table === 'orders') {
      return {
        update: mockUpdate,
      };
    }
    return {};
  }),
};

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => mockSupabase,
}));

// Mock paystack validation and pesewas conversion
vi.mock('@/lib/payments/paystack', () => ({
  validatePaystackSignature: vi.fn((_body: string, sig: string) => sig === 'valid-signature'),
  pesewasToGhs: vi.fn((p: number) => p / 100),
}));

// Mock dispatchPaymentConfirmationReceipt
vi.mock('@/lib/payments/confirmation', () => ({
  dispatchPaymentConfirmationReceipt: vi.fn().mockResolvedValue({ sent: true }),
}));

describe('POST /api/webhooks/paystack', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects request with missing signature header', async () => {
    const req = new NextRequest('http://localhost:3000/api/webhooks/paystack', {
      method: 'POST',
      body: JSON.stringify({ event: 'charge.success' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Missing x-paystack-signature header');
  });

  it('rejects request with invalid signature', async () => {
    const req = new NextRequest('http://localhost:3000/api/webhooks/paystack', {
      method: 'POST',
      headers: {
        'x-paystack-signature': 'invalid-signature',
      },
      body: JSON.stringify({ event: 'charge.success' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain('Invalid webhook signature');
  });

  it('processes store_order payment, updates order to paid, and dispatches receipt', async () => {
    const { dispatchPaymentConfirmationReceipt } = await import('@/lib/payments/confirmation');
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null }); // no existing payment

    const payload = {
      event: 'charge.success',
      data: {
        reference: 'ord_PST_12345',
        amount: 15000, // 150 GHS
        fees: 200, // 2 GHS
        channel: 'mobile_money',
        paid_at: new Date().toISOString(),
        customer: {
          first_name: 'Ama',
          last_name: 'Mensah',
          phone: '0241234567',
        },
        metadata: {
          type: 'store_order',
          orderId: 'order-uuid-999',
          tenantId: 'tenant-abc-123',
        },
      },
    };

    const req = new NextRequest('http://localhost:3000/api/webhooks/paystack', {
      method: 'POST',
      headers: {
        'x-paystack-signature': 'valid-signature',
      },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('success');
    expect(body.type).toBe('store_order');

    // Verifies payment was inserted
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: 'tenant-abc-123',
        order_id: 'order-uuid-999',
        provider: 'paystack',
        transaction_ref: 'ord_PST_12345',
        amount: 150,
        status: 'completed',
      })
    );

    // Verifies order status was updated to paid
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'paid',
      })
    );

    // Verifies automated WhatsApp receipt was dispatched
    expect(dispatchPaymentConfirmationReceipt).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'order-uuid-999',
        tenantId: 'tenant-abc-123',
        amount: 150,
        provider: 'paystack',
        transactionRef: 'ord_PST_12345',
        customerPhone: '0241234567',
        customerName: 'Ama Mensah',
      })
    );
  });

  it('skips processing if payment reference was already recorded (idempotent)', async () => {
    const { dispatchPaymentConfirmationReceipt } = await import('@/lib/payments/confirmation');
    mockMaybeSingle.mockResolvedValueOnce({ data: { id: 'existing-payment-id' }, error: null });

    const payload = {
      event: 'charge.success',
      data: {
        reference: 'ord_DUPLICATE_REF',
        amount: 10000,
        metadata: {
          type: 'store_order',
          orderId: 'order-uuid-1',
          tenantId: 'tenant-1',
        },
      },
    };

    const req = new NextRequest('http://localhost:3000/api/webhooks/paystack', {
      method: 'POST',
      headers: {
        'x-paystack-signature': 'valid-signature',
      },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('already_processed');
    expect(mockInsert).not.toHaveBeenCalled();
    expect(dispatchPaymentConfirmationReceipt).not.toHaveBeenCalled();
  });
});
