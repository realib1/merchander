'use server';

import { createClient } from '@/lib/supabase/server';
import { AnalyticsData, AnalyticsFilterPeriod } from '@/types/analytics';
import { computeAnalyticsData, RawAnalyticsInput } from '@/utils/analyticsMath';

/**
 * Returns tenant-scoped analytics and GMV exploration datasets.
 * Adheres strictly to Rule 7 (<150 LOC).
 */
export async function getAnalyticsData(period: AnalyticsFilterPeriod = '30d'): Promise<AnalyticsData> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: tenantUser } = await supabase.from('tenant_users').select('tenant_id').eq('user_id', user.id).single();

  if (!tenantUser) throw new Error('Tenant not found');
  const tenantId = tenantUser.tenant_id;

  const now = new Date();
  const { currentStartDate, priorStartDate, priorEndDate } = getPeriodDateBounds(period, now);

  const [ordersRes, priorOrdersRes, customersRes, categoriesRes, productsRes] = await Promise.all([
    supabase
      .from('orders')
      .select(
        'id, total_amount, status, channel, payment_method, created_at, customer_id, customers(id, name, phone, created_at), order_items(variant_id, quantity, unit_price, total_price, product_variants(product_id, sku, products(id, name, category_id)))'
      )
      .eq('tenant_id', tenantId)
      .gte('created_at', currentStartDate.toISOString())
      .lte('created_at', now.toISOString()),

    supabase
      .from('orders')
      .select('total_amount, status')
      .eq('tenant_id', tenantId)
      .gte('created_at', priorStartDate.toISOString())
      .lt('created_at', priorEndDate.toISOString()),

    supabase.from('customers').select('id, name, phone, created_at').eq('tenant_id', tenantId),

    supabase.from('categories').select('id, name').eq('tenant_id', tenantId),

    supabase.from('products').select('id, name, category_id').eq('tenant_id', tenantId),
  ]);

  const rawInput: RawAnalyticsInput = {
    period,
    orders: (ordersRes.data || []) as unknown as RawAnalyticsInput['orders'],
    priorOrders: priorOrdersRes.data || [],
    allCustomers: customersRes.data || [],
    categories: categoriesRes.data || [],
    products: productsRes.data || [],
  };

  return computeAnalyticsData(rawInput);
}

function getPeriodDateBounds(period: AnalyticsFilterPeriod, now: Date) {
  let days = 30;
  if (period === 'today') days = 1;
  else if (period === '7d') days = 7;
  else if (period === '30d') days = 30;
  else if (period === '90d') days = 90;
  else if (period === '1y') days = 365;
  else if (period === 'ytd') {
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    days = Math.max(1, Math.ceil((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)));
  }

  const currentStartDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const priorEndDate = currentStartDate;
  const priorStartDate = new Date(currentStartDate.getTime() - days * 24 * 60 * 60 * 1000);

  return { currentStartDate, priorStartDate, priorEndDate };
}
