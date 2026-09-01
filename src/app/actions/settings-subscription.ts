'use server';

import { createClient } from '@/lib/supabase/server';
import { getTenantInfo } from '@/lib/supabase/queries';
import { revalidatePath } from 'next/cache';
import { SubscriptionSettings, SubscriptionTier, BillingCycle } from '@/types/settings';

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
      products: { label: 'Products in Catalog', current: 0, limit: 25, unit: 'products' },
      staffSeats: { label: 'Active Staff Accounts', current: 1, limit: 1, unit: 'seats' },
      botMessages: { label: 'Bot Message Quota', current: 0, limit: 200, unit: 'messages' },
    },
    invoices: [],
  };

  if (!user) return fallback;

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);

    // Real live counts from database tables
    const [productsRes, staffRes, settingsRes] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      supabase.from('tenant_users').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      supabase.from('tenant_settings').select('settings_data').eq('tenant_id', tenantId).single(),
    ]);

    const productCount = productsRes.count ?? 0;
    const staffCount = staffRes.count ?? 1;

    const custom = (settingsRes.data?.settings_data as Record<string, unknown> | null)?.subscription as
      Partial<SubscriptionSettings> | undefined;

    const tier = custom?.tier || 'starter';
    const cycle = custom?.billingCycle || 'monthly';

    const limits = {
      starter: { products: 25, staff: 1, bot: 200, monthlyPrice: 0, annualPrice: 0 },
      pro: { products: -1, staff: 5, bot: 2500, monthlyPrice: 250, annualPrice: 2400 },
      enterprise: { products: -1, staff: -1, bot: -1, monthlyPrice: 750, annualPrice: 7200 },
    }[tier];

    return {
      tier,
      billingCycle: cycle,
      status: custom?.status || 'active',
      renewalDate: custom?.renewalDate || (tier === 'starter' ? 'Continuous Free Access' : '1st of next month'),
      monthlyPrice: limits.monthlyPrice,
      annualPrice: limits.annualPrice,
      paymentMethod: custom?.paymentMethod || null,
      usage: {
        products: { label: 'Products in Catalog', current: productCount, limit: limits.products, unit: 'products' },
        staffSeats: { label: 'Active Staff Accounts', current: staffCount, limit: limits.staff, unit: 'seats' },
        botMessages: { label: 'Bot Message Quota', current: 0, limit: limits.bot, unit: 'messages' },
      },
      invoices: custom?.invoices || [],
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
        tier,
        billingCycle,
        status: 'active',
      },
    };

    const { error } = await supabase
      .from('tenant_settings')
      .update({ settings_data: updatedData })
      .eq('tenant_id', tenantId);

    if (error) throw error;

    revalidatePath('/dashboard/settings/subscription');
    return { success: true };
  } catch (err) {
    console.error('Error updating subscription tier:', err);
    return { error: 'Failed to update subscription tier' };
  }
}
