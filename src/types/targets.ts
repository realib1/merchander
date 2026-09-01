export type TargetMetric =
  'revenue' | 'orders' | 'customers' | 'new_customers' | 'product_sales' | 'preorder_customers' | 'preorder_revenue';

export type TargetPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';

export type TargetStatus = 'on_track' | 'at_risk' | 'achieved' | 'exceeded' | 'expired';

export interface BusinessTarget {
  id: string;
  tenant_id: string;
  name: string;
  metric: TargetMetric;
  target_value: number;
  start_date: string;
  end_date: string;
  period: TargetPeriod;
  product_id?: string | null;
  product_name?: string | null;
  batch_id?: string | null;
  batch_name?: string | null;
  currency?: string;
  created_at: string;
  updated_at: string;
}

export interface TargetProgress {
  target: BusinessTarget;
  current_value: number;
  target_value: number;
  percentage: number;
  remaining_value: number;
  days_total: number;
  days_elapsed: number;
  days_remaining: number;
  actual_daily_pace: number;
  required_daily_pace: number;
  pace_ratio: number;
  projected_value: number;
  status: TargetStatus;
  status_label: string;
  intelligence_narrative: string;
  projection_note?: string;
  recommendation?: string;
}

export interface TargetsIntelligenceSummary {
  headline: string;
  narrative: string;
  total_active_targets: number;
  on_track_count: number;
  at_risk_count: number;
  achieved_count: number;
  recently_achieved_count: number;
}

export interface CreateTargetInput {
  name: string;
  metric: TargetMetric;
  target_value: number;
  period: TargetPeriod;
  start_date: string;
  end_date: string;
  product_id?: string | null;
  batch_id?: string | null;
}
