import React, { Suspense } from 'react';
import { getBusinessInsights } from '@/app/actions/insights';
import { getBusinessTargets } from '@/app/actions/targets';
import { InsightsHeaderSummary } from './components/InsightsHeaderSummary';
import { InsightsList } from './components/InsightsList';
import { TargetsSection } from './components/TargetsSection';

export const metadata = {
  title: 'Business Insights & Intelligence Targets | Merchander',
  description: 'Automated accountability targets, operational diagnostics, stockout risks, and growth recommendations.',
};

export default async function InsightsPage() {
  const [{ summary, insights }, { targets, summary: targetsSummary, availableProducts, availableBatches }] =
    await Promise.all([getBusinessInsights(), getBusinessTargets()]);

  return (
    <div className="flex flex-col animate-fadeIn max-w-7xl mx-auto w-full space-y-6 pb-12">
      <h1 className="sr-only">Business Insights & Goals</h1>

      {/* 4 Bento KPI Metric Cards */}
      <InsightsHeaderSummary summary={summary} />

      {/* Merchander Goals & Targets Engine */}
      <TargetsSection
        targets={targets}
        summary={targetsSummary}
        availableProducts={availableProducts}
        availableBatches={availableBatches}
      />

      {/* Filterable Actionable Intelligence Feed */}
      <div className="space-y-4 pt-4 border-t border-separator">
        <div>
          <h2 className="text-base sm:text-lg font-bold font-display text-foreground tracking-tight">
            Operational Diagnostics & Recommendations
          </h2>
          <p className="text-xs text-muted">
            Continuous background analysis of inventory velocity, supplier lead times, and profit margins.
          </p>
        </div>

        <Suspense fallback={<div className="p-12 text-center text-muted">Loading business intelligence...</div>}>
          <InsightsList insights={insights} />
        </Suspense>
      </div>
    </div>
  );
}
