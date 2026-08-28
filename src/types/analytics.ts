export type AnalyticsFilterPeriod = 'today' | '7d' | '30d' | '90d' | 'ytd' | '1y';

export interface AnalyticsOverviewMetrics {
  gmv: number;
  ordersCount: number;
  aov: number; // Average Order Value
  fulfillmentRatePct: number; // Delivered & Paid / Total Orders
  repeatCustomerRatePct: number; // % of orders from returning customers
  gmvChange?: number;
  ordersChange?: number;
  aovChange?: number;
}

export interface SalesTimelinePoint {
  date: string;
  label: string;
  gmv: number;
  priorGmv?: number;
  ordersCount: number;
  aov: number;
}

export interface ChannelPerformance {
  channel: string;
  label: string;
  gmv: number;
  ordersCount: number;
  sharePct: number;
}

export interface PaymentMethodDistribution {
  method: string;
  label: string;
  volume: number;
  count: number;
  sharePct: number;
}

export interface TopProductAnalytics {
  id: string;
  name: string;
  sku?: string;
  categoryName: string;
  unitsSold: number;
  revenue: number;
  avgPrice: number;
}

export interface CategoryAnalytics {
  id: string;
  name: string;
  productCount: number;
  unitsSold: number;
  revenue: number;
  sharePct: number;
}

export interface CustomerCohortItem {
  id: string;
  name: string;
  phone: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderDate: string;
}

export interface CustomerCohortMetrics {
  totalUniqueBuyers: number;
  newBuyersCount: number;
  returningBuyersCount: number;
  newBuyersRevenue: number;
  returningBuyersRevenue: number;
  repeatRatePct: number;
  topVipCustomers: CustomerCohortItem[];
}

export interface OrderStatusFunnelItem {
  status: string;
  label: string;
  count: number;
  value: number;
  sharePct: number;
}

export interface DayOfWeekTrading {
  dayName: string;
  ordersCount: number;
  gmv: number;
  sharePct: number;
}

export interface HourlyTrading {
  windowLabel: string;
  periodName: string;
  ordersCount: number;
  gmv: number;
  sharePct: number;
}

export interface PeakTradingAnalytics {
  busiestDay: string;
  busiestTimeWindow: string;
  dayOfWeekBreakdown: DayOfWeekTrading[];
  hourlyBreakdown: HourlyTrading[];
}

export interface AnalyticsData {
  period: AnalyticsFilterPeriod;
  periodLabel: string;
  metrics: AnalyticsOverviewMetrics;
  timeline: SalesTimelinePoint[];
  channels: ChannelPerformance[];
  paymentMethods: PaymentMethodDistribution[];
  topProducts: TopProductAnalytics[];
  categories: CategoryAnalytics[];
  customerCohorts: CustomerCohortMetrics;
  statusFunnel: OrderStatusFunnelItem[];
  peakTrading: PeakTradingAnalytics;
}
