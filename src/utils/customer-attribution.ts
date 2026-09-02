/**
 * Customer acquisition-channel attribution: given already-fetched customer and
 * order rows, tally customers and GMV by channel and rank them. Pure logic so it
 * can be unit-tested; the fetching lives in the customers server action.
 */

export type CustomerAttributionSource =
  | 'instagram'
  | 'whatsapp'
  | 'tiktok'
  | 'facebook'
  | 'referral'
  | 'direct'
  | 'preorder_batch'
  | 'storefront';

export interface CustomerAttributionChannel {
  source: CustomerAttributionSource;
  label: string;
  customerCount: number;
  percentage: number;
  totalGmv: number;
}

export interface CustomerAttributionBreakdown {
  channels: CustomerAttributionChannel[];
  topChannel: string;
  totalAttributedCustomers: number;
}

export interface AttributionCustomerRow {
  id: string;
  first_touch_source: string | null;
}

export interface AttributionOrderRow {
  customer_id: string | null;
  total_amount: number | string | null;
  attribution_source: string | null;
}

/** Channels the breakdown recognizes, with their display labels and insertion order. */
const CHANNEL_LABELS: Record<string, string> = {
  instagram: 'Instagram DM & Bio',
  whatsapp: 'WhatsApp Catalog & Chat',
  tiktok: 'TikTok Shop / Link',
  facebook: 'Facebook Page & Ads',
  referral: 'Customer Referrals',
  preorder_batch: 'Pre-Order Batches',
  direct: 'Direct Storefront',
};

/** Channels always shown even at zero customers. */
const ALWAYS_SHOWN = new Set(['direct', 'instagram', 'whatsapp']);

/**
 * Orders passed here are expected to already exclude cancelled orders (the caller
 * filters them out in the query).
 */
export function computeCustomerAttribution(
  customers: AttributionCustomerRow[],
  orders: AttributionOrderRow[]
): CustomerAttributionBreakdown {
  const channelMap: Record<string, { label: string; customerCount: number; totalGmv: number }> = {};
  for (const [source, label] of Object.entries(CHANNEL_LABELS)) {
    channelMap[source] = { label, customerCount: 0, totalGmv: 0 };
  }

  // Tally customers by first-touch source, falling back to `direct` for unknown.
  const customerSourceMap = new Map<string, string>();
  for (const c of customers) {
    const src = (c.first_touch_source || 'direct').toLowerCase();
    const normalizedSrc = channelMap[src] ? src : 'direct';
    channelMap[normalizedSrc].customerCount += 1;
    customerSourceMap.set(c.id, normalizedSrc);
  }

  // Roll up GMV by order attribution source, falling back to the customer's
  // first touch and then `direct`.
  for (const o of orders) {
    const orderSrc = (
      o.attribution_source ||
      (o.customer_id ? customerSourceMap.get(o.customer_id) : undefined) ||
      'direct'
    ).toLowerCase();
    const normalizedSrc = channelMap[orderSrc] ? orderSrc : 'direct';
    channelMap[normalizedSrc].totalGmv += Number(o.total_amount || 0);
  }

  const totalCustomers = customers.length;
  const channels: CustomerAttributionChannel[] = Object.entries(channelMap)
    .map(([key, data]) => ({
      source: key as CustomerAttributionSource,
      label: data.label,
      customerCount: data.customerCount,
      percentage: totalCustomers > 0 ? Math.round((data.customerCount / totalCustomers) * 100) : 0,
      totalGmv: data.totalGmv,
    }))
    .filter((c) => c.customerCount > 0 || ALWAYS_SHOWN.has(c.source))
    .sort((a, b) => b.customerCount - a.customerCount);

  return {
    channels,
    // With no customers the ranking is meaningless; default to the storefront.
    topChannel: totalCustomers > 0 ? channels[0]?.label || 'Direct Storefront' : 'Direct Storefront',
    totalAttributedCustomers: totalCustomers,
  };
}
