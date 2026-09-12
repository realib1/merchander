
import { NextRequest } from 'next/server';
import { POST } from './route';

const mockInsert = vi.fn().mockResolvedValue({ error: null });
const updateChain = {
  eq: vi.fn().mockReturnThis(),
  then: (resolve: (val: unknown) => void) => resolve({ error: null })
};
const mockUpdate = vi.fn().mockReturnValue(updateChain);
const mockMaybeSinglePayment = vi.fn();
const mockMaybeSingleOrder = vi.fn();

const mockSupabase = {
  from: vi.fn().mockImplementation((table: string) => {
    if (table === 'payments') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: mockMaybeSinglePayment,
        insert: mockInsert,
      };
    }
    if (table === 'orders') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: mockMaybeSingleOrder,
        update: mockUpdate,
      };
    }
    return {};
  }),
};

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => mockSupabase,
}));

vi.mock('@/lib/payments/hubtel', () => ({
  validateHubtelAuth: vi.fn((authHeader: string | null) => authHeader === 'Basic valid-auth'),
  checkHubtelTransactionStatus: vi.fn().mockImplementation((ref: string) => {
    return Promise.resolve({
      responseCode: '0000',
      data: { amount: ref.includes('PARTIAL') ? 150.0 : 250.0 }
    });
  }),
}));

vi.mock('@/lib/payments/confirmation', () => ({
  dispatchPaymentConfirmationReceipt: vi.fn().mockResolvedValue({ sent: true }),
}));

describe('POST /api/webhooks/hubtel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthorized requests', async () => {
    const req = new NextRequest('http://localhost:3000/api/webhooks/hubtel', {
      method: 'POST',
      headers: {
        authorization: 'Basic invalid-auth',
      },
      body: JSON.stringify({ Status: 'Success' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('records payment, updates order to paid, and dispatches receipt', async () => {
    const { dispatchPaymentConfirmationReceipt } = await import('@/lib/payments/confirmation');
    mockMaybeSingleOrder.mockResolvedValueOnce({
      data: { id: 'order-1234', tenant_id: 'tenant-555', total_amount: 250.0 },
      error: null,
    });
    mockMaybeSinglePayment.mockResolvedValueOnce({ data: null, error: null }); // no existing payment

    const payload = {
      ResponseCode: '0000',
      Status: 'Success',
      Data: {
        ClientReference: 'ord_ORD-8821_suffix',
        TransactionId: 'HUB-TXN-9988',
        Amount: 250.0,
        CustomerMsisdn: '0244123456',
      },
    };

    const req = new NextRequest('http://localhost:3000/api/webhooks/hubtel', {
      method: 'POST',
      headers: {
        authorization: 'Basic valid-auth',
      },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('success');

    // Verifies payment was inserted
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: 'tenant-555',
        order_id: 'order-1234',
        provider: 'hubtel',
        transaction_ref: 'HUB-TXN-9988',
        amount: 250.0,
        status: 'completed',
        sender_phone: '0244123456',
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
        orderId: 'order-1234',
        tenantId: 'tenant-555',
        amount: 250.0,
        provider: 'hubtel',
        transactionRef: 'HUB-TXN-9988',
        customerPhone: '0244123456',
      })
    );
  });

  it('skips duplicate payment callbacks idempotently', async () => {
    mockMaybeSingleOrder.mockResolvedValueOnce({ data: { id: 'order-dup', tenant_id: 'tenant-1' }, error: null });
    mockMaybeSinglePayment.mockResolvedValueOnce({ data: { id: 'existing-payment' }, error: null });

    const payload = {
      ResponseCode: '0000',
      Status: 'Success',
      Data: {
        ClientReference: 'ord_ORD-DUPLICATE_suffix',
        TransactionId: 'HUB-TXN-DUP',
        Amount: 100,
      },
    };

    const req = new NextRequest('http://localhost:3000/api/webhooks/hubtel', {
      method: 'POST',
      headers: {
        authorization: 'Basic valid-auth',
      },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('already_processed');
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('does not update order status if payment amount is less than total_amount', async () => {
    mockMaybeSingleOrder.mockResolvedValueOnce({
      data: { id: 'order-partial', tenant_id: 'tenant-555', total_amount: 500.0 },
      error: null,
    });
    mockMaybeSinglePayment.mockResolvedValueOnce({ data: null, error: null });

    const payload = {
      ResponseCode: '0000',
      Status: 'Success',
      Data: {
        ClientReference: 'ord_ORD-PARTIAL_suffix',
        TransactionId: 'HUB-TXN-PARTIAL',
        Amount: 150.0,
      },
    };

    const req = new NextRequest('http://localhost:3000/api/webhooks/hubtel', {
      method: 'POST',
      headers: {
        authorization: 'Basic valid-auth',
      },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('success');

    // Payment still inserted
    expect(mockInsert).toHaveBeenCalled();
    // But update not called
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
