'use server';

import { createClient } from '@/lib/supabase/server';

export interface MetricValue {
  value: number;
  change?: number;
  diff: number;
}

export interface DashboardMetrics {
  totalSales: MetricValue;
  totalOrders: MetricValue;
  totalCustomers: MetricValue;
  grossMargin: MetricValue;
  topProducts: {
    id: string;
    name: string;
    price: number;
    quantitySold?: number;
    image_url: string | null;
  }[];
  salesChart: {
    date: string;
    sales: number;
  }[];
  attention: {
    purchaseOrders: { id: string; supplierName: string; units: number; preOrders: number; eta: string }[];
    lowStock: { id: string; name: string; size: string; remaining: number; avgWeeklySales: number }[];
    supplierBalances: { id: string; supplierName: string; balance: number }[];
  };
  intelligence: {
    velocityInsight: string;
    supplyInsight: string[];
    recommendation: string;
  };
  incoming: { origin: string; id: string; units: number; eta: string; preOrders: number } | null;
}

export async function getDashboardMetrics(period: 'today' | '7d' | '30d' | '90d' = 'today'): Promise<DashboardMetrics> {
  const supabase = await createClient();

  // Dual-layer security: explicit auth check + RLS
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let days = 30;
  if (period === 'today') days = 1;
  if (period === '7d') days = 7;
  if (period === '90d') days = 90;

  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!tenantUser?.tenant_id) {
    return {
      totalSales: { value: 0, diff: 0 },
      totalOrders: { value: 0, diff: 0 },
      totalCustomers: { value: 0, diff: 0 },
      grossMargin: { value: 0, diff: 0 },
      topProducts: [],
      salesChart: [],
      attention: {
        purchaseOrders: [],
        lowStock: [],
        supplierBalances: [],
      },
      intelligence: {
        velocityInsight: 'No store data found for this account.',
        supplyInsight: [],
        recommendation: 'Please contact support or complete merchant onboarding.',
      },
      incoming: null,
    };
  }

  let lowStockThreshold = 10;
  const { data: settings } = await supabase
    .from('tenant_settings')
    .select('low_stock_threshold')
    .eq('tenant_id', tenantUser.tenant_id)
    .maybeSingle();

  if (settings && typeof (settings as Record<string, unknown>).low_stock_threshold === 'number') {
    lowStockThreshold = (settings as Record<string, unknown>).low_stock_threshold as number;
  }

  // Call RPC for aggregated metrics with graceful fallback
  const { data: metricsData, error: metricsError } = await supabase.rpc('get_dashboard_metrics', {
    p_days: days,
  });

  if (metricsError) {
    console.error('Error fetching dashboard metrics RPC:', JSON.stringify(metricsError));
  }

  interface DashboardMetricsRpcResult {
    current_sales: number;
    previous_sales: number;
    current_orders: number;
    previous_orders: number;
    current_cost: number;
    previous_cost: number;
    current_customers: number;
    total_customers: number;
    sales_chart: { date: string; sales: number; orders: number }[];
    top_products: { name: string; revenue: number; quantity: number }[];
  }

  // When the RPC errors or returns nothing, fall back to a fully zeroed result
  // so downstream arithmetic yields 0, not NaN, from `undefined` fields.
  const DEFAULT_DASHBOARD_METRICS: DashboardMetricsRpcResult = {
    current_sales: 0,
    previous_sales: 0,
    current_orders: 0,
    previous_orders: 0,
    current_cost: 0,
    previous_cost: 0,
    current_customers: 0,
    total_customers: 0,
    sales_chart: [],
    top_products: [],
  };

  const {
    current_sales,
    previous_sales,
    current_orders,
    previous_orders,
    current_cost,
    previous_cost,
    current_customers,
    total_customers,
    sales_chart,
    top_products,
  } = {
    ...DEFAULT_DASHBOARD_METRICS,
    ...((metricsData && typeof metricsData === 'object' && !Array.isArray(metricsData)
      ? metricsData
      : {}) as Partial<DashboardMetricsRpcResult>),
  } as DashboardMetricsRpcResult;

  const salesDiff = current_sales - previous_sales;
  const salesChange = previous_sales === 0 ? (current_sales > 0 ? undefined : 0) : (salesDiff / previous_sales) * 100;

  const orderDiff = current_orders - previous_orders;
  const orderChange =
    previous_orders === 0 ? (current_orders > 0 ? undefined : 0) : (orderDiff / previous_orders) * 100;

  const currentMargin = current_sales - current_cost;
  const previousMargin = previous_sales - previous_cost;
  const marginDiff = currentMargin - previousMargin;
  const marginChange = previousMargin === 0 ? (currentMargin > 0 ? undefined : 0) : (marginDiff / previousMargin) * 100;

  const customerDiff = current_customers;
  const customerChange =
    total_customers === 0 ? 0 : current_customers === 0 ? 0 : (current_customers / total_customers) * 100;

  // 2. Fetch Attention Items
  // 5A. Incoming Purchase Orders
  const { data: purchaseOrdersData } = await supabase
    .from('purchase_orders')
    .select('id, po_number, tracking_number, eta, suppliers(name, country), purchase_order_items(quantity)')
    .in('status', ['ordered', 'partially_received'])
    .order('eta', { ascending: true })
    .limit(3);

  // 5B. Low Stock Alerts
  const { data: lowStockData } = await supabase
    .from('inventory_levels')
    .select('quantity, product_variants(id, sku, name, products(name))')
    .lt('quantity', lowStockThreshold)
    .limit(3);

  // 5C. Supplier Balances
  const { data: suppliersBal } = await supabase
    .from('suppliers')
    .select('id, name, outstanding_balance')
    .gt('outstanding_balance', 0)
    .limit(3);

  interface DashboardPurchaseOrder {
    id: string;
    po_number?: string;
    tracking_number?: string;
    status?: string;
    eta?: string;
    purchase_order_items?: { quantity?: number }[];
    suppliers?: { name?: string; country?: string }[] | { name?: string; country?: string };
  }

  const purchaseOrdersList = ((purchaseOrdersData as unknown as DashboardPurchaseOrder[]) || []).map((s) => {
    const totalUnits = (s.purchase_order_items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
    const suppName = Array.isArray(s.suppliers) ? s.suppliers[0]?.name : s.suppliers?.name;
    const suppOrigin = Array.isArray(s.suppliers) ? s.suppliers[0]?.country : s.suppliers?.country;

    return {
      id: s.po_number || s.id.substring(0, 8).toUpperCase(),
      supplierName: (suppName || 'Unknown') as string,
      status: s.status as 'Received' | 'In Transit' | 'Delayed',
      origin: (suppOrigin || 'Unknown') as string,
      units: totalUnits,
      preOrders: 0,
      eta: s.eta ? new Date(s.eta).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown',
    };
  });

  const nextPurchaseOrder = purchaseOrdersList.length > 0 ? purchaseOrdersList[0] : null;

  interface RawLowStockItem {
    quantity: number;
    product_variants:
      | {
          id: string;
          sku: string;
          name: string;
          products: { name: string } | { name: string }[] | null;
        }
      | {
          id: string;
          sku: string;
          name: string;
          products: { name: string } | { name: string }[] | null;
        }[]
      | null;
  }

  // Process low stock data and compute velocity (sales in last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Extract variant IDs for bulk sales query
  const variantIds = ((lowStockData as unknown as RawLowStockItem[]) || [])
    .map((ls) => {
      const variant = Array.isArray(ls.product_variants) ? ls.product_variants[0] : ls.product_variants;
      return variant?.id;
    })
    .filter(Boolean) as string[];

  let salesDataBatch: { variant_id: string; quantity: number }[] = [];
  if (variantIds.length > 0) {
    const { data } = await supabase
      .from('order_items')
      .select('variant_id, quantity, orders!inner(created_at, status)')
      .in('variant_id', variantIds)
      .gte('orders.created_at', thirtyDaysAgo)
      .in('orders.status', ['paid', 'dispatched', 'delivered']);
    salesDataBatch = data || [];
  }

  const lowStockList = ((lowStockData as unknown as RawLowStockItem[]) || []).map((ls) => {
    const variant = Array.isArray(ls.product_variants) ? ls.product_variants[0] : ls.product_variants;
    const prod = variant?.products ? (Array.isArray(variant.products) ? variant.products[0] : variant.products) : null;

    const variantId = variant?.id;
    const variantSales = salesDataBatch.filter((item) => item.variant_id === variantId);
    const totalSoldLast30Days = variantSales.reduce((acc, item) => acc + (item.quantity || 0), 0);
    const avgWeeklySales = Math.max(1, Math.round(totalSoldLast30Days / 4.33)); // 4.33 weeks in a month

    return {
      id: variantId || 'unknown',
      name: prod?.name || 'Unknown Product',
      size: variant?.name || 'Default',
      remaining: ls.quantity,
      avgWeeklySales,
    };
  });

  interface RawSupplierBalance {
    id: string;
    name: string;
    outstanding_balance: number | string | null;
  }

  const supplierBalancesList = ((suppliersBal as unknown as RawSupplierBalance[]) || []).map((s) => ({
    id: s.id,
    supplierName: s.name,
    balance: Number(s.outstanding_balance) || 0,
  }));

  // D. Intelligence Engine
  const intelligence = {
    velocityInsight: 'No immediate trends detected in your recent sales data.',
    supplyInsight: ['• Stock levels are generally stable.', '• No major shipments in transit.'],
    recommendation: 'Maintain current reorder strategies.',
  };

  if (lowStockList.length > 0) {
    const topLow = lowStockList[0];
    const daysRemaining = Math.max(1, Math.floor((topLow.remaining / topLow.avgWeeklySales) * 7));

    intelligence.velocityInsight = `Your ${topLow.name} (${topLow.size}) is moving fast. At the current rate of ${topLow.avgWeeklySales} units/week, it will likely sell out in ${daysRemaining} days.`;

    if (nextPurchaseOrder) {
      intelligence.supplyInsight = [
        `• Incoming purchase order (${nextPurchaseOrder.id}) contains ${nextPurchaseOrder.units} units total.`,
        `• Based on current momentum, ${nextPurchaseOrder.preOrders} are spoken for.`,
        `• Net available after delivery: ${nextPurchaseOrder.units - nextPurchaseOrder.preOrders} units.`,
      ];
      intelligence.recommendation = `Do not place another restock order yet. The incoming purchase order from ${nextPurchaseOrder.origin} provides a solid buffer. Re-evaluate after delivery.`;
    } else {
      intelligence.supplyInsight = [
        `• No active purchase orders contain this product.`,
        `• ${topLow.remaining} units left in the warehouse.`,
      ];
      intelligence.recommendation = `Place a purchase order for ${topLow.name} immediately to prevent a stockout event.`;
    }
  }

  return {
    totalSales: { value: current_sales, change: salesChange, diff: salesDiff },
    totalOrders: { value: current_orders, change: orderChange, diff: orderDiff },
    totalCustomers: { value: total_customers || 0, change: customerChange, diff: customerDiff },
    grossMargin: { value: currentMargin, change: marginChange, diff: marginDiff },
    topProducts: (top_products || []).map((p, idx) => ({
      id: `top-prod-${idx}`,
      name: p.name,
      price: Number(p.revenue || 0),
      quantitySold: p.quantity,
      image_url: null,
    })),
    salesChart: sales_chart || [],
    attention: {
      purchaseOrders: purchaseOrdersList,
      lowStock: lowStockList,
      supplierBalances: supplierBalancesList,
    },
    intelligence,
    incoming: nextPurchaseOrder,
  };
}
