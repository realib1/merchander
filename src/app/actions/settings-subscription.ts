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
    const [productsRes, staffRes, subRes] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      supabase.from('tenant_users').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      supabase.from('tenant_subscriptions').select('*').eq('tenant_id', tenantId).single(),
    ]);

    const productCount = productsRes.count ?? 0;
    const staffCount = staffRes.count ?? 1;

    const sub = subRes.data;

    const tier = sub?.tier || 'starter';
    const cycle = sub?.billing_cycle || 'monthly';

    // Limits mapped from the platform plans logic (growth, business, enterprise added)
    const limits = {
      free: { products: 20, staff: 1, bot: 50, monthlyPrice: 0, annualPrice: 0 },
      starter: { products: 100, staff: 3, bot: 250, monthlyPrice: 150, annualPrice: 1500 },
      growth: { products: 500, staff: 7, bot: 1000, monthlyPrice: 350, annualPrice: 3500 },
      business: { products: 2500, staff: 20, bot: 5000, monthlyPrice: 750, annualPrice: 7500 },
      enterprise: { products: -1, staff: -1, bot: -1, monthlyPrice: 1800, annualPrice: 18000 },
    }[tier as string] || { products: 100, staff: 3, bot: 250, monthlyPrice: 150, annualPrice: 1500 };

    return {
      tier,
      billingCycle: cycle,
      status: sub?.status || 'active',
      renewalDate: sub?.renewal_date || (tier === 'starter' || tier === 'free' ? 'Continuous Free Access' : '1st of next month'),
      monthlyPrice: limits.monthlyPrice,
      annualPrice: limits.annualPrice,
      paymentMethod: sub?.payment_method || null,
      usage: {
        products: { label: 'Products in Catalog', current: productCount, limit: limits.products, unit: 'products' },
        staffSeats: { label: 'Active Staff Accounts', current: staffCount, limit: limits.staff, unit: 'seats' },
        botMessages: { label: 'Bot Message Quota', current: 0, limit: limits.bot, unit: 'messages' },
      },
      invoices: [], // Kept empty or sourced from stripe/invoices table later
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

    const limits = {
      free: { monthlyPrice: 0 },
      starter: { monthlyPrice: 150 },
      growth: { monthlyPrice: 350 },
      business: { monthlyPrice: 750 },
      enterprise: { monthlyPrice: 1800 },
    }[tier as string] || { monthlyPrice: 150 };

    const { error } = await supabase
      .from('tenant_subscriptions')
      .upsert({ 
        tenant_id: tenantId, 
        tier, 
        billing_cycle: billingCycle, 
        status: 'active',
        price_monthly: limits.monthlyPrice,
        updated_at: new Date().toISOString()
      }, { onConflict: 'tenant_id' });

    if (error) throw error;

    revalidatePath('/dashboard/settings/subscription');
    return { success: true };
  } catch (err) {
    console.error('Error updating subscription tier:', err);
    return { error: 'Failed to update subscription tier' };
  }
}
