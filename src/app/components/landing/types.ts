export interface HeroMetric {
  title: string;
  value: string;
  subtitle?: string;
  trend?: string;
  isPositive?: boolean;
}

export interface TransactionStep {
  step: number;
  label: string;
  detail: string;
  badge?: string;
  iconName?: string;
}

export interface BusinessPillar {
  id: string;
  title: string;
  tagline: string;
  description: string;
}

export interface BusinessCategory {
  title: string;
  examples: string;
  highlight: string;
  badge: string;
}
