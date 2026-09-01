'use server';

import { createClient } from '@/lib/supabase/server';
import {
  ProfitPeriod,
  ProfitabilityData,
  ProfitabilityMetrics,
  ProductProfitability,
  CategoryProfitability,
  ChannelProfitability,
  ProfitTimelinePoint,
  MarginHealthStatus,
} from '@/types/profitability';
import { format, subDays, startOfDay } from 'date-fns';

function getMarginHealth(marginPct: number): MarginHealthStatus {
  if (marginPct >= 40) return 'healthy';
  if (marginPct >= 20) return 'moderate';
  if (marginPct >= 0) return 'warning';
  return 'negative';
}

export async function getProfitabilityData(period: ProfitPeriod = '30d'): Promise<ProfitabilityData> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: tenantUser } = await supabase.from('tenant_users').select('tenant_id').eq('user_id', user.id).single();

  if (!tenantUser?.tenant_id) throw new Error('Tenant not found');
  const tenantId = tenantUser.tenant_id;

  // Calculate Date Boundaries
  const now = new Date();
  let fromDate: Date;
  switch (period) {
    case 'today':
      fromDate = startOfDay(now);
      break;
    case '7d':
      fromDate = subDays(now, 7);
      break;
    case '90d':
      fromDate = subDays(now, 90);
      break;
    case '1y':
      fromDate = subDays(now, 365);
      break;
    case '30d':
    default:
      fromDate = subDays(now, 30);
      break;
  }
  const fromIso = fromDate.toISOString();

  // 1. Fetch Tenant Orders & Items in parallel
  const [
    { data: ordersData },
    { data: productsData },
    { data: categoriesData },
    { data: expensesData },
    { data: shipmentsData },
    { data: paymentsData },
  ] = await Promise.all([
    supabase
      .from('orders')
      .select('id, total_amount, status, created_at, sales_channel')
      .eq('tenant_id', tenantId)
      .neq('status', 'cancelled')
      .gte('created_at', fromIso)
      .order('created_at', { ascending: true }),
    supabase.from('products').select('id, name, sku, cost_price, selling_price, category_id').eq('tenant_id', tenantId),
    supabase.from('product_categories').select('id, name').eq('tenant_id', tenantId),
    supabase
      .from('expenses')
      .select('id, amount, category, expense_date, created_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', fromIso),
    supabase
      .from('shipments')
      .select('id, shipping_cost, customs_duty, created_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', fromIso),
    supabase
      .from('payments')
      .select('id, amount, fee, payment_date, created_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', fromIso),
  ]);

  const orders = ordersData || [];
  const products = productsData || [];
  const categories = categoriesData || [];
  const expenses = expensesData || [];
  const shipments = shipmentsData || [];
  const payments = paymentsData || [];

  const orderIds = orders.map((o) => o.id);
  let orderItems: Array<{
    order_id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }> = [];

  if (orderIds.length > 0) {
    const { data: items } = await supabase
      .from('order_items')
      .select('order_id, product_id, quantity, unit_price, subtotal')
      .in('order_id', orderIds);
    orderItems = items || [];
  }

  // Maps for quick lookup
  const productMap = new Map(products.map((p) => [p.id, p]));
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const orderMap = new Map(orders.map((o) => [o.id, o]));

  // Aggregation Buckets
  let grossRevenue = 0;
  let totalCogs = 0;
  let totalUnitsSold = 0;

  const productAggMap = new Map<
    string,
    { units: number; revenue: number; cogs: number; name: string; sku: string | null; categoryName: string }
  >();

  const categoryAggMap = new Map<
    string,
    { name: string; productIds: Set<string>; units: number; revenue: number; cogs: number }
  >();

  const channelAggMap = new Map<string, { orderCount: number; revenue: number; cogs: number }>();

  const timelineMap = new Map<string, { revenue: number; cogs: number; expenses: number }>();

  // Process Order Items
  for (const item of orderItems) {
    const prod = productMap.get(item.product_id);
    const order = orderMap.get(item.order_id);
    const itemRev = item.subtotal || item.unit_price * item.quantity;
    const costPrice = prod?.cost_price || 0;
    const itemCogs = costPrice * item.quantity;

    grossRevenue += itemRev;
    totalCogs += itemCogs;
    totalUnitsSold += item.quantity;

    // Product Aggregation
    const pId = item.product_id;
    const prodName = prod?.name || 'Unknown Product';
    const catName = (prod?.category_id && categoryMap.get(prod.category_id)) || 'Uncategorized';
    const currentProd = productAggMap.get(pId) || {
      units: 0,
      revenue: 0,
      cogs: 0,
      name: prodName,
      sku: prod?.sku || null,
      categoryName: catName,
    };
    currentProd.units += item.quantity;
    currentProd.revenue += itemRev;
    currentProd.cogs += itemCogs;
    productAggMap.set(pId, currentProd);

    // Category Aggregation
    const catKey = prod?.category_id || 'uncategorized';
    const currentCat = categoryAggMap.get(catKey) || {
      name: catName,
      productIds: new Set<string>(),
      units: 0,
      revenue: 0,
      cogs: 0,
    };
    currentCat.productIds.add(pId);
    currentCat.units += item.quantity;
    currentCat.revenue += itemRev;
    currentCat.cogs += itemCogs;
    categoryAggMap.set(catKey, currentCat);

    // Channel Aggregation
    const channelKey = order?.sales_channel || 'in_store';
    const currentChannel = channelAggMap.get(channelKey) || { orderCount: 0, revenue: 0, cogs: 0 };
    currentChannel.revenue += itemRev;
    currentChannel.cogs += itemCogs;
    channelAggMap.set(channelKey, currentChannel);

    // Timeline Aggregation
    if (order?.created_at) {
      const dateKey = format(new Date(order.created_at), 'yyyy-MM-dd');
      const point = timelineMap.get(dateKey) || { revenue: 0, cogs: 0, expenses: 0 };
      point.revenue += itemRev;
      point.cogs += itemCogs;
      timelineMap.set(dateKey, point);
    }
  }

  // Count distinct orders per channel
  for (const order of orders) {
    const channelKey = order.sales_channel || 'in_store';
    const currentChannel = channelAggMap.get(channelKey) || { orderCount: 0, revenue: 0, cogs: 0 };
    currentChannel.orderCount += 1;
    channelAggMap.set(channelKey, currentChannel);
  }

  // Expenses & Logistics Sums
  let operatingExpenses = 0;
  for (const exp of expenses) {
    const amt = Number(exp.amount) || 0;
    operatingExpenses += amt;
    const dateKey = format(new Date(exp.expense_date || exp.created_at), 'yyyy-MM-dd');
    const point = timelineMap.get(dateKey) || { revenue: 0, cogs: 0, expenses: 0 };
    point.expenses += amt;
    timelineMap.set(dateKey, point);
  }

  let logisticsFreightCost = 0;
  for (const ship of shipments) {
    const cost = (Number(ship.shipping_cost) || 0) + (Number(ship.customs_duty) || 0);
    logisticsFreightCost += cost;
  }

  let gatewayFees = 0;
  for (const pay of payments) {
    gatewayFees += Number(pay.fee) || 0;
  }

  const grossProfit = grossRevenue - totalCogs;
  const grossMarginPct = grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0;
  const totalExpenses = operatingExpenses + logisticsFreightCost + gatewayFees;
  const netProfit = grossProfit - totalExpenses;
  const netMarginPct = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

  const metrics: ProfitabilityMetrics = {
    grossRevenue,
    cogs: totalCogs,
    grossProfit,
    grossMarginPct,
    operatingExpenses,
    logisticsFreightCost,
    gatewayFees,
    totalExpenses,
    netProfit,
    netMarginPct,
    totalOrdersCount: orders.length,
    totalUnitsSold,
  };

  // Format Products List
  const productsList: ProductProfitability[] = Array.from(productAggMap.entries())
    .map(([productId, val]) => {
      const pProfit = val.revenue - val.cogs;
      const pMargin = val.revenue > 0 ? (pProfit / val.revenue) * 100 : 0;
      return {
        productId,
        name: val.name,
        categoryName: val.categoryName,
        sku: val.sku,
        unitsSold: val.units,
        averageSellingPrice: val.units > 0 ? val.revenue / val.units : 0,
        averageCostPrice: val.units > 0 ? val.cogs / val.units : 0,
        totalRevenue: val.revenue,
        totalCogs: val.cogs,
        grossProfit: pProfit,
        marginPct: pMargin,
        healthStatus: getMarginHealth(pMargin),
      };
    })
    .sort((a, b) => b.grossProfit - a.grossProfit);

  // Format Categories List
  const categoriesList: CategoryProfitability[] = Array.from(categoryAggMap.entries())
    .map(([categoryId, val]) => {
      const cProfit = val.revenue - val.cogs;
      const cMargin = val.revenue > 0 ? (cProfit / val.revenue) * 100 : 0;
      const share = grossProfit > 0 ? (Math.max(0, cProfit) / grossProfit) * 100 : 0;
      return {
        categoryId,
        categoryName: val.name,
        productCount: val.productIds.size,
        unitsSold: val.units,
        totalRevenue: val.revenue,
        totalCogs: val.cogs,
        grossProfit: cProfit,
        marginPct: cMargin,
        profitSharePct: share,
      };
    })
    .sort((a, b) => b.grossProfit - a.grossProfit);

  // Format Channels List
  const channelsList: ChannelProfitability[] = [
    { channel: 'whatsapp', label: 'WhatsApp Bot / Direct' },
    { channel: 'in_store', label: 'POS / Physical Store' },
    { channel: 'instagram', label: 'Instagram Direct' },
    { channel: 'online_store', label: 'Online Storefront' },
  ].map((ch) => {
    const val = channelAggMap.get(ch.channel) || { orderCount: 0, revenue: 0, cogs: 0 };
    const chProfit = val.revenue - val.cogs;
    const chMargin = val.revenue > 0 ? (chProfit / val.revenue) * 100 : 0;
    return {
      channel: ch.channel as ChannelProfitability['channel'],
      label: ch.label,
      orderCount: val.orderCount,
      totalRevenue: val.revenue,
      grossProfit: chProfit,
      marginPct: chMargin,
    };
  });

  // Format Timeline
  const timeline: ProfitTimelinePoint[] = Array.from(timelineMap.entries())
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([dateStr, val]) => ({
      date: dateStr,
      label: format(new Date(dateStr), 'MMM d'),
      revenue: val.revenue,
      cogs: val.cogs,
      expenses: val.expenses,
      netProfit: val.revenue - val.cogs - val.expenses,
    }));

  return {
    period,
    dateRange: {
      from: format(fromDate, 'yyyy-MM-dd'),
      to: format(now, 'yyyy-MM-dd'),
    },
    metrics,
    products: productsList,
    categories: categoriesList,
    channels: channelsList,
    timeline,
  };
}
