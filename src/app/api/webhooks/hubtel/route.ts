import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateHubtelAuth } from '@/lib/payments/hubtel';
import { dispatchPaymentConfirmationReceipt } from '@/lib/payments/confirmation';
import { decryptSecret, isEncrypted } from '@/utils/encryption';
import { PaymentSettings } from '@/types/settings';

async function resolveHubtelCredentials(
  tenantId: string
): Promise<{ clientId?: string; clientSecret?: string }> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('tenant_settings')
      .select('settings_data')
      .eq('tenant_id', tenantId)
      .maybeSingle();
    const payments = (data?.settings_data as Record<string, unknown> | null)?.payment_settings as
      Partial<PaymentSettings> | undefined;
    const config = payments?.providers?.hubtel;
    if (!config) return {};
    const rawId = config.publicKey;
    const rawSecret = config.secretKey;
    return {
      clientId: rawId || undefined,
      clientSecret: rawSecret
        ? isEncrypted(rawSecret) ? decryptSecret(rawSecret) : rawSecret
        : undefined,
    };
  } catch {
    return {};
  }
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');

  try {
    const rawBody = await req.text();
    if (!rawBody) {
      return NextResponse.json({ error: 'Empty payload' }, { status: 400 });
    }

    let isAuthorized = validateHubtelAuth(authHeader);

    const payload = JSON.parse(rawBody);
    const data = payload.Data || payload.data || payload;

    const responseCode = payload.ResponseCode || payload.responseCode || data?.ResponseCode;
    const clientReference = data?.ClientReference || data?.clientReference || payload.ClientReference;
    const transactionId = data?.TransactionId || data?.transactionId || payload.TransactionId || clientReference;
    const amount = Number(data?.Amount || data?.amount || payload.Amount || 0);

    const supabase = createAdminClient();

    let matchedOrder = null;

    if (clientReference && typeof clientReference === 'string' && clientReference.startsWith('ord_')) {
      const orderShortId = clientReference.split('_')[1];
      if (orderShortId) {
        const { data, error: orderErr } = await supabase
          .from('orders')
          .select('id, tenant_id, total_amount')
          .eq('short_id', orderShortId)
          .maybeSingle();
        
        if (orderErr) {
          console.error('Hubtel webhook: failed to look up order:', orderErr);
          return NextResponse.json({ error: 'Failed to resolve order' }, { status: 500 });
        }
        matchedOrder = data;

        if (!isAuthorized && matchedOrder?.tenant_id) {
          const creds = await resolveHubtelCredentials(matchedOrder.tenant_id);
          if (creds.clientId && creds.clientSecret) {
            isAuthorized = validateHubtelAuth(authHeader, creds.clientId, creds.clientSecret);
          }
        }
      }
    }

    if (!isAuthorized) {
      console.warn('Hubtel webhook authorization failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isSuccess = responseCode === '0000' || data?.Status === 'Success' || payload.Status === 'Success';

    if (!isSuccess) {
      return NextResponse.json({ status: 'ignored', message: 'Transaction not successful' }, { status: 200 });
    }

    if (!clientReference) {
      return NextResponse.json({ error: 'Missing client reference' }, { status: 400 });
    }

    if (!matchedOrder) {
      console.warn('Hubtel webhook: no order matches reference', clientReference);
      return NextResponse.json({ error: 'No order matches this client reference' }, { status: 404 });
    }

    const paymentRef = transactionId || clientReference;

    const { data: existingPayment, error: existingErr } = await supabase
      .from('payments')
      .select('id')
      .eq('transaction_ref', paymentRef)
      .eq('tenant_id', matchedOrder.tenant_id)
      .maybeSingle();

    if (existingErr) {
      console.error('Hubtel webhook: failed to check for existing payment:', existingErr);
      return NextResponse.json({ error: 'Failed to verify payment idempotency' }, { status: 500 });
    }

    if (existingPayment) {
      return NextResponse.json({ status: 'already_processed', reference: clientReference }, { status: 200 });
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

    if (amount >= matchedOrder.total_amount) {
      const { error: statusErr } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          updated_at: new Date().toISOString(),
        })
        .eq('id', matchedOrder.id)
        .eq('tenant_id', matchedOrder.tenant_id);

      if (statusErr) {
        console.error('Hubtel webhook: payment recorded but order status update failed:', statusErr);
        return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
      }
    } else {
      console.warn(`Hubtel webhook: partial payment received (${amount} < ${matchedOrder.total_amount}). Status not updated.`);
    }

    // Dispatch automated WhatsApp payment confirmation receipt
    await dispatchPaymentConfirmationReceipt({
      supabase,
      tenantId: matchedOrder.tenant_id,
      orderId: matchedOrder.id,
      amount,
      provider: 'hubtel',
      transactionRef: paymentRef,
      customerPhone: data?.CustomerMsisdn || null,
    });

    return NextResponse.json({ status: 'success', reference: clientReference }, { status: 200 });
  } catch (err) {
    console.error('Error in Hubtel webhook handler:', err);
    return NextResponse.json({ error: 'Internal server error processing Hubtel callback' }, { status: 500 });
  }
}
