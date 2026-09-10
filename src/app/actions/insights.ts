'use server';

import { createClient } from '@/lib/supabase/server';
import { BusinessInsight, InsightsResponse, InsightsSummary } from '@/types/insights';
import { formatCurrency } from '@/utils/format';
import { subDays } from 'date-fns';
import {
  evaluateInventoryInsights,
  evaluateMarginInsights,
  evaluateCustomerCreditInsights,
  evaluateLogisticsAndVipInsights,
  evaluateEmptyStoreInsights,
} from '@/utils/insightRules';

export async function getBusinessInsights(): Promise<InsightsResponse> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: tenantUser } = await supabase.from('tenant_users').select('tenant_id').eq('user_id', user.id).single();

  if (!tenantUser?.tenant_id) throw new Error('Tenant not found');
  const tenantId = tenantUser.tenant_id;

  const now = new Date();
  const fourteenDaysAgo = subDays(now, 14).toISOString();
  const sevenDaysAgo = subDays(now, 7).toISOString();
  const fourteenToSevenDaysAgo = subDays(now, 14).toISOString();

  // Parallel fetch of business signals
  const [
    { data: productsData },
    { data: recentOrdersData },
    { data: priorOrdersData },
    { data: customersData },
    { data: shipmentsData },
  ] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, sku, stock_quantity, cost_price, selling_price, category_id')
      .eq('tenant_id', tenantId),
    supabase
      .from('orders')
      .select('id, total_amount, status, created_at, order_items(product_id, quantity, unit_price)')
      .eq('tenant_id', tenantId)
      .neq('status', 'cancelled')
      .gte('created_at', fourteenDaysAgo),
    supabase
      .from('orders')
      .select('id, total_amount')
      .eq('tenant_id', tenantId)
      .neq('status', 'cancelled')
      .gte('created_at', fourteenToSevenDaysAgo)
      .lt('created_at', sevenDaysAgo),
    supabase
      .from('customers')
      .select('id, name, phone, email, credit_balance, total_spent, updated_at')
      .eq('tenant_id', tenantId)
      .order('total_spent', { ascending: false })
      .limit(30),
    supabase
      .from('shipments')
      .select('id, title, tracking_number, status, carrier, created_at')
      .eq('tenant_id', tenantId)
      .in('status', ['in_transit', 'clearing_customs', 'delayed']),
  ]);

  const products = productsData || [];
  const recentOrders = recentOrdersData || [];
  const priorOrders = priorOrdersData || [];
  const customers = customersData || [];
  const shipments = shipmentsData || [];

  // Calculate 14-day product sales velocity
  const productSalesMap = new Map<string, number>();
  for (const order of recentOrders) {
    const items = (order.order_items as unknown as Array<{ product_id: string; quantity: number }>) || [];
    for (const item of items) {
      const current = productSalesMap.get(item.product_id) || 0;
      productSalesMap.set(item.product_id, current + (item.quantity || 1));
    }
  }

  // Run modular rule evaluators
  const insights: BusinessInsight[] = [
    ...evaluateEmptyStoreInsights(products.length, recentOrders.length + priorOrders.length, customers.length),
    ...evaluateInventoryInsights(products, productSalesMap),
    ...evaluateMarginInsights(products),
    ...evaluateCustomerCreditInsights(customers),
    ...evaluateLogisticsAndVipInsights(shipments, customers, now),
  ];

  // Sales Velocity Surge Rule
  const last7dRevenue = recentOrders
    .filter((o) => new Date(o.created_at) >= new Date(sevenDaysAgo))
    .reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);
  const prior7dRevenue = priorOrders.reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);

  if (last7dRevenue > 0 && prior7dRevenue > 0) {
    const growthPct = ((last7dRevenue - prior7dRevenue) / prior7dRevenue) * 100;
    if (growthPct >= 20) {
      insights.push({
        id: 'velocity-surge-weekly',
        category: 'velocity',
        severity: 'opportunity',
        title: `Sales Velocity Surging (+${growthPct.toFixed(0)}%)`,
        observation: `Revenue reached ${formatCurrency(last7dRevenue, 'GHS')} in the last 7 days compared to ${formatCurrency(prior7dRevenue, 'GHS')} prior.`,
        impact: 'Strong purchasing demand signals high customer interest and product-market fit.',
        recommendation: 'Capitalize on sales momentum by featuring top-selling items and running promotions.',
        metricBadge: { label: 'Growth', value: `+${growthPct.toFixed(0)}%`, isPositive: true },
        action: { label: 'View Profit Velocity', href: '/dashboard/profitability', type: 'internal_link' },
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Sort: Critical -> Warning -> Opportunity -> Info
  const severityOrder: Record<string, number> = { critical: 0, warning: 1, opportunity: 2, info: 3 };
  insights.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const summary: InsightsSummary = {
    totalCount: insights.length,
    criticalCount: insights.filter((i) => i.severity === 'critical').length,
    warningCount: insights.filter((i) => i.severity === 'warning').length,
    opportunityCount: insights.filter((i) => i.severity === 'opportunity').length,
    infoCount: insights.filter((i) => i.severity === 'info').length,
  };

  return {
    summary,
    insights,
  };
}
