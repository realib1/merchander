import React, { Suspense } from 'react';
import { ProfitPeriod } from '@/types/profitability';
import { getProfitabilityData } from '@/app/actions/profitability';
import { ProfitabilityTopMetrics } from './components/ProfitabilityTopMetrics';
import { ProfitabilityTimelineChart } from './components/ProfitabilityTimelineChart';
import { ProfitBreakdownCards } from './components/ProfitBreakdownCards';
import { ProductProfitabilityTable } from './components/ProductProfitabilityTable';
import { ProfitabilityToolbar } from './components/ProfitabilityToolbar';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Profitability & Unit Economics | Merchander',
  description: 'Real-time Gross Margin, COGS, Net Profit, and product unit economics analytics.',
};

export default async function ProfitabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: ProfitPeriod }>;
}) {
  const params = await searchParams;
  const period: ProfitPeriod = params?.period || '30d';

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let businessName = 'My Business';
  if (user) {
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenants(name)')
      .eq('user_id', user.id)
      .single();
    const tData = tenantUser?.tenants as unknown as { name: string } | null;
    if (tData?.name) {
      businessName = tData.name;
    }
  }

  const data = await getProfitabilityData(period);

  return (
    <div className="flex flex-col animate-fadeIn max-w-7xl mx-auto w-full">
      <h1 className="sr-only">Profitability & Unit Economics</h1>
      {/* Action & Period Toolbar */}
      <ProfitabilityToolbar currentPeriod={period} data={data} businessName={businessName} />

      {/* Top 4 Bento KPI Metrics */}
      <ProfitabilityTopMetrics metrics={data.metrics} />

      {/* Revenue vs Profit Timeline Chart */}
      <ProfitabilityTimelineChart timeline={data.timeline} />

      {/* Categories, Channels & Outlays Breakdowns */}
      <ProfitBreakdownCards categories={data.categories} channels={data.channels} metrics={data.metrics} />

      {/* Product-Level Unit Economics Table */}
      <div className="mt-2">
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h3 className="text-sm font-bold text-foreground tracking-tight">Product Unit Margins</h3>
            <p className="text-xs text-muted">Itemized revenue, COGS, and gross margin per product.</p>
          </div>
        </div>
        <Suspense fallback={<div className="p-12 text-center text-muted">Loading unit margins...</div>}>
          <ProductProfitabilityTable products={data.products} />
        </Suspense>
      </div>
    </div>
  );
}
