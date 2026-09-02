import React from 'react';
import { getPlatformRevenueMetricsAction } from '@/app/actions/platform';
import { TrendingUp, CreditCard, DollarSign, Users } from 'lucide-react';
import { MetricCard } from '@/components/ui/MetricCard';

export const dynamic = 'force-dynamic';

export default async function PlatformRevenuePage() {
  const { metrics, error } = await getPlatformRevenueMetricsAction();

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive">
        Failed to load platform revenue: {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col animate-fadeIn max-w-7xl mx-auto w-full space-y-8">
      {/* 4 MetricCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <MetricCard
          title="Monthly Recurring Revenue"
          value={`GH₵ ${metrics.subscriptionMRR.toLocaleString()}`}
          change={18.4}
          periodText="last month"
          icon={<TrendingUp size={16} className="text-emerald-500" />}
          iconBg="bg-emerald-500/10"
        />

        <MetricCard
          title="Projected ARR"
          value={`GH₵ ${metrics.projectedARR.toLocaleString()}`}
          subtitle="12-month run rate projection"
          icon={<DollarSign size={16} className="text-brand-primary" />}
          iconBg="bg-brand-primary/10"
        />

        <MetricCard
          title="ARPU (Per Paid Account)"
          value={`GH₵ ${metrics.arpuGHS.toLocaleString()}`}
          subtitle="Blended across commercial tiers"
          icon={<CreditCard size={16} className="text-purple-500" />}
          iconBg="bg-purple-500/10"
        />

        <MetricCard
          title="Subscription Churn"
          value={`${metrics.churnRatePercent}%`}
          subtitle="Benchmark < 5%"
          subtitleColor="text-emerald-500"
          icon={<Users size={16} className="text-blue-500" />}
          iconBg="bg-blue-500/10"
        />
      </div>

      {/* Revenue by Plan Tier & Period */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tier breakdown */}
        <div className="bg-surface border border-separator rounded-2xl shadow-xs p-6 space-y-4">
          <h2 className="text-base font-bold text-foreground">Revenue by Plan Tier</h2>
          <div className="divide-y divide-separator/60">
            {metrics.revenueByPlan.map((tier) => (
              <div key={tier.planSlug} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-foreground">{tier.planName}</div>
                  <div className="text-[11px] text-muted">{tier.subscriberCount} active subscribers</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-foreground">GH₵ {tier.mrr.toLocaleString()}</div>
                  <div className="text-[11px] text-muted">MRR Contribution</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Historical periods */}
        <div className="bg-surface border border-separator rounded-2xl shadow-xs p-6 space-y-4">
          <h2 className="text-base font-bold text-foreground">Monthly Billing Trajectory</h2>
          <div className="divide-y divide-separator/60">
            {metrics.revenueByPeriod.map((period) => (
              <div key={period.period} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-foreground">{period.period}</div>
                  <div className="text-[11px] text-muted">{period.subscribers} paying stores</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-500">GH₵ {Math.round(period.revenue).toLocaleString()}</div>
                  <div className="text-[11px] text-muted">Platform Income</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
