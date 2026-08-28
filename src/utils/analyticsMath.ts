import {
  AnalyticsData,
  AnalyticsFilterPeriod,
  AnalyticsOverviewMetrics,
  CategoryAnalytics,
  ChannelPerformance,
  CustomerCohortItem,
  CustomerCohortMetrics,
  DayOfWeekTrading,
  HourlyTrading,
  OrderStatusFunnelItem,
  PaymentMethodDistribution,
  PeakTradingAnalytics,
  SalesTimelinePoint,
  TopProductAnalytics,
} from '@/types/analytics';

export interface RawAnalyticsInput {
  period: AnalyticsFilterPeriod;
  orders: Array<{
    id: string;
    total_amount: number | null;
    status: string | null;
    channel: string | null;
    payment_method: string | null;
    created_at: string;
    customer_id?: string | null;
    customers?: { id: string; name: string | null; phone: string | null; created_at: string } | null;
    order_items?: Array<{
      variant_id?: string | null;
      quantity?: number | null;
      unit_price?: number | null;
      total_price?: number | null;
      product_variants?: {
        product_id?: string | null;
        sku?: string | null;
        products?: { id: string; name: string; category_id?: string | null } | null;
      } | null;
    }> | null;
  }>;
  priorOrders: Array<{
    total_amount: number | null;
    status: string | null;
    created_at?: string;
  }>;
  allCustomers?: Array<{
    id: string;
    name: string | null;
    phone: string | null;
    created_at: string;
  }>;
  categories: Array<{
    id: string;
    name: string;
  }>;
  products: Array<{
    id: string;
    name: string;
    category_id?: string | null;
  }>;
}

export function computeAnalyticsData(input: RawAnalyticsInput): AnalyticsData {
  const { period, orders, priorOrders, categories, products } = input;

  // 1. Filter valid non-cancelled orders for GMV calculations
  const completedOrders = orders.filter((o) => o.status !== 'cancelled' && o.status !== 'draft');
  const priorCompleted = priorOrders.filter((o) => o.status !== 'cancelled' && o.status !== 'draft');

  const gmv = completedOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const priorGmv = priorCompleted.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

  const ordersCount = completedOrders.length;
  const priorOrdersCount = priorCompleted.length;

  const aov = ordersCount > 0 ? gmv / ordersCount : 0;
  const priorAov = priorOrdersCount > 0 ? priorGmv / priorOrdersCount : 0;

  const gmvChange = priorGmv > 0 ? ((gmv - priorGmv) / priorGmv) * 100 : undefined;
  const ordersChange = priorOrdersCount > 0 ? ((ordersCount - priorOrdersCount) / priorOrdersCount) * 100 : undefined;
  const aovChange = priorAov > 0 ? ((aov - priorAov) / priorAov) * 100 : undefined;

  // 2. Fulfillment rate
  const fulfilledCount = orders.filter((o) => o.status === 'delivered' || o.status === 'paid').length;
  const fulfillmentRatePct = orders.length > 0 ? (fulfilledCount / orders.length) * 100 : 0;

  // 3. Customer Cohorts & Retention
  const customerOrdersMap = new Map<
    string,
    { count: number; spend: number; lastDate: string; name: string; phone: string }
  >();

  completedOrders.forEach((o) => {
    const custId = o.customer_id || (o.customers ? o.customers.id : 'unknown');
    if (!custId || custId === 'unknown') return;

    const current = customerOrdersMap.get(custId) || {
      count: 0,
      spend: 0,
      lastDate: o.created_at,
      name: o.customers?.name || 'Walk-in Customer',
      phone: o.customers?.phone || 'N/A',
    };

    current.count += 1;
    current.spend += Number(o.total_amount) || 0;
    if (new Date(o.created_at) > new Date(current.lastDate)) {
      current.lastDate = o.created_at;
    }
    customerOrdersMap.set(custId, current);
  });

  let newBuyersCount = 0;
  let returningBuyersCount = 0;
  let newBuyersRevenue = 0;
  let returningBuyersRevenue = 0;

  customerOrdersMap.forEach((data) => {
    if (data.count > 1) {
      returningBuyersCount += 1;
      returningBuyersRevenue += data.spend;
    } else {
      newBuyersCount += 1;
      newBuyersRevenue += data.spend;
    }
  });

  const totalUniqueBuyers = customerOrdersMap.size;
  const repeatRatePct = totalUniqueBuyers > 0 ? (returningBuyersCount / totalUniqueBuyers) * 100 : 0;

  const topVipCustomers: CustomerCohortItem[] = Array.from(customerOrdersMap.entries())
    .map(([id, data]) => ({
      id,
      name: data.name,
      phone: data.phone,
      ordersCount: data.count,
      totalSpent: data.spend,
      lastOrderDate: data.lastDate,
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10);

  const customerCohorts: CustomerCohortMetrics = {
    totalUniqueBuyers,
    newBuyersCount,
    returningBuyersCount,
    newBuyersRevenue,
    returningBuyersRevenue,
    repeatRatePct,
    topVipCustomers,
  };

  const metrics: AnalyticsOverviewMetrics = {
    gmv,
    ordersCount,
    aov,
    fulfillmentRatePct,
    repeatCustomerRatePct: repeatRatePct,
    gmvChange,
    ordersChange,
    aovChange,
  };

  // 4. Sales Timeline Series with Prior Overlay
  const timeline = computeTimelineSeries(completedOrders, period);

  // 5. Channel Distribution
  const channels = computeChannelDistribution(completedOrders, gmv);

  // 6. Payment Rails
  const paymentMethods = computePaymentMethods(completedOrders, gmv);

  // 7. Top Products & Categories
  const { topProducts, categoryAnalytics } = computeProductAndCategoryPerformance(
    completedOrders,
    categories,
    products,
    gmv
  );

  // 8. Order Status Funnel
  const statusFunnel = computeStatusFunnel(orders);

  // 9. Peak Trading & Heatmap
  const peakTrading = computePeakTrading(completedOrders, gmv);

  const periodLabels: Record<AnalyticsFilterPeriod, string> = {
    today: 'Today',
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    '90d': 'Last 90 Days',
    ytd: 'Year to Date',
    '1y': 'Past 1 Year',
  };

  return {
    period,
    periodLabel: periodLabels[period] || 'Selected Period',
    metrics,
    timeline,
    channels,
    paymentMethods,
    topProducts,
    categories: categoryAnalytics,
    customerCohorts,
    statusFunnel,
    peakTrading,
  };
}

function computeTimelineSeries(
  orders: RawAnalyticsInput['orders'],
  period: AnalyticsFilterPeriod
): SalesTimelinePoint[] {
  const buckets = new Map<string, { gmv: number; count: number; label: string }>();

  orders.forEach((o) => {
    const d = new Date(o.created_at);
    const dateKey = period === 'today' ? `${String(d.getHours()).padStart(2, '0')}:00` : d.toISOString().split('T')[0];
    const label =
      period === 'today'
        ? `${String(d.getHours()).padStart(2, '0')}:00`
        : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

    const current = buckets.get(dateKey) || { gmv: 0, count: 0, label };
    current.gmv += Number(o.total_amount) || 0;
    current.count += 1;
    buckets.set(dateKey, current);
  });

  return Array.from(buckets.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, val]) => ({
      date,
      label: val.label,
      gmv: val.gmv,
      ordersCount: val.count,
      aov: val.count > 0 ? val.gmv / val.count : 0,
    }));
}

function computePeakTrading(orders: RawAnalyticsInput['orders'], totalGmv: number): PeakTradingAnalytics {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayCounts = Array(7).fill(0);
  const dayGmv = Array(7).fill(0);

  const hourWindows = [
    { label: '06:00 - 10:00', name: 'Early Morning', min: 6, max: 9, count: 0, gmv: 0 },
    { label: '10:00 - 14:00', name: 'Midday Peak', min: 10, max: 13, count: 0, gmv: 0 },
    { label: '14:00 - 18:00', name: 'Afternoon Flow', min: 14, max: 17, count: 0, gmv: 0 },
    { label: '18:00 - 22:00', name: 'Evening Rush', min: 18, max: 21, count: 0, gmv: 0 },
    { label: '22:00 - 06:00', name: 'Late Night', min: 22, max: 5, count: 0, gmv: 0 },
  ];

  orders.forEach((o) => {
    const d = new Date(o.created_at);
    const day = d.getDay();
    const hr = d.getHours();
    const amt = Number(o.total_amount) || 0;

    dayCounts[day] += 1;
    dayGmv[day] += amt;

    const win = hourWindows.find((w) => (w.min <= w.max ? hr >= w.min && hr <= w.max : hr >= w.min || hr <= w.max));
    if (win) {
      win.count += 1;
      win.gmv += amt;
    }
  });

  let maxDayIdx = 5; // Friday default
  let maxDayGmv = -1;
  dayGmv.forEach((val, idx) => {
    if (val > maxDayGmv) {
      maxDayGmv = val;
      maxDayIdx = idx;
    }
  });

  let maxWin = hourWindows[1]; // Midday default
  let maxWinGmv = -1;
  hourWindows.forEach((w) => {
    if (w.gmv > maxWinGmv) {
      maxWinGmv = w.gmv;
      maxWin = w;
    }
  });

  const dayOfWeekBreakdown: DayOfWeekTrading[] = dayNames.map((name, idx) => ({
    dayName: name,
    ordersCount: dayCounts[idx],
    gmv: dayGmv[idx],
    sharePct: totalGmv > 0 ? (dayGmv[idx] / totalGmv) * 100 : 0,
  }));

  const hourlyBreakdown: HourlyTrading[] = hourWindows.map((w) => ({
    windowLabel: w.label,
    periodName: w.name,
    ordersCount: w.count,
    gmv: w.gmv,
    sharePct: totalGmv > 0 ? (w.gmv / totalGmv) * 100 : 0,
  }));

  return {
    busiestDay: orders.length > 0 ? dayNames[maxDayIdx] : 'None recorded',
    busiestTimeWindow: orders.length > 0 ? `${maxWin.name} (${maxWin.label})` : 'None recorded',
    dayOfWeekBreakdown,
    hourlyBreakdown,
  };
}

function computeChannelDistribution(orders: RawAnalyticsInput['orders'], totalGmv: number): ChannelPerformance[] {
  const channelMap = new Map<string, { gmv: number; count: number }>();
  const labels: Record<string, string> = {
    whatsapp: 'WhatsApp Bot & Chat',
    storefront: 'Online Storefront',
    pos: 'In-Store POS',
    instagram: 'Instagram Direct',
    phone: 'Phone & Direct Call',
  };

  orders.forEach((o) => {
    const ch = (o.channel || 'whatsapp').toLowerCase();
    const current = channelMap.get(ch) || { gmv: 0, count: 0 };
    current.gmv += Number(o.total_amount) || 0;
    current.count += 1;
    channelMap.set(ch, current);
  });

  if (channelMap.size === 0) {
    return [
      { channel: 'whatsapp', label: 'WhatsApp Bot & Chat', gmv: 0, ordersCount: 0, sharePct: 0 },
      { channel: 'storefront', label: 'Online Storefront', gmv: 0, ordersCount: 0, sharePct: 0 },
      { channel: 'pos', label: 'In-Store POS', gmv: 0, ordersCount: 0, sharePct: 0 },
    ];
  }

  return Array.from(channelMap.entries())
    .map(([channel, data]) => ({
      channel,
      label: labels[channel] || channel.toUpperCase(),
      gmv: data.gmv,
      ordersCount: data.count,
      sharePct: totalGmv > 0 ? (data.gmv / totalGmv) * 100 : 0,
    }))
    .sort((a, b) => b.gmv - a.gmv);
}

function computePaymentMethods(orders: RawAnalyticsInput['orders'], totalGmv: number): PaymentMethodDistribution[] {
  const methodMap = new Map<string, { volume: number; count: number }>();
  const labels: Record<string, string> = {
    mtn_momo: 'MTN Mobile Money',
    telecel_cash: 'Telecel Cash',
    at_money: 'AT Money',
    cash_on_delivery: 'Cash on Delivery (COD)',
    cash: 'Cash / Manual',
    card: 'Credit / Debit Card',
    bank_transfer: 'Bank Transfer',
  };

  orders.forEach((o) => {
    const rawMethod = (o.payment_method || 'mtn_momo').toLowerCase();
    const current = methodMap.get(rawMethod) || { volume: 0, count: 0 };
    current.volume += Number(o.total_amount) || 0;
    current.count += 1;
    methodMap.set(rawMethod, current);
  });

  return Array.from(methodMap.entries())
    .map(([method, data]) => ({
      method,
      label: labels[method] || method.replace('_', ' ').toUpperCase(),
      volume: data.volume,
      count: data.count,
      sharePct: totalGmv > 0 ? (data.volume / totalGmv) * 100 : 0,
    }))
    .sort((a, b) => b.volume - a.volume);
}

function computeProductAndCategoryPerformance(
  orders: RawAnalyticsInput['orders'],
  categories: RawAnalyticsInput['categories'],
  products: RawAnalyticsInput['products'],
  totalGmv: number
): { topProducts: TopProductAnalytics[]; categoryAnalytics: CategoryAnalytics[] } {
  const productSalesMap = new Map<
    string,
    { name: string; sku?: string; categoryId?: string; units: number; revenue: number }
  >();
  const categorySalesMap = new Map<string, { name: string; units: number; revenue: number; productCount: number }>();

  const categoryNameMap = new Map(categories.map((c) => [c.id, c.name]));
  categories.forEach((c) => {
    const prodCount = products.filter((p) => p.category_id === c.id).length;
    categorySalesMap.set(c.id, { name: c.name, units: 0, revenue: 0, productCount: prodCount });
  });

  orders.forEach((o) => {
    o.order_items?.forEach((item) => {
      const prod = item.product_variants?.products;
      const prodId = prod?.id || 'unknown';
      const prodName = prod?.name || 'Standard Item';
      const sku = item.product_variants?.sku || undefined;
      const categoryId = prod?.category_id || 'uncategorized';

      const currentProd = productSalesMap.get(prodId) || {
        name: prodName,
        sku,
        categoryId,
        units: 0,
        revenue: 0,
      };

      const quantity = Number(item.quantity) || 1;
      const revenue = Number(item.total_price) || (Number(item.unit_price) || 0) * quantity;

      currentProd.units += quantity;
      currentProd.revenue += revenue;
      productSalesMap.set(prodId, currentProd);

      if (categoryId && categorySalesMap.has(categoryId)) {
        const cat = categorySalesMap.get(categoryId)!;
        cat.units += quantity;
        cat.revenue += revenue;
      }
    });
  });

  const topProducts: TopProductAnalytics[] = Array.from(productSalesMap.entries())
    .map(([id, data]) => ({
      id,
      name: data.name,
      sku: data.sku,
      categoryName: (data.categoryId && categoryNameMap.get(data.categoryId)) || 'General',
      unitsSold: data.units,
      revenue: data.revenue,
      avgPrice: data.units > 0 ? data.revenue / data.units : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const categoryAnalytics: CategoryAnalytics[] = Array.from(categorySalesMap.entries())
    .map(([id, data]) => ({
      id,
      name: data.name,
      productCount: data.productCount,
      unitsSold: data.units,
      revenue: data.revenue,
      sharePct: totalGmv > 0 ? (data.revenue / totalGmv) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  return { topProducts, categoryAnalytics };
}

function computeStatusFunnel(orders: RawAnalyticsInput['orders']): OrderStatusFunnelItem[] {
  const statusLabels: Record<string, string> = {
    draft: 'Draft Orders',
    pending_payment: 'Pending Payment',
    paid: 'Paid & Processing',
    dispatched: 'In Transit / Dispatched',
    delivered: 'Delivered & Complete',
    cancelled: 'Cancelled',
  };

  const statusMap = new Map<string, { count: number; value: number }>();
  const total = orders.length;

  orders.forEach((o) => {
    const st = o.status || 'pending_payment';
    const current = statusMap.get(st) || { count: 0, value: 0 };
    current.count += 1;
    current.value += Number(o.total_amount) || 0;
    statusMap.set(st, current);
  });

  return ['pending_payment', 'paid', 'dispatched', 'delivered', 'cancelled'].map((st) => {
    const data = statusMap.get(st) || { count: 0, value: 0 };
    return {
      status: st,
      label: statusLabels[st] || st.toUpperCase(),
      count: data.count,
      value: data.value,
      sharePct: total > 0 ? (data.count / total) * 100 : 0,
    };
  });
}
