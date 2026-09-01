import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    if (!rawBody) {
      return NextResponse.json({ error: 'Empty payload' }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const data = payload.Data || payload.data || payload;

    const responseCode = payload.ResponseCode || payload.responseCode || data?.ResponseCode;
    const clientReference = data?.ClientReference || data?.clientReference || payload.ClientReference;
    const transactionId = data?.TransactionId || data?.transactionId || payload.TransactionId || clientReference;
    const amount = Number(data?.Amount || data?.amount || payload.Amount || 0);

    const isSuccess = responseCode === '0000' || data?.Status === 'Success' || payload.Status === 'Success';

    if (!isSuccess) {
      return NextResponse.json({ status: 'ignored', message: 'Transaction not successful' }, { status: 200 });
    }

    if (!clientReference) {
      return NextResponse.json({ error: 'Missing client reference' }, { status: 400 });
    }

    const supabase = await createClient();

    // Idempotency check: Ensure payment reference hasn't been recorded already
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('transaction_ref', transactionId || clientReference)
      .single();

    if (existingPayment) {
      return NextResponse.json({ status: 'already_processed', reference: clientReference }, { status: 200 });
    }

    // Extract linked order ID from client reference (e.g. ord_a1b2c3d4_...)
    let orderId: string | null = null;
    let tenantId: string | null = null;

    if (clientReference.startsWith('ord_')) {
      const parts = clientReference.split('_');
      const orderShortId = parts[1];

      // Query order matching the short ID
      const { data: matchedOrder } = await supabase
        .from('orders')
        .select('id, tenant_id')
        .ilike('id', `${orderShortId}%`)
        .limit(1)
        .single();

      if (matchedOrder) {
        orderId = matchedOrder.id;
        tenantId = matchedOrder.tenant_id;
      }
    }

    if (tenantId) {
      await supabase.from('payments').insert({
        tenant_id: tenantId,
        order_id: orderId,
        provider: 'hubtel',
        transaction_ref: transactionId || clientReference,
        amount: amount,
        fee: 0,
        net_amount: amount,
        status: 'completed',
        sender_phone: data?.CustomerMsisdn || null,
        notes: 'Hubtel Mobile Money payment confirmed.',
        payment_date: new Date().toISOString(),
      });

      if (orderId) {
        await supabase
          .from('orders')
          .update({
            status: 'processing',
          })
          .eq('id', orderId);
      }
    }

    return NextResponse.json({ status: 'success', reference: clientReference }, { status: 200 });
  } catch (err) {
    console.error('Error in Hubtel webhook handler:', err);
    return NextResponse.json({ error: 'Internal server error processing Hubtel callback' }, { status: 500 });
  }
}
