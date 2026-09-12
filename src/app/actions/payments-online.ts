'use server';

import { getURL } from '@/utils/url';
import { createClient } from '@/lib/supabase/server';
import { getTenantInfo } from '@/lib/supabase/queries';
import { initializePaystackTransaction, verifyPaystackTransaction, pesewasToGhs } from '@/lib/payments/paystack';
import { requestHubtelMobileMoneyPrompt, checkHubtelTransactionStatus } from '@/lib/payments/hubtel';
import { SubscriptionTier, BillingCycle, PaymentSettings, SubscriptionPaymentMethod } from '@/types/settings';
import { revalidatePath } from 'next/cache';
import { buildStorefrontOrderPaymentUrl } from '@/utils/paymentLinks';
import { evaluateAndProcessOutreach } from '@/lib/intelligence/outreach';
import { decryptSecret, isEncrypted } from '@/utils/encryption';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Initiates an online payment checkout for SaaS Subscription upgrade (Merchander Admin billing)
 */
export async function initiateSubscriptionUpgradePayment(
  tier: SubscriptionTier,
  billingCycle: BillingCycle,
  callbackUrl?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be signed in to upgrade your subscription.' };
  }

  const { tenantId, role } = await getTenantInfo(supabase, user.id);
  if (role !== 'owner' && role !== 'admin') {
    return { error: 'Only tenant owners or admins can manage subscription billing.' };
  }

  const planPricing = {
    starter: { monthly: 0, annual: 0 },
    pro: { monthly: 250, annual: 2400 },
    enterprise: { monthly: 750, annual: 7200 },
  };

  const amount = billingCycle === 'annual' ? planPricing[tier].annual : planPricing[tier].monthly;

  if (amount === 0) {
    // Free plan downgrade / activation
    const { data: existing } = await supabase
      .from('tenant_settings')
      .select('settings_data')
      .eq('tenant_id', tenantId)
      .single();

    const currentData = (existing?.settings_data as Record<string, unknown>) || {};
    const existingSub = (currentData.subscription as Record<string, unknown>) || {};

    await supabase
      .from('tenant_settings')
      .update({
        settings_data: {
          ...currentData,
          subscription: {
            ...existingSub,
            tier: 'starter',
            billingCycle: 'monthly',
            status: 'active',
          },
        },
      })
      .eq('tenant_id', tenantId);

    revalidatePath('/dashboard/settings/subscription');
    return { success: true, isFree: true };
  }

  try {
    const reference = `sub_${tenantId.slice(0, 8)}_${tier}_${Date.now()}`;
    const redirectUrl =
      callbackUrl ||
      `${getURL()}/dashboard/settings/subscription?status=verified&ref=${reference}`;

    const res = await initializePaystackTransaction({
      email: user.email || 'billing@merchander.com',
      amountInGhs: amount,
      reference,
      callbackUrl: redirectUrl,
      secretKey: process.env.PAYSTACK_SECRET_KEY,
      metadata: {
        type: 'saas_subscription',
        tenantId,
        tier,
        billingCycle,
        userId: user.id,
        userEmail: user.email,
      },
      channels: ['card', 'mobile_money'],
    });

    if (!res.status || !res.data) {
      return { error: res.message || 'Failed to initialize payment gateway' };
    }

    return {
      success: true,
      authorizationUrl: res.data.authorization_url,
      reference: res.data.reference,
    };
  } catch (err) {
    console.error('Error initiating subscription payment:', err);
    return { error: err instanceof Error ? err.message : 'Payment gateway initialization failed' };
  }
}

/**
 * Initiates a secure payment method tokenization setup (Card or MoMo) for SaaS platform billing
 */
export async function initiateBillingMethodSetup(params: {
  methodType: 'card' | 'mtn_momo' | 'telecel_cash';
  phone?: string;
  holderName?: string;
  provider?: 'paystack' | 'hubtel';
  callbackUrl?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be signed in to configure billing.' };
  }

  const { tenantId, role } = await getTenantInfo(supabase, user.id);
  if (role !== 'owner' && role !== 'admin') {
    return { error: 'Only tenant owners or admins can manage subscription billing.' };
  }

  const reference = `setup_${tenantId.slice(0, 8)}_${params.methodType}_${Date.now()}`;
  const redirectUrl =
    params.callbackUrl ||
    `${getURL()}/dashboard/settings/subscription?status=verified&type=setup&ref=${reference}`;

  // 1. Hubtel Direct MoMo USSD Prompt flow
  if (params.provider === 'hubtel' && (params.methodType === 'mtn_momo' || params.methodType === 'telecel_cash')) {
    if (!params.phone) {
      return { error: 'Mobile money phone number is required.' };
    }

    try {
      const res = await requestHubtelMobileMoneyPrompt({
        customerPhone: params.phone,
        amount: 1, // 1 GHS verification token auth
        clientReference: reference,
        description: 'Merchander SaaS Billing Verification',
        callbackUrl: `${getURL()}/api/webhooks/hubtel`,
      });

      return {
        success: true,
        provider: 'hubtel',
        reference,
        message: res.message || 'USSD verification prompt sent to your phone. Please enter your MoMo PIN to authorize.',
      };
    } catch (err) {
      console.error('Error sending Hubtel billing verification:', err);
      return { error: 'Failed to dispatch MoMo verification prompt.' };
    }
  }

  // 2. Paystack Tokenization Flow (Card & MoMo)
  try {
    const res = await initializePaystackTransaction({
      email: user.email || 'billing@merchander.com',
      amountInGhs: 1, // 1 GHS tokenization charge (refundable/auth token)
      reference,
      callbackUrl: redirectUrl,
      secretKey: process.env.PAYSTACK_SECRET_KEY,
      metadata: {
        type: 'setup_billing_method',
        tenantId,
        methodType: params.methodType,
        phone: params.phone,
        holderName: params.holderName,
        userId: user.id,
      },
      channels: params.methodType === 'card' ? ['card'] : ['mobile_money'],
    });

    if (!res.status || !res.data) {
      return { error: res.message || 'Failed to initialize gateway authorization' };
    }

    return {
      success: true,
      provider: 'paystack',
      authorizationUrl: res.data.authorization_url,
      reference: res.data.reference,
    };
  } catch (err) {
    console.error('Error initializing Paystack setup intent:', err);
    return { error: err instanceof Error ? err.message : 'Gateway initialization failed' };
  }
}

/**
 * Checks verification status of a billing method setup and saves tokenized details to tenant settings
 */
export async function verifyBillingMethodStatus(reference: string, provider: 'paystack' | 'hubtel' = 'paystack') {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  try {
    const { tenantId, role } = await getTenantInfo(supabase, user.id);
    if (role !== 'owner' && role !== 'admin') return { error: 'Insufficient permissions' };

    if (provider === 'hubtel') {
      const statusRes = await checkHubtelTransactionStatus(reference);
      if (statusRes.data?.status === 'Success') {
        const { data: existing } = await supabase
          .from('tenant_settings')
          .select('settings_data')
          .eq('tenant_id', tenantId)
          .single();

        const currentData = (existing?.settings_data as Record<string, unknown>) || {};
        const existingSub = (currentData.subscription as Record<string, unknown>) || {};

        const updatedMethod: SubscriptionPaymentMethod = {
          type: 'mtn_momo',
          identifier: 'MoMo Wallet',
          isVerified: true,
          provider: 'hubtel',
          verifiedAt: new Date().toISOString(),
        };

        await supabase
          .from('tenant_settings')
          .update({
            settings_data: {
              ...currentData,
              subscription: {
                ...existingSub,
                paymentMethod: updatedMethod,
              },
            },
          })
          .eq('tenant_id', tenantId);

        revalidatePath('/dashboard/settings/subscription');
        return { success: true, method: updatedMethod };
      }
      return { success: false, status: statusRes.data?.status || 'Pending' };
    }

    // Paystack verification
    const verifyRes = await verifyPaystackTransaction(reference, process.env.PAYSTACK_SECRET_KEY);
    if (verifyRes.status && verifyRes.data?.status === 'success') {
      const auth = verifyRes.data.authorization;
      const meta = verifyRes.data.metadata as Record<string, unknown> | undefined;
      const isCard = auth?.channel === 'card' || meta?.methodType === 'card';

      const paymentMethod: SubscriptionPaymentMethod = {
        type: isCard ? 'card' : 'mtn_momo',
        identifier: auth?.last4 ? `•••• ${auth.last4}` : (meta?.phone as string) || 'MoMo Wallet',
        holderName: (meta?.holderName as string) || auth?.account_name || undefined,
        isVerified: true,
        authorizationCode: auth?.authorization_code,
        brand: auth?.brand || auth?.card_type || (isCard ? 'card' : 'momo'),
        last4: auth?.last4,
        expMonth: auth?.exp_month,
        expYear: auth?.exp_year,
        provider: 'paystack',
        verifiedAt: new Date().toISOString(),
      };

      const { data: existing } = await supabase
        .from('tenant_settings')
        .select('settings_data')
        .eq('tenant_id', tenantId)
        .single();

      const currentData = (existing?.settings_data as Record<string, unknown>) || {};
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

      // Synchronize relational tenant_subscriptions table
      try {
        let adminClient: ReturnType<typeof createAdminClient> | null = null;
        try {
          adminClient = createAdminClient();
        } catch {
          // Service role key not available
        }
        const dbClient = adminClient || supabase;
        await dbClient
          .from('tenant_subscriptions')
          .update({ payment_method: paymentMethod, updated_at: new Date().toISOString() })
          .eq('tenant_id', tenantId);
      } catch (subErr) {
        console.warn('Could not sync tenant_subscriptions.payment_method:', subErr);
      }

      revalidatePath('/dashboard/settings/subscription');
      return { success: true, method: paymentMethod };
    }

    return { success: false, message: verifyRes.message || 'Payment not verified yet' };
  } catch (err) {
    console.error('Error verifying billing method:', err);
    return { error: 'Failed to verify billing method' };
  }
}

/**
 * Server-to-server callback verification for plan upgrades (Pro/Enterprise)
 */
export async function verifyAndApplySubscriptionPayment(reference: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);
    const verifyRes = await verifyPaystackTransaction(reference, process.env.PAYSTACK_SECRET_KEY);

    if (verifyRes.status && verifyRes.data?.status === 'success') {
      const data = verifyRes.data;
      const metadata = (data.metadata as Record<string, unknown>) || {};
      const tier = (metadata.tier as SubscriptionTier) || 'pro';
      const billingCycle = (metadata.billingCycle as BillingCycle) || 'monthly';
      const amountGhs = pesewasToGhs(data.amount || 0);

      const { data: existingSettings } = await supabase
        .from('tenant_settings')
        .select('settings_data')
        .eq('tenant_id', tenantId)
        .single();

      const currentData = (existingSettings?.settings_data as Record<string, unknown>) || {};
      const existingSub = (currentData.subscription as Record<string, unknown>) || {};
      const existingInvoices = Array.isArray(existingSub.invoices) ? existingSub.invoices : [];

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

      const auth = data.authorization;
      const isCard = auth?.channel === 'card';
      const paymentMethod: SubscriptionPaymentMethod = {
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
        status: 'paid' as const,
        planName: `Merchander ${tier.charAt(0).toUpperCase() + tier.slice(1)} (${billingCycle})`,
      };

      const invoiceExists = existingInvoices.some((inv) =>
        (inv as { invoiceNumber?: string }).invoiceNumber?.includes(reference.slice(-5).toUpperCase())
      );
      const updatedInvoices = invoiceExists ? existingInvoices : [newInvoice, ...existingInvoices];

      await supabase
        .from('tenant_settings')
        .update({
          settings_data: {
            ...currentData,
            subscription: {
              ...existingSub,
              tier,
              billingCycle,
              status: 'active',
              renewalDate: formattedRenewal,
              paymentMethod,
              invoices: updatedInvoices,
            },
          },
        })
        .eq('tenant_id', tenantId);

      revalidatePath('/dashboard/settings/subscription');
      return { success: true, tier, billingCycle };
    }

    return { error: verifyRes.message || 'Transaction verification failed' };
  } catch (err) {
    console.error('Error verifying subscription payment:', err);
    return { error: 'Failed to verify subscription upgrade' };
  }
}

/**
 * Initiates an online payment for a customer store order (Storefront -> Merchant's Payment Account)
 * Defaults to Hubtel for Ghanaian Mobile Money prompt checkouts.
 */
export async function initiateOrderOnlinePayment(params: {
  orderId: string;
  provider?: 'paystack' | 'hubtel';
  customerPhone?: string;
  customerEmail?: string;
  callbackUrl?: string;
}) {
  const supabase = await createClient();

  // Fetch the order and its tenant
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, short_id, tenant_id, total_amount, status')
    .eq('id', params.orderId)
    .single();

  if (orderError || !order) {
    return { error: 'Order not found' };
  }

  // Fetch tenant payment provider configuration
  const { data: settingsData } = await supabase
    .from('tenant_settings')
    .select('settings_data, store_email')
    .eq('tenant_id', order.tenant_id)
    .single();

  const rawSettings = settingsData?.settings_data as Record<string, unknown> | null;
  const customSettings = (rawSettings?.payment_settings || rawSettings?.payments) as PaymentSettings | undefined;
  const activeProvider = params.provider || customSettings?.defaultOrderGateway || 'hubtel';
  const providerConfig = customSettings?.providers?.[activeProvider];

  const totalGhs = Number(order.total_amount) || 0;
  // Carry the unique short_id (ORD-XXXXXX, never contains an underscore) so the
  // Hubtel callback can resolve the order with an exact match instead of a
  // prefix search over the UUID.
  const reference = `ord_${order.short_id}_${Date.now()}`;

  if (activeProvider === 'paystack') {
    try {
      const email = params.customerEmail || settingsData?.store_email || 'customer@merchander.com';
      const rawSecret = providerConfig?.secretKey || process.env.PAYSTACK_SECRET_KEY;
      const secretKey = rawSecret ? (isEncrypted(rawSecret) ? decryptSecret(rawSecret) : rawSecret) : undefined;

      const res = await initializePaystackTransaction({
        email,
        amountInGhs: totalGhs,
        reference,
        callbackUrl: params.callbackUrl,
        secretKey,
        metadata: {
          type: 'store_order',
          orderId: order.id,
          tenantId: order.tenant_id,
        },
        channels: ['card', 'mobile_money'],
      });

      if (!res.status || !res.data) {
        return { error: res.message || 'Could not initialize Paystack checkout' };
      }

      return {
        success: true,
        provider: 'paystack',
        authorizationUrl: res.data.authorization_url,
        reference: res.data.reference,
      };
    } catch (err) {
      console.error('Error initiating Paystack order checkout:', err);
      return { error: 'Paystack checkout failed to initialize' };
    }
  }

  if (activeProvider === 'hubtel') {
    if (!params.customerPhone) {
      return { error: 'Customer phone number is required for Hubtel Mobile Money prompt.' };
    }

    try {
      const clientSecret = providerConfig?.secretKey ? decryptSecret(providerConfig.secretKey) : undefined;

      const res = await requestHubtelMobileMoneyPrompt({
        customerPhone: params.customerPhone,
        amount: totalGhs,
        clientReference: reference,
        description: `Payment for Order #${order.id.slice(0, 8)}`,
        merchantAccountOrPosId: providerConfig?.merchantAccountOrPosId,
        clientId: providerConfig?.publicKey,
        clientSecret,
        callbackUrl: params.callbackUrl,
      });

      return {
        success: true,
        provider: 'hubtel',
        reference,
        message: res.message || 'USSD prompt dispatched to your phone. Please enter your MoMo PIN to authorize.',
      };
    } catch (err) {
      console.error('Error initiating Hubtel MoMo prompt:', err);
      return { error: 'Hubtel Mobile Money prompt failed to dispatch' };
    }
  }

  return { error: 'Unsupported payment provider' };
}

/**
 * Direct server verification of an online transaction reference
 */
export async function verifyOnlinePayment(reference: string, customSecretKey?: string) {
  try {
    const resolvedSecret = customSecretKey ? decryptSecret(customSecretKey) : undefined;
    const res = await verifyPaystackTransaction(reference, resolvedSecret);
    return res;
  } catch (err) {
    console.error('Error verifying payment reference:', err);
    return { status: false, message: 'Verification check failed' };
  }
}

/**
 * Removes active SaaS billing method from tenant settings
 */
export async function removeTenantBillingMethod() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  try {
    const { tenantId, role } = await getTenantInfo(supabase, user.id);
    if (role !== 'owner' && role !== 'admin') return { error: 'Insufficient permissions' };

    const { data: existing } = await supabase
      .from('tenant_settings')
      .select('settings_data')
      .eq('tenant_id', tenantId)
      .single();

    const currentData = (existing?.settings_data as Record<string, unknown>) || {};
    const existingSub = (currentData.subscription as Record<string, unknown>) || {};

    const updatedData = {
      ...currentData,
      subscription: {
        ...existingSub,
        paymentMethod: null,
      },
    };

    const { error } = await supabase
      .from('tenant_settings')
      .update({ settings_data: updatedData })
      .eq('tenant_id', tenantId);

    if (error) throw error;

    // Synchronously purge from tenant_subscriptions relational table as well
    try {
      let adminClient: ReturnType<typeof createAdminClient> | null = null;
      try {
        adminClient = createAdminClient();
      } catch {
        // Fallback to scoped client
      }
      const dbClient = adminClient || supabase;
      await dbClient
        .from('tenant_subscriptions')
        .update({ payment_method: null, updated_at: new Date().toISOString() })
        .eq('tenant_id', tenantId);
    } catch (subErr) {
      console.warn('Could not clear tenant_subscriptions.payment_method:', subErr);
    }

    revalidatePath('/dashboard/settings/subscription');
    return { success: true };
  } catch (err) {
    console.error('Error removing billing method:', err);
    return { error: 'Failed to remove billing method' };
  }
}

/**
 * Updates or connects a recurring billing payment method (MoMo Wallet / Card)
 */
export async function updateTenantBillingMethod(method: {
  type: 'mtn_momo' | 'telecel_cash' | 'card';
  identifier: string;
  holderName?: string;
  brand?: string;
  last4?: string;
  expMonth?: string;
  expYear?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  try {
    const { tenantId, role } = await getTenantInfo(supabase, user.id);
    if (role !== 'owner' && role !== 'admin') return { error: 'Insufficient permissions' };

    const { data: existing } = await supabase
      .from('tenant_settings')
      .select('settings_data')
      .eq('tenant_id', tenantId)
      .single();

    const currentData = (existing?.settings_data as Record<string, unknown>) || {};
    const existingSub = (currentData.subscription as Record<string, unknown>) || {};

    const updatedData = {
      ...currentData,
      subscription: {
        ...existingSub,
        paymentMethod: {
          type: method.type,
          identifier: method.identifier,
          holderName: method.holderName || undefined,
          brand: method.brand,
          last4: method.last4,
          expMonth: method.expMonth,
          expYear: method.expYear,
          isVerified: true,
          verifiedAt: new Date().toISOString(),
        },
      },
    };

    const { error } = await supabase
      .from('tenant_settings')
      .update({ settings_data: updatedData })
      .eq('tenant_id', tenantId);

    if (error) throw error;

    // Synchronously update tenant_subscriptions relational table as well
    try {
      let adminClient: ReturnType<typeof createAdminClient> | null = null;
      try {
        adminClient = createAdminClient();
      } catch {
        // Fallback to scoped client
      }
      const dbClient = adminClient || supabase;
      await dbClient
        .from('tenant_subscriptions')
        .update({
          payment_method: updatedData.subscription.paymentMethod,
          updated_at: new Date().toISOString(),
        })
        .eq('tenant_id', tenantId);
    } catch (subErr) {
      console.warn('Could not sync tenant_subscriptions.payment_method:', subErr);
    }

    revalidatePath('/dashboard/settings/subscription');
    return { success: true };
  } catch (err) {
    console.error('Error updating billing method:', err);
    return { error: 'Failed to update billing method' };
  }
}

/**
 * Retrieves or generates the customer-facing payment URL for a store order.
 */
export async function getOrderPaymentLinkAction(orderId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, short_id, status, total_amount, tenant_id')
      .eq('id', orderId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (orderErr || !order) {
      return { error: 'Order not found' };
    }

    let storeSlug = `store-${tenantId.slice(0, 8)}`;
    try {
      const { data: sfData } = await supabase
        .from('storefront_settings')
        .select('slug')
        .eq('tenant_id', tenantId)
        .maybeSingle();
      if (sfData?.slug) {
        storeSlug = sfData.slug;
      }
    } catch {
      // Fall back
    }

    const orderNumber = order.short_id || order.id.slice(0, 8).toUpperCase();
    const paymentUrl = buildStorefrontOrderPaymentUrl({
      baseUrl: getURL(),
      storeSlug,
      orderShortIdOrId: orderNumber,
    });

    return {
      success: true,
      orderId: order.id,
      orderNumber,
      paymentUrl,
      status: order.status,
      totalAmount: Number(order.total_amount),
    };
  } catch (err) {
    console.error('Error generating order payment link:', err);
    return { error: 'Failed to generate payment link' };
  }
}

/**
 * Generates and routes an intelligent WhatsApp payment reminder for an unpaid order.
 * Follows Ghanaian quiet hours and frequency caps.
 */
export async function sendOrderPaymentReminderAction(params: {
  orderId: string;
  forceImmediate?: boolean;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);

    // Fetch order with customer details
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select(`
        id,
        short_id,
        status,
        total_amount,
        tenant_id,
        customer_id,
        customer:customers(id, name, phone)
      `)
      .eq('id', params.orderId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (orderErr || !order) {
      return { error: 'Order not found' };
    }

    if (order.status === 'paid' || order.status === 'completed') {
      return { error: 'This order is already paid.' };
    }

    const rawCustomer = order.customer as unknown as { id?: string; name?: string | null; phone?: string | null } | null;
    const phone = rawCustomer?.phone;
    const customerName = rawCustomer?.name || 'Valued Customer';

    if (!phone) {
      return { error: 'Customer phone number is required to send payment reminder.' };
    }

    // Resolve storefront slug
    let storeSlug = `store-${tenantId.slice(0, 8)}`;
    try {
      const { data: sfData } = await supabase
        .from('storefront_settings')
        .select('slug')
        .eq('tenant_id', tenantId)
        .maybeSingle();
      if (sfData?.slug) {
        storeSlug = sfData.slug;
      }
    } catch {
      // Fall back
    }

    const orderNumber = order.short_id || order.id.slice(0, 8).toUpperCase();
    const paymentUrl = buildStorefrontOrderPaymentUrl({
      baseUrl: getURL(),
      storeSlug,
      orderShortIdOrId: orderNumber,
    });

    const outreachResult = await evaluateAndProcessOutreach({
      supabase,
      request: {
        tenantId,
        triggerType: 'payment_reminder',
        orderId: order.id,
        orderNumber,
        customerId: order.customer_id,
        customerPhone: phone,
        customerName,
        totalAmount: Number(order.total_amount),
        currency: 'GHS',
        paymentInstructions: `Pay securely online: ${paymentUrl}`,
        trackingUrl: paymentUrl,
        forceBypassQuietHours: params.forceImmediate,
      },
    });

    return {
      success: outreachResult.success,
      status: outreachResult.status,
      paymentUrl,
      actionId: outreachResult.actionId,
      reason: outreachResult.reason,
      messageText: outreachResult.messageText,
    };
  } catch (err) {
    console.error('Error sending payment reminder:', err);
    return { error: err instanceof Error ? err.message : 'Failed to dispatch payment reminder' };
  }
}
