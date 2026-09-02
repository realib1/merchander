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
      <div className="p-4 rounded-xl bg-surface-elevated border border-separator text-xs text-muted leading-relaxed">
        Figures below are <span className="font-semibold text-foreground">contracted</span> subscription
        value from <span className="font-mono">tenant_subscriptions</span>. No billing provider is
        connected yet, so collected revenue, net revenue and churn are not available.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <MetricCard
          title="Contracted MRR"
          value={`GH₵ ${metrics.contractedMRR.toLocaleString()}`}
          subtitle="Sum of active subscription prices"
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
          title="Past Due Accounts"
          value={metrics.failedBillingCount}
          subtitle="Subscriptions flagged past_due"
          icon={<Users size={16} className="text-blue-500" />}
          iconBg="bg-blue-500/10"
        />
      </div>

      <div className="bg-surface border border-separator rounded-2xl shadow-xs p-6 space-y-4">
        <h2 className="text-base font-bold text-foreground">Contracted MRR by Plan</h2>
        {metrics.revenueByPlan.length === 0 ? (
          <p className="text-xs text-muted">
            No plans configured. Add commercial tiers in Plans &amp; Billing to see the breakdown.
          </p>
        ) : (
          <div className="divide-y divide-separator/60">
            {metrics.revenueByPlan.map((tier) => (
              <div key={tier.planSlug} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-foreground">{tier.planName}</div>
                  <div className="text-[11px] text-muted">{tier.subscriberCount} active subscribers</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-foreground tabular-nums">
                    GH₵ {tier.mrr.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-muted">MRR contribution</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
