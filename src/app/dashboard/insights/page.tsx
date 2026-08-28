import React, { Suspense } from 'react';
import { getBusinessInsights } from '@/app/actions/insights';
import { InsightsHeaderSummary } from './components/InsightsHeaderSummary';
import { InsightsList } from './components/InsightsList';

export const metadata = {
  title: 'Business Insights & Actionable Intelligence | Merchander',
  description: 'Automated operational diagnostics, stockout risks, margin erosion, and growth recommendations.',
};

export default async function InsightsPage() {
  const { summary, insights } = await getBusinessInsights();

  return (
    <div className="flex flex-col animate-fadeIn max-w-7xl mx-auto w-full">
      <h1 className="sr-only">Business Insights</h1>
      {/* 4 Bento KPI Metric Cards */}
      <InsightsHeaderSummary summary={summary} />

      {/* Filterable Actionable Intelligence Feed */}
      <Suspense fallback={<div className="p-12 text-center text-muted">Loading business intelligence...</div>}>
        <InsightsList insights={insights} />
      </Suspense>
    </div>
  );
}
