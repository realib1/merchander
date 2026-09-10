'use server';

import { createClient } from '@/lib/supabase/server';
import { getTenantInfo } from '@/lib/supabase/queries';
import { revalidatePath } from 'next/cache';
import { SubscriptionSettings, SubscriptionTier, BillingCycle, BillingInvoice } from '@/types/settings';

import { generateTrialInvoice, getTierConfig, isFakeCard } from '@/utils/subscription';
import { createAdminClient } from '@/lib/supabase/admin';

export async function getSubscriptionSettings(): Promise<SubscriptionSettings> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const fallback: SubscriptionSettings = {
    tier: 'starter',
    billingCycle: 'monthly',
    status: 'active',
    renewalDate: 'Continuous Free Access',
    monthlyPrice: 0,
    annualPrice: 0,
    paymentMethod: null,
    usage: {
      products: { label: 'Products in Catalog', current: 0, limit: 100, unit: 'products' },
      staffSeats: { label: 'Active Staff Accounts', current: 1, limit: 1, unit: 'seats' },
      botMessages: { label: 'Bot Message Quota', current: 0, limit: 50, unit: 'messages' },
    },
    invoices: [],
    isTrial: false,
  };

  if (!user) return fallback;

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);

    // Live counts & subscription state from both relational and JSON stores
    const [productsRes, staffRes, messagesRes, subRes, settingsRes] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      supabase.from('tenant_users').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('direction', 'outbound'),
      supabase.from('tenant_subscriptions').select('*').eq('tenant_id', tenantId).maybeSingle(),
      supabase.from('tenant_settings').select('settings_data').eq('tenant_id', tenantId).maybeSingle(),
    ]);

    const productCount = productsRes.count ?? 0;
    const staffCount = staffRes.count ?? 1;
    const botMessagesCount = messagesRes.count ?? 0;

    const sub = subRes.data;
    const settingsData = (settingsRes.data?.settings_data as Record<string, unknown>) || {};
    const settingsSub = (settingsData.subscription as Record<string, unknown>) || {};

    // Determine tier & cycle with precedence for highest active or explicitly set tier
    const rawTier = (settingsSub.tier as string) || (sub?.tier as string) || 'starter';
    const tierConfig = getTierConfig(rawTier);
    const tier = tierConfig.id;

    const cycle = ((settingsSub.billingCycle as string) || (sub?.billing_cycle as string) || 'monthly') as BillingCycle;

    // Detect trial status: explicitly marked trialing or has future renewal with 0 monthly price
    const renewalTime = sub?.renewal_date ? new Date(sub.renewal_date).getTime() : 0;
    const now = Date.now();
    const isTrial =
      sub?.status === 'trialing' ||
      settingsSub.status === 'trialing' ||
      (Boolean(sub?.renewal_date) &&
        !isNaN(renewalTime) &&
        renewalTime > now &&
        (sub?.price_monthly === 0 || Number(sub?.price_monthly) === 0));

    // Resolve payment method:
    // If explicitly set in settingsSub (including explicit null), respect it; otherwise check relational sub
    let rawPaymentMethod: SubscriptionSettings['paymentMethod'] = null;
    if (settingsSub.paymentMethod !== undefined) {
      rawPaymentMethod = (settingsSub.paymentMethod as SubscriptionSettings['paymentMethod']) ?? null;
    } else if (
      sub?.payment_method &&
      typeof sub.payment_method === 'object' &&
      Object.keys(sub.payment_method).length > 0
    ) {
      rawPaymentMethod = sub.payment_method as SubscriptionSettings['paymentMethod'];
    }

    // Purge fake or mock cards immediately so merchants see a truthful clean state
    let paymentMethod: SubscriptionSettings['paymentMethod'] = rawPaymentMethod;
    if (isFakeCard(rawPaymentMethod)) {
      paymentMethod = null;

      // Scrub fake card from database stores in background
      (async () => {
        try {
          let adminClient: ReturnType<typeof createAdminClient> | null = null;
          try {
            adminClient = createAdminClient();
          } catch {
            // Service role key not available
          }
          const dbClient = adminClient || supabase;

          const updatedSettingsData = {
            ...settingsData,
            subscription: {
              ...settingsSub,
              paymentMethod: null,
            },
          };
          await dbClient
            .from('tenant_settings')
            .update({ settings_data: updatedSettingsData })
            .eq('tenant_id', tenantId);

          await dbClient
            .from('tenant_subscriptions')
            .update({ payment_method: null, updated_at: new Date().toISOString() })
            .eq('tenant_id', tenantId);
        } catch {
          // Ignore background cleanup error
        }
      })();
    }

    // Resolve invoices: combine saved paid invoices from settings_data with the generated trial invoice
    const rawSettingsInvoices = Array.isArray(settingsSub.invoices)
      ? (settingsSub.invoices as BillingInvoice[])
      : [];

    const trialInvoice = generateTrialInvoice(tenantId, sub?.created_at || (settingsSub.createdAt as string), tier);
    const combinedInvoices: BillingInvoice[] = [...rawSettingsInvoices];

    // Ensure trial invoice is present without duplicate records
    const hasTrialInvoice = combinedInvoices.some(
      (inv) => inv.id === trialInvoice.id || inv.invoiceNumber === trialInvoice.invoiceNumber
    );
    if (!hasTrialInvoice) {
      combinedInvoices.push(trialInvoice);
    }

    // Sort newest invoices first
    combinedInvoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Renewal date display resolution
    const renewalDate =
      (settingsSub.renewalDate as string) ||
      sub?.renewal_date ||
      (tier === 'starter' ? 'Continuous Free Access' : '1st of next month');

    return {
      tier,
      billingCycle: cycle,
      status: isTrial ? 'trialing' : ((settingsSub.status as SubscriptionSettings['status']) || sub?.status || 'active'),
      renewalDate,
      monthlyPrice: tierConfig.monthlyPrice,
      annualPrice: tierConfig.annualPrice,
      paymentMethod,
      usage: {
        products: { label: 'Products in Catalog', current: productCount, limit: tierConfig.limits.products, unit: 'products' },
        staffSeats: { label: 'Active Staff Accounts', current: staffCount, limit: tierConfig.limits.staff, unit: 'seats' },
        botMessages: { label: 'Bot Message Quota', current: botMessagesCount, limit: tierConfig.limits.bot, unit: 'messages' },
      },
      invoices: combinedInvoices,
      isTrial,
    };
  } catch (err) {
    console.error('Error fetching subscription settings:', err);
    return fallback;
  }
}

export async function updateSubscriptionTier(tier: SubscriptionTier, billingCycle: BillingCycle) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  try {
    const { tenantId, role } = await getTenantInfo(supabase, user.id);
    if (role !== 'owner' && role !== 'admin') return { error: 'Insufficient permissions' };

    const tierConfig = getTierConfig(tier);

    // 1. Synchronize tenant_subscriptions relational table
    try {
      let adminClient: ReturnType<typeof createAdminClient> | null = null;
      try {
        adminClient = createAdminClient();
      } catch {
        // Service role key not available in test or limited client environment
      }
      const dbClient = adminClient || supabase;

      await dbClient
        .from('tenant_subscriptions')
        .upsert(
          {
            tenant_id: tenantId,
            tier: tierConfig.id,
            billing_cycle: billingCycle,
            status: 'active',
            price_monthly: tierConfig.monthlyPrice,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'tenant_id' }
        );
    } catch (dbErr) {
      console.warn('Could not update tenant_subscriptions table directly:', dbErr);
    }

    // 2. Synchronize tenant_settings JSON store
    const { data: existingSettings } = await supabase
      .from('tenant_settings')
      .select('settings_data')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    const currentData = (existingSettings?.settings_data as Record<string, unknown>) || {};
    const existingSub = (currentData.subscription as Record<string, unknown>) || {};

    await supabase
      .from('tenant_settings')
      .update({
        settings_data: {
          ...currentData,
          subscription: {
            ...existingSub,
            tier: tierConfig.id,
            billingCycle,
            status: 'active',
          },
        },
      })
      .eq('tenant_id', tenantId);

    revalidatePath('/dashboard/settings/subscription');
    return { success: true };
  } catch (err) {
    console.error('Error updating subscription tier:', err);
    return { error: 'Failed to update subscription tier' };
  }
}
