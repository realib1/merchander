export type InsightCategory = 'inventory' | 'margin' | 'credit' | 'velocity' | 'supplier' | 'customer';

export type InsightSeverity = 'critical' | 'warning' | 'opportunity' | 'info';

export interface InsightAction {
  label: string;
  href: string;
  type: 'internal_link' | 'whatsapp' | 'modal';
  isExternal?: boolean;
}

export interface BusinessInsight {
  id: string;
  category: InsightCategory;
  severity: InsightSeverity;
  title: string;
  observation: string;
  impact: string;
  recommendation: string;
  metricBadge?: {
    label: string;
    value: string;
    isPositive?: boolean;
  };
  action: InsightAction;
  timestamp: string;
}

export interface InsightsSummary {
  totalCount: number;
  criticalCount: number;
  warningCount: number;
  opportunityCount: number;
  infoCount: number;
}

export interface InsightsResponse {
  summary: InsightsSummary;
  insights: BusinessInsight[];
}
