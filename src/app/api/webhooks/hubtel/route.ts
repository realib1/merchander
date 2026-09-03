import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateHubtelAuth } from '@/lib/payments/hubtel';

export async function POST(req: NextRequest) {
  // Authenticate before reading the body: an unauthenticated caller must not
  // reach any parsing or database path.
  if (!validateHubtelAuth(req.headers.get('authorization'))) {
    console.warn('Hubtel webhook authorization failed');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

    // Service role: a provider callback carries no user session, so the anon
    // client's RLS context would refuse every write here.
    const supabase = createAdminClient();
    const paymentRef = transactionId || clientReference;

    const { data: existingPayment, error: existingErr } = await supabase
      .from('payments')
      .select('id')
      .eq('transaction_ref', paymentRef)
      .maybeSingle();

    if (existingErr) {
      console.error('Hubtel webhook: failed to check for existing payment:', existingErr);
      return NextResponse.json({ error: 'Failed to verify payment idempotency' }, { status: 500 });
    }

    if (existingPayment) {
      return NextResponse.json({ status: 'already_processed', reference: clientReference }, { status: 200 });
    }

    // References are minted as ord_<short_id>_<suffix>. Match the short id
    // exactly: a prefix LIKE would let reference wildcards select any order.
    if (typeof clientReference !== 'string' || !clientReference.startsWith('ord_')) {
      return NextResponse.json({ error: 'Unrecognized client reference format' }, { status: 400 });
    }

    const orderShortId = clientReference.split('_')[1];
    if (!orderShortId) {
      return NextResponse.json({ error: 'Client reference is missing an order id' }, { status: 400 });
    }

    const { data: matchedOrder, error: orderErr } = await supabase
      .from('orders')
      .select('id, tenant_id')
      .eq('short_id', orderShortId)
      .maybeSingle();

    if (orderErr) {
      console.error('Hubtel webhook: failed to look up order:', orderErr);
      return NextResponse.json({ error: 'Failed to resolve order' }, { status: 500 });
    }

    if (!matchedOrder) {
      console.warn('Hubtel webhook: no order matches reference', clientReference);
      return NextResponse.json({ error: 'No order matches this client reference' }, { status: 404 });
    }

    const { error: paymentErr } = await supabase.from('payments').insert({
      tenant_id: matchedOrder.tenant_id,
      order_id: matchedOrder.id,
      provider: 'hubtel',
      transaction_ref: paymentRef,
      amount: amount,
      fee: 0,
      net_amount: amount,
      status: 'completed',
      sender_phone: data?.CustomerMsisdn || null,
      notes: 'Hubtel Mobile Money payment confirmed.',
      payment_date: new Date().toISOString(),
    });

    if (paymentErr) {
      console.error('Hubtel webhook: failed to record payment:', paymentErr);
      return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
    }

    const { error: statusErr } = await supabase
      .from('orders')
      .update({ status: 'processing' })
      .eq('id', matchedOrder.id);

    if (statusErr) {
      console.error('Hubtel webhook: payment recorded but order status update failed:', statusErr);
      return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
    }

    return NextResponse.json({ status: 'success', reference: clientReference }, { status: 200 });
  } catch (err) {
    console.error('Error in Hubtel webhook handler:', err);
    return NextResponse.json({ error: 'Internal server error processing Hubtel callback' }, { status: 500 });
  }
}
