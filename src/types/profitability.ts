export type ProfitPeriod = 'today' | '7d' | '30d' | '90d' | '1y';

export type MarginHealthStatus = 'healthy' | 'moderate' | 'warning' | 'negative';

export interface MetricComparison {
  value: number;
  previousValue: number;
  percentageChange: number;
}

export interface ProfitabilityMetrics {
  grossRevenue: number;
  cogs: number;
  grossProfit: number;
  grossMarginPct: number;
  operatingExpenses: number;
  logisticsFreightCost: number;
  gatewayFees: number;
  totalExpenses: number;
  netProfit: number;
  netMarginPct: number;
  totalOrdersCount: number;
  totalUnitsSold: number;
}

export interface ProductProfitability {
  productId: string;
  name: string;
  categoryName: string;
  sku: string | null;
  unitsSold: number;
  averageSellingPrice: number;
  averageCostPrice: number;
  totalRevenue: number;
  totalCogs: number;
  grossProfit: number;
  marginPct: number;
  healthStatus: MarginHealthStatus;
}

export interface CategoryProfitability {
  categoryId: string;
  categoryName: string;
  productCount: number;
  unitsSold: number;
  totalRevenue: number;
  totalCogs: number;
  grossProfit: number;
  marginPct: number;
  profitSharePct: number;
}

export interface ChannelProfitability {
  channel: 'whatsapp' | 'in_store' | 'instagram' | 'online_store' | 'other';
  label: string;
  orderCount: number;
  totalRevenue: number;
  grossProfit: number;
  marginPct: number;
}

export interface ProfitTimelinePoint {
  date: string;
  label: string;
  revenue: number;
  cogs: number;
  expenses: number;
  netProfit: number;
}

export interface ProfitabilityData {
  period: ProfitPeriod;
  dateRange: {
    from: string;
    to: string;
  };
  metrics: ProfitabilityMetrics;
  products: ProductProfitability[];
  categories: CategoryProfitability[];
  channels: ChannelProfitability[];
  timeline: ProfitTimelinePoint[];
}
