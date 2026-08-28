import { BusinessInsight } from '@/types/insights';
import { formatCurrency } from '@/utils/format';
import { differenceInDays } from 'date-fns';

export interface InsightProduct {
  id: string;
  name: string;
  sku: string | null;
  stock_quantity: number | null;
  cost_price: number | null;
  selling_price: number | null;
}

export interface InsightCustomer {
  id: string;
  name: string;
  phone: string | null;
  credit_balance: number | null;
  total_spent: number | null;
  updated_at: string | null;
}

export interface InsightShipment {
  id: string;
  title: string | null;
  tracking_number: string | null;
  status: string;
  carrier: string | null;
  created_at: string;
}

export function evaluateInventoryInsights(
  products: InsightProduct[],
  productSalesMap: Map<string, number>
): BusinessInsight[] {
  const insights: BusinessInsight[] = [];

  for (const prod of products) {
    const unitsSold14d = productSalesMap.get(prod.id) || 0;
    const currentStock = prod.stock_quantity ?? 0;

    if (unitsSold14d > 0) {
      const dailyVelocity = unitsSold14d / 14;
      const daysOfSupply = currentStock / dailyVelocity;

      if (daysOfSupply <= 4 && currentStock > 0) {
        insights.push({
          id: `stockout-critical-${prod.id}`,
          category: 'inventory',
          severity: 'critical',
          title: `Stockout Imminent: ${prod.name}`,
          observation: `${prod.name} has only ${currentStock} units remaining and is selling ~${dailyVelocity.toFixed(1)} units/day.`,
          impact: `At current sales velocity, stock will be completely exhausted in ~${Math.ceil(daysOfSupply)} days, leading to missed customer orders.`,
          recommendation:
            'Generate a purchase order or contact your supplier immediately to replenish stock before depletion.',
          metricBadge: { label: 'Days Left', value: `~${Math.ceil(daysOfSupply)}d`, isPositive: false },
          action: { label: 'Create Restock PO', href: '/dashboard/purchasing', type: 'internal_link' },
          timestamp: new Date().toISOString(),
        });
      } else if (daysOfSupply <= 9 && currentStock > 0) {
        insights.push({
          id: `stockout-warning-${prod.id}`,
          category: 'inventory',
          severity: 'warning',
          title: `Low Stock Velocity: ${prod.name}`,
          observation: `${prod.name} has ${currentStock} units left with ${Math.ceil(daysOfSupply)} days of inventory coverage.`,
          impact: 'Lead times for supplier procurement may cause a stockout gap if restock is delayed.',
          recommendation: 'Review supplier lead times and prepare next purchase batch.',
          metricBadge: { label: 'Coverage', value: `${Math.ceil(daysOfSupply)} days`, isPositive: false },
          action: { label: 'View Inventory', href: '/dashboard/inventory', type: 'internal_link' },
          timestamp: new Date().toISOString(),
        });
      }
    } else if (currentStock === 0) {
      insights.push({
        id: `stockout-zero-${prod.id}`,
        category: 'inventory',
        severity: 'critical',
        title: `Out of Stock: ${prod.name}`,
        observation: `${prod.name} has 0 units in stock.`,
        impact: 'Customers cannot purchase this item, resulting in immediate lost revenue.',
        recommendation: 'Restock inventory or adjust product availability to Pre-order.',
        metricBadge: { label: 'Stock', value: '0 units', isPositive: false },
        action: { label: 'Restock Now', href: '/dashboard/purchasing', type: 'internal_link' },
        timestamp: new Date().toISOString(),
      });
    }
  }

  return insights;
}

export function evaluateMarginInsights(products: InsightProduct[]): BusinessInsight[] {
  const insights: BusinessInsight[] = [];

  for (const prod of products) {
    const cost = prod.cost_price || 0;
    const price = prod.selling_price || 0;

    if (price > 0 && cost > 0) {
      const profit = price - cost;
      const marginPct = (profit / price) * 100;

      if (profit < 0) {
        insights.push({
          id: `margin-negative-${prod.id}`,
          category: 'margin',
          severity: 'critical',
          title: `Negative Profit: ${prod.name}`,
          observation: `Cost price (${formatCurrency(cost, 'GHS')}) exceeds selling price (${formatCurrency(price, 'GHS')}).`,
          impact: `You lose ${formatCurrency(Math.abs(profit), 'GHS')} on every single unit sold.`,
          recommendation: 'Immediately adjust selling price or negotiate lower supplier cost.',
          metricBadge: { label: 'Unit Loss', value: `-${formatCurrency(Math.abs(profit), 'GHS')}`, isPositive: false },
          action: { label: 'Adjust Price', href: `/dashboard/products/${prod.id}/edit`, type: 'internal_link' },
          timestamp: new Date().toISOString(),
        });
      } else if (marginPct < 15) {
        insights.push({
          id: `margin-low-${prod.id}`,
          category: 'margin',
          severity: 'warning',
          title: `Thin Gross Margin: ${prod.name}`,
          observation: `Gross margin is only ${marginPct.toFixed(1)}% (${formatCurrency(profit, 'GHS')} profit per unit).`,
          impact: 'Thin margins may not absorb shipping freight, gateway fees, or delivery overhead.',
          recommendation: 'Consider a 5–10% price bump or bundle with higher-margin accessories.',
          metricBadge: { label: 'Margin', value: `${marginPct.toFixed(1)}%`, isPositive: false },
          action: { label: 'Edit Product', href: `/dashboard/products/${prod.id}/edit`, type: 'internal_link' },
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  return insights;
}

export function evaluateCustomerCreditInsights(customers: InsightCustomer[]): BusinessInsight[] {
  const insights: BusinessInsight[] = [];
  const creditCustomers = customers.filter((c) => (c.credit_balance || 0) > 0);

  for (const cust of creditCustomers.slice(0, 3)) {
    const debt = cust.credit_balance || 0;
    const cleanPhone = (cust.phone || '').replace(/\D/g, '');
    const waText = encodeURIComponent(
      `Hello ${cust.name}, this is a gentle reminder regarding your outstanding balance of GHS ${debt.toFixed(2)} on Merchander. Kindly let us know if you have settled or need payment details. Thank you!`
    );

    insights.push({
      id: `credit-overdue-${cust.id}`,
      category: 'credit',
      severity: debt > 500 ? 'critical' : 'warning',
      title: `Outstanding Receivable: ${cust.name}`,
      observation: `${cust.name} has an uncollected balance of ${formatCurrency(debt, 'GHS')}.`,
      impact: 'Uncollected balances tie up working capital needed for supplier orders.',
      recommendation: 'Send a quick WhatsApp reminder with Mobile Money payment instructions.',
      metricBadge: { label: 'Receivable', value: formatCurrency(debt, 'GHS'), isPositive: false },
      action: {
        label: 'Send WhatsApp Reminder',
        href: cleanPhone ? `https://wa.me/${cleanPhone}?text=${waText}` : `/dashboard/customers/${cust.id}`,
        type: cleanPhone ? 'whatsapp' : 'internal_link',
        isExternal: Boolean(cleanPhone),
      },
      timestamp: new Date().toISOString(),
    });
  }

  return insights;
}

export function evaluateLogisticsAndVipInsights(
  shipments: InsightShipment[],
  customers: InsightCustomer[],
  now: Date
): BusinessInsight[] {
  const insights: BusinessInsight[] = [];

  for (const ship of shipments) {
    const daysSinceCreated = differenceInDays(now, new Date(ship.created_at));
    if (daysSinceCreated >= 10) {
      insights.push({
        id: `shipment-delay-${ship.id}`,
        category: 'supplier',
        severity: 'warning',
        title: `Extended Transit: ${ship.title || ship.tracking_number || 'Consignment'}`,
        observation: `Shipment ${ship.tracking_number || ''} with ${ship.carrier || 'carrier'} has been in transit for ${daysSinceCreated} days.`,
        impact: 'Delays in customs clearance or freight arrival push back customer delivery schedules.',
        recommendation: 'Contact freight clearing agent to confirm port release date.',
        metricBadge: { label: 'In Transit', value: `${daysSinceCreated} days`, isPositive: false },
        action: { label: 'Track Shipment', href: '/dashboard/shipments', type: 'internal_link' },
        timestamp: new Date().toISOString(),
      });
    }
  }

  const vipCustomers = customers.filter((c) => (c.total_spent || 0) >= 1000);
  for (const cust of vipCustomers.slice(0, 2)) {
    const daysSinceActive = cust.updated_at ? differenceInDays(now, new Date(cust.updated_at)) : 30;
    if (daysSinceActive >= 25) {
      const cleanPhone = (cust.phone || '').replace(/\D/g, '');
      const waText = encodeURIComponent(
        `Hi ${cust.name}! We appreciate you as one of our top clients. We have fresh arrivals in stock and wanted to extend an exclusive preview discount for your next order. Let us know if anything catches your eye!`
      );

      insights.push({
        id: `vip-reengage-${cust.id}`,
        category: 'customer',
        severity: 'opportunity',
        title: `VIP Re-engagement: ${cust.name}`,
        observation: `${cust.name} has contributed ${formatCurrency(cust.total_spent || 0, 'GHS')} in lifetime sales but hasn't ordered in ${daysSinceActive} days.`,
        impact:
          'Top clients generate significant revenue; re-engaging them boosts repeat purchases with zero ad spend.',
        recommendation: 'Send a personalized WhatsApp check-in with early access to new collections.',
        metricBadge: { label: 'Lifetime Spent', value: formatCurrency(cust.total_spent || 0, 'GHS'), isPositive: true },
        action: {
          label: 'Send VIP Offer',
          href: cleanPhone ? `https://wa.me/${cleanPhone}?text=${waText}` : `/dashboard/customers/${cust.id}`,
          type: cleanPhone ? 'whatsapp' : 'internal_link',
          isExternal: Boolean(cleanPhone),
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  return insights;
}
