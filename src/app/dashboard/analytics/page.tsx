import React from 'react';
import { getAnalyticsData } from '@/app/actions/analytics';
import { createClient } from '@/lib/supabase/server';
import { AnalyticsFilterPeriod } from '@/types/analytics';
import { AnalyticsToolbar } from './components/AnalyticsToolbar';
import { AnalyticsTopMetrics } from './components/AnalyticsTopMetrics';
import { AnalyticsTimelineChart } from './components/AnalyticsTimelineChart';
import { AnalyticsPeakTrading } from './components/AnalyticsPeakTrading';
import { AnalyticsChannelAndPayments } from './components/AnalyticsChannelAndPayments';
import { AnalyticsProductRankings } from './components/AnalyticsProductRankings';
import { AnalyticsCustomerCohorts } from './components/AnalyticsCustomerCohorts';
import { AnalyticsDataExplorer } from './components/AnalyticsDataExplorer';

export const metadata = {
  title: 'Analytics & GMV Exploration | Merchander',
  description: 'Explore business trends, sales velocity, peak trading hours, and customer cohorts.',
};

interface AnalyticsPageProps {
  searchParams: Promise<{
    period?: string;
  }>;
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const resolvedParams = await searchParams;
  const rawPeriod = resolvedParams.period || '30d';
  const validPeriods: AnalyticsFilterPeriod[] = ['today', '7d', '30d', '90d', 'ytd', '1y'];
  const period: AnalyticsFilterPeriod = validPeriods.includes(rawPeriod as AnalyticsFilterPeriod)
    ? (rawPeriod as AnalyticsFilterPeriod)
    : '30d';

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let storeCurrency = 'GHS';
  if (user) {
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (tenantUser?.tenant_id) {
      const { data: ts } = await supabase
        .from('tenant_settings')
        .select('store_currency')
        .eq('tenant_id', tenantUser.tenant_id)
        .maybeSingle();
      if (ts?.store_currency) {
        storeCurrency = ts.store_currency;
      }
    }
  }

  const data = await getAnalyticsData(period);

  return (
    <div className="flex flex-col animate-fadeIn max-w-7xl mx-auto w-full">
      <h1 className="sr-only">Analytics & Performance</h1>
      {/* 1. Header Toolbar & Period Selector */}
      <AnalyticsToolbar currentPeriod={period} analyticsData={data} currency={storeCurrency} />

      {/* 2. Top 4 KPI Metrics */}
      <AnalyticsTopMetrics metrics={data.metrics} periodLabel={data.periodLabel} currency={storeCurrency} />

      {/* 3. Sales Timeline & Velocity Chart */}
      <AnalyticsTimelineChart timeline={data.timeline} periodLabel={data.periodLabel} />

      {/* 4. Peak Trading Hours & Day-of-Week Heatmap */}
      <AnalyticsPeakTrading peakTrading={data.peakTrading} />

      {/* 5. Sales Channels & Payment Rails */}
      <AnalyticsChannelAndPayments
        channels={data.channels}
        paymentMethods={data.paymentMethods}
        statusFunnel={data.statusFunnel}
      />

      {/* 6. Best Sellers & Category Performance */}
      <AnalyticsProductRankings topProducts={data.topProducts} categories={data.categories} />

      {/* 7. Customer Retention & Cohort Exploration */}
      <AnalyticsCustomerCohorts cohorts={data.customerCohorts} />

      {/* 8. Multi-Dimensional Data Explorer Table */}
      <AnalyticsDataExplorer data={data} />
    </div>
  );
}
