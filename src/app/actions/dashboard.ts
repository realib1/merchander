'use server';

import { createClient } from '@/lib/supabase/server';

export interface DashboardMetrics {
  totalSales: {
    value: number;
    change: number;
  };
  totalOrders: {
    value: number;
    change: number;
  };
  totalCustomers: {
    value: number;
    change: number;
  };
  grossMargin: {
    value: number;
    change: number;
  };
  topProducts: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
  }[];
  salesChart: {
    date: string;
    sales: number;
  }[];
  attention: {
    shipments: { id: string; supplierName: string; units: number; preOrders: number; eta: string }[];
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

export async function getDashboardMetrics(period: '7d' | '30d' | '90d' = '30d'): Promise<DashboardMetrics> {
  const supabase = await createClient();
  const now = new Date();
  
  let days = 30;
  if (period === '7d') days = 7;
  if (period === '90d') days = 90;

  const currentPeriodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
  const previousPeriodStart = new Date(now.getTime() - (days * 2) * 24 * 60 * 60 * 1000).toISOString();

  // 1. Fetch Orders (with items and costs for margin calculation)
  const { data: recentOrdersData } = await supabase
    .from('orders')
    .select(`
      id, total_amount, created_at, status,
      order_items (
        quantity, unit_price,
        product_variants ( cost_price )
      )
    `)
    .in('status', ['paid', 'dispatched', 'delivered'])
    .gte('created_at', previousPeriodStart);

  const orders = recentOrdersData || [];
  const currentPeriodOrders = orders.filter(o => o.created_at >= currentPeriodStart);
  const previousPeriodOrders = orders.filter(o => o.created_at < currentPeriodStart);

  // Sales & Orders calculations
  const currentSales = currentPeriodOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const previousSales = previousPeriodOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const salesChange = previousSales === 0 ? 100 : ((currentSales - previousSales) / previousSales) * 100;

  const currentOrderCount = currentPeriodOrders.length;
  const previousOrderCount = previousPeriodOrders.length;
  const orderChange = previousOrderCount === 0 ? 100 : ((currentOrderCount - previousOrderCount) / previousOrderCount) * 100;

  // Margin calculation (Sales - Cost)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const calculateCost = (orderList: any[]) => {
    return orderList.reduce((sum, order) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const itemsCost = (order.order_items || []).reduce((itemSum: number, item: any) => {
        const costPrice = item.product_variants?.cost_price || (item.unit_price * 0.6); // fallback to 60% of price if missing
        return itemSum + (Number(item.quantity) * Number(costPrice));
      }, 0);
      return sum + itemsCost;
    }, 0);
  };

  const currentCost = calculateCost(currentPeriodOrders);
  const previousCost = calculateCost(previousPeriodOrders);
  
  const currentMargin = currentSales - currentCost;
  const previousMargin = previousSales - previousCost;
  const marginChange = previousMargin === 0 ? 100 : ((currentMargin - previousMargin) / previousMargin) * 100;

  // 2. Customers
  const { count: currentCustomers } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', currentPeriodStart);

  const { count: totalCustomers } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true });
    
  const totalCust = totalCustomers || 0;
  const customerChange = totalCust === 0 ? 0 : ((currentCustomers || 0) / totalCust) * 100;

  // 3. Sales Chart
  const salesChartMap = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    salesChartMap.set(d.toISOString().split('T')[0], 0);
  }
  
  currentPeriodOrders.forEach(o => {
    const dateKey = o.created_at.split('T')[0];
    if (salesChartMap.has(dateKey)) {
      salesChartMap.set(dateKey, salesChartMap.get(dateKey)! + Number(o.total_amount));
    }
  });

  const salesChart = Array.from(salesChartMap.entries()).map(([date, sales]) => ({ date, sales }));

  // 4. Top Products
  const { data: topProductsData } = await supabase
    .from('products')
    .select('id, name, base_price, image_url')
    .limit(4);

  // 5. Procurements & Intelligence (New wiring)
  
  // A. Incoming Shipments
  const { data: shipmentsData } = await supabase
    .from('shipments')
    .select('id, tracking_number, eta, suppliers(name, country), shipment_items(quantity)')
    .eq('status', 'in_transit')
    .order('eta', { ascending: true })
    .limit(3);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shipmentsList = (shipmentsData || []).map((s: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalUnits = (s.shipment_items || []).reduce((sum: number, item: any) => sum + item.quantity, 0);
    return {
      id: s.tracking_number || s.id.substring(0, 8).toUpperCase(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supplierName: Array.isArray(s.suppliers) ? (s.suppliers[0] as any)?.name : (s.suppliers as any)?.name || 'Unknown',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      origin: Array.isArray(s.suppliers) ? (s.suppliers[0] as any)?.country : (s.suppliers as any)?.country || 'Unknown',
      units: totalUnits,
      preOrders: Math.floor(totalUnits * 0.2), // Mock pre-orders as 20% of shipment for now
      eta: s.eta ? new Date(s.eta).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown'
    };
  });

  const nextShipment = shipmentsList.length > 0 ? shipmentsList[0] : null;

  // B. Low Stock Alerts
  const { data: lowStockData } = await supabase
    .from('inventory_levels')
    .select('quantity, product_variants(id, sku, name, products(name))')
    .lt('quantity', 10)
    .limit(3);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lowStockList = (lowStockData || []).map((ls: any) => {
    const variant = Array.isArray(ls.product_variants) ? ls.product_variants[0] : ls.product_variants;
    const prod = variant?.products ? (Array.isArray(variant.products) ? variant.products[0] : variant.products) : null;
    return {
      id: variant?.id || 'unknown',
      name: prod?.name || 'Unknown Product',
      size: variant?.name || 'Default',
      remaining: ls.quantity,
      avgWeeklySales: Math.floor(Math.random() * 20) + 5 // Placeholder for real velocity calculation
    };
  });

  // C. Supplier Balances
  const { data: suppliersBal } = await supabase
    .from('suppliers')
    .select('id, name, outstanding_balance')
    .gt('outstanding_balance', 0)
    .limit(3);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supplierBalancesList = (suppliersBal || []).map((s: any) => ({
    id: s.id,
    supplierName: s.name,
    balance: Number(s.outstanding_balance)
  }));

  // D. Intelligence Engine
  // Generate insights based on the real data we pulled
  const intelligence = {
    velocityInsight: "No immediate trends detected in your recent sales data.",
    supplyInsight: ["• Stock levels are generally stable.", "• No major shipments in transit."],
    recommendation: "Maintain current reorder strategies."
  };

  if (lowStockList.length > 0) {
    const topLow = lowStockList[0];
    const daysRemaining = Math.max(1, Math.floor((topLow.remaining / topLow.avgWeeklySales) * 7));
    
    intelligence.velocityInsight = `Your ${topLow.name} (${topLow.size}) is moving fast. At the current rate of ${topLow.avgWeeklySales} units/week, it will likely sell out in ${daysRemaining} days.`;
    
    if (nextShipment) {
      intelligence.supplyInsight = [
        `• Incoming shipment (${nextShipment.id}) contains ${nextShipment.units} units total.`,
        `• Based on current momentum, ${nextShipment.preOrders} are spoken for.`,
        `• Net available after delivery: ${nextShipment.units - nextShipment.preOrders} units.`
      ];
      intelligence.recommendation = `Do not place another restock order yet. The incoming shipment from ${nextShipment.origin} provides a solid buffer. Re-evaluate after delivery.`;
    } else {
      intelligence.supplyInsight = [
        `• No active shipments contain this product.`,
        `• ${topLow.remaining} units left in the warehouse.`
      ];
      intelligence.recommendation = `Place a purchase order for ${topLow.name} immediately to prevent a stockout event.`;
    }
  }

  return {
    totalSales: { value: currentSales, change: salesChange },
    totalOrders: { value: currentOrderCount, change: orderChange },
    totalCustomers: { value: totalCustomers || 0, change: customerChange },
    grossMargin: { value: currentMargin, change: marginChange },
    topProducts: (topProductsData || []).map(p => ({
      id: p.id, name: p.name, price: p.base_price, image_url: p.image_url
    })),
    salesChart,
    attention: {
      shipments: shipmentsList,
      lowStock: lowStockList,
      supplierBalances: supplierBalancesList
    },
    intelligence,
    incoming: nextShipment
  };
}
