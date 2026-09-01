import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validatePaystackSignature, pesewasToGhs } from '@/lib/payments/paystack';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing x-paystack-signature header' }, { status: 400 });
    }

    const isValid = validatePaystackSignature(rawBody, signature);
    if (!isValid) {
      console.warn('Paystack webhook signature verification failed');
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const data = payload.data;

    if (!event || !data) {
      return NextResponse.json({ error: 'Malformed webhook payload' }, { status: 400 });
    }

    // Only process successful charges
    if (event !== 'charge.success' && event !== 'subscription.create') {
      return NextResponse.json({ status: 'ignored', message: `Unhandled event: ${event}` }, { status: 200 });
    }

    const supabase = await createClient();
    const metadata = data.metadata || {};
    const reference = data.reference || `pst_${Date.now()}`;
    const amountGhs = pesewasToGhs(data.amount || 0);

    // ==========================================
    // CASE 1: SAAS PLATFORM SUBSCRIPTION BILLING
    // ==========================================
    if (metadata.type === 'saas_subscription' && metadata.tenantId) {
      const tenantId = metadata.tenantId;
      const tier = metadata.tier || 'pro';
      const billingCycle = metadata.billingCycle || 'monthly';

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

      await supabase
        .from('tenant_settings')
        .update({
          settings_data: {
            ...currentData,
            subscription: updatedSubscription,
          },
        })
        .eq('tenant_id', tenantId);

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

      await supabase
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

      return NextResponse.json({ status: 'success', type: 'setup_billing_method', reference }, { status: 200 });
    }

    // ==========================================
    // CASE 3: STOREFRONT CUSTOMER ORDER PAYMENT
    // ==========================================
    if (metadata.orderId || metadata.type === 'store_order') {
      const orderId = metadata.orderId;
      const tenantId = metadata.tenantId;

      // Idempotency check: Ensure payment reference hasn't been recorded already
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('id')
        .eq('transaction_ref', reference)
        .single();

      if (existingPayment) {
        return NextResponse.json({ status: 'already_processed', reference }, { status: 200 });
      }

      // Insert confirmed payment into ledger
      const feeGhs = pesewasToGhs(data.fees || 0);
      const netAmountGhs = amountGhs - feeGhs;

      await supabase.from('payments').insert({
        tenant_id: tenantId,
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

      // Update linked order status to 'processing' / 'confirmed'
      if (orderId) {
        await supabase
          .from('orders')
          .update({
            status: 'processing',
          })
          .eq('id', orderId);
      }

      return NextResponse.json({ status: 'success', type: 'store_order', reference }, { status: 200 });
    }

    return NextResponse.json({ status: 'success', message: 'No action needed for event metadata' }, { status: 200 });
  } catch (err) {
    console.error('Error in Paystack webhook handler:', err);
    return NextResponse.json({ error: 'Internal server error processing webhook' }, { status: 500 });
  }
}
