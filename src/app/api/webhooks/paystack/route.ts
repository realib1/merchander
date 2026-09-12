import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validatePaystackSignature, pesewasToGhs } from '@/lib/payments/paystack';
import { dispatchPaymentConfirmationReceipt } from '@/lib/payments/confirmation';
import { decryptSecret, isEncrypted } from '@/utils/encryption';
import { PaymentSettings } from '@/types/settings';

async function resolvePaystackSecret(tenantId: string | undefined): Promise<string | undefined> {
  if (!tenantId) return undefined;
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('tenant_settings')
      .select('settings_data')
      .eq('tenant_id', tenantId)
      .maybeSingle();
    const payments = (data?.settings_data as Record<string, unknown> | null)?.payment_settings as
      Partial<PaymentSettings> | undefined;
    const storedKey = payments?.providers?.paystack?.secretKey;
    if (!storedKey) return undefined;
    return isEncrypted(storedKey) ? decryptSecret(storedKey) : storedKey;
  } catch {
    return undefined;
  }
}

interface PaystackWebhookPayload {
  event?: string;
  data?: {
    reference?: string;
    amount?: number;
    fees?: number;
    paid_at?: string;
    channel?: string;
    metadata?: Record<string, unknown>;
    customer?: {
      phone?: string | null;
      first_name?: string | null;
      last_name?: string | null;
    };
    authorization?: {
      channel?: string;
      last4?: string;
      account_name?: string;
      authorization_code?: string;
      brand?: string;
      card_type?: string;
      exp_month?: string;
      exp_year?: string;
    };
  };
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing x-paystack-signature header' }, { status: 400 });
    }

    // Try per-tenant key first, then fall back to global env var
    let parsedPayload: PaystackWebhookPayload;
    try {
      parsedPayload = JSON.parse(rawBody) as PaystackWebhookPayload;
    } catch {
      return NextResponse.json({ error: 'Malformed JSON body' }, { status: 400 });
    }
    const preMetadata = parsedPayload.data?.metadata;
    let resolvedSecretToVerify: string | undefined = undefined;

    if (preMetadata?.type === 'saas_subscription' || preMetadata?.type === 'setup_billing_method') {
      resolvedSecretToVerify = process.env.PAYSTACK_SECRET_KEY;
    } else {
      resolvedSecretToVerify = await resolvePaystackSecret(preMetadata?.tenantId as string | undefined);
    }

    const isValid = validatePaystackSignature(rawBody, signature, resolvedSecretToVerify);
    if (!isValid) {
      console.warn('Paystack webhook signature verification failed');
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    const event = parsedPayload.event;
    const data = parsedPayload.data;

    if (!event || !data) {
      return NextResponse.json({ error: 'Malformed webhook payload' }, { status: 400 });
    }

    // Only process successful charges
    if (event !== 'charge.success' && event !== 'subscription.create') {
      return NextResponse.json({ status: 'ignored', message: `Unhandled event: ${event}` }, { status: 200 });
    }

    // Service role: a provider callback carries no user session, so the anon
    // client's RLS context would refuse every write here.
    const supabase = createAdminClient();
    const metadata = data.metadata || {};
    const reference = data.reference || `pst_${Date.now()}`;
    const amountGhs = pesewasToGhs(data.amount || 0);

    // ==========================================
    // CASE 1: SAAS PLATFORM SUBSCRIPTION BILLING
    // ==========================================
    if (metadata.type === 'saas_subscription' && metadata.tenantId) {
      const tenantId = String(metadata.tenantId);
      const tier = String(metadata.tier || 'pro');
      const billingCycle = String(metadata.billingCycle || 'monthly');

      const { data: existingSettings } = await supabase
        .from('tenant_settings')
        .select('settings_data')
        .eq('tenant_id', tenantId)
        .single();

      const currentData = (existingSettings?.settings_data as Record<string, unknown>) || {};
      const existingSub = (currentData.subscription as Record<string, unknown>) || {};
      const existingInvoices = Array.isArray(existingSub.invoices) ? existingSub.invoices : [];

      // Calculate next renewal date
      const renewalDateObj = new Date();
      if (billingCycle === 'annual') {
        renewalDateObj.setFullYear(renewalDateObj.getFullYear() + 1);
      } else {
        renewalDateObj.setMonth(renewalDateObj.getMonth() + 1);
      }
      const formattedRenewal = renewalDateObj.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      // Determine payment method details
      const auth = data.authorization;
      const isCard = auth?.channel === 'card';
      const paymentMethod = {
        type: isCard ? 'card' : 'mtn_momo',
        identifier: auth?.last4 ? `•••• ${auth.last4}` : 'MoMo Auto-debit',
        isVerified: true,
        authorizationCode: auth?.authorization_code,
        brand: auth?.brand || auth?.card_type || (isCard ? 'card' : 'momo'),
        last4: auth?.last4,
        expMonth: auth?.exp_month,
        expYear: auth?.exp_year,
        provider: 'paystack',
        verifiedAt: new Date().toISOString(),
      };

      const newInvoice = {
        id: `inv-${Date.now()}`,
        invoiceNumber: `INV-${new Date().getFullYear()}-${reference.slice(-5).toUpperCase()}`,
        date: new Date().toISOString().split('T')[0],
        amount: amountGhs,
        currency: 'GHS',
        status: 'paid',
        planName: `Merchander ${tier.charAt(0).toUpperCase() + tier.slice(1)} (${billingCycle})`,
      };

      const updatedSubscription = {
        ...existingSub,
        tier,
        billingCycle,
        status: 'active',
        renewalDate: formattedRenewal,
        paymentMethod,
        invoices: [newInvoice, ...existingInvoices],
      };

      const { error: subErr } = await supabase
        .from('tenant_settings')
        .update({
          settings_data: {
            ...currentData,
            subscription: updatedSubscription,
          },
        })
        .eq('tenant_id', tenantId);

      if (subErr) {
        console.error('Paystack webhook: failed to update subscription:', subErr);
        return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
      }

      return NextResponse.json({ status: 'success', type: 'saas_subscription', reference }, { status: 200 });
    }

    // ==========================================
    // CASE 2: SETUP BILLING METHOD TOKENIZATION
    // ==========================================
    if (metadata.type === 'setup_billing_method' && metadata.tenantId) {
      const tenantId = metadata.tenantId;
      const auth = data.authorization;
      const isCard = auth?.channel === 'card' || metadata.methodType === 'card';

      const paymentMethod = {
        type: isCard ? 'card' : 'mtn_momo',
        identifier: auth?.last4 ? `•••• ${auth.last4}` : (metadata.phone as string) || 'MoMo Wallet',
        holderName: (metadata.holderName as string) || auth?.account_name || undefined,
        isVerified: true,
        authorizationCode: auth?.authorization_code,
        brand: auth?.brand || auth?.card_type || (isCard ? 'card' : 'momo'),
        last4: auth?.last4,
        expMonth: auth?.exp_month,
        expYear: auth?.exp_year,
        provider: 'paystack',
        verifiedAt: new Date().toISOString(),
      };

      const { data: existingSettings } = await supabase
        .from('tenant_settings')
        .select('settings_data')
        .eq('tenant_id', tenantId)
        .single();

      const currentData = (existingSettings?.settings_data as Record<string, unknown>) || {};
      const existingSub = (currentData.subscription as Record<string, unknown>) || {};

      const { error: methodErr } = await supabase
        .from('tenant_settings')
        .update({
          settings_data: {
            ...currentData,
            subscription: {
              ...existingSub,
              paymentMethod,
            },
          },
        })
        .eq('tenant_id', tenantId);

      if (methodErr) {
        console.error('Paystack webhook: failed to store billing method:', methodErr);
        return NextResponse.json({ error: 'Failed to store billing method' }, { status: 500 });
      }

      return NextResponse.json({ status: 'success', type: 'setup_billing_method', reference }, { status: 200 });
    }

    // ==========================================
    // CASE 3: STOREFRONT CUSTOMER ORDER PAYMENT
    // ==========================================
    if (metadata.orderId || metadata.type === 'store_order') {
      const orderId = metadata.orderId ? String(metadata.orderId) : undefined;
      const tenantId = metadata.tenantId ? String(metadata.tenantId) : undefined;

      // Idempotency check: Ensure payment reference hasn't been recorded already
      const { data: existingPayment, error: existingErr } = await supabase
        .from('payments')
        .select('id')
        .eq('transaction_ref', reference)
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (existingErr) {
        console.error('Paystack webhook: failed to check for existing payment:', existingErr);
        return NextResponse.json({ error: 'Failed to verify payment idempotency' }, { status: 500 });
      }

      if (existingPayment) {
        return NextResponse.json({ status: 'already_processed', reference }, { status: 200 });
      }

      // Insert confirmed payment into ledger
      const feeGhs = pesewasToGhs(data.fees || 0);
      const netAmountGhs = amountGhs - feeGhs;

      const { error: paymentErr } = await supabase.from('payments').insert({
        tenant_id: tenantId || null,
        order_id: orderId || null,
        provider: 'paystack',
        transaction_ref: reference,
        amount: amountGhs,
        fee: feeGhs,
        net_amount: netAmountGhs,
        status: 'completed',
        sender_phone: data.customer?.phone || null,
        sender_name: `${data.customer?.first_name || ''} ${data.customer?.last_name || ''}`.trim() || null,
        notes: `Paystack online payment confirmed (${data.channel || 'online'}).`,
        payment_date: data.paid_at || new Date().toISOString(),
      });

      if (paymentErr) {
        console.error('Paystack webhook: failed to record payment:', paymentErr);
        return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
      }

      // Update linked order status to 'paid'
      if (orderId) {
        const { data: orderData, error: orderFetchErr } = await supabase
          .from('orders')
          .select('total_amount, status')
          .eq('id', orderId)
          .eq('tenant_id', tenantId)
          .single();

        if (orderFetchErr) {
          console.error('Paystack webhook: payment recorded but failed to fetch order:', orderFetchErr);
        } else if (orderData && amountGhs >= orderData.total_amount) {
          const { error: statusErr } = await supabase
            .from('orders')
            .update({
              status: 'paid',
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId)
            .eq('tenant_id', tenantId);

          if (statusErr) {
            console.error('Paystack webhook: payment recorded but order status update failed:', statusErr);
            return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
          }
        } else {
          console.warn(`Paystack webhook: partial payment received (${amountGhs} < ${orderData?.total_amount}). Status not updated to paid.`);
        }

        // Dispatch automated WhatsApp payment receipt to customer
        if (tenantId) {
          await dispatchPaymentConfirmationReceipt({
            supabase,
            tenantId,
            orderId,
            amount: amountGhs,
            provider: 'paystack',
            transactionRef: reference,
            customerPhone: data.customer?.phone || null,
            customerName: `${data.customer?.first_name || ''} ${data.customer?.last_name || ''}`.trim() || null,
          });
        }
      }

      return NextResponse.json({ status: 'success', type: 'store_order', reference }, { status: 200 });
    }

    return NextResponse.json({ status: 'success', message: 'No action needed for event metadata' }, { status: 200 });
  } catch (err) {
    console.error('Error in Paystack webhook handler:', err);
    return NextResponse.json({ error: 'Internal server error processing webhook' }, { status: 500 });
  }
}
