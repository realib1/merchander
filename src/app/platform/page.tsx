import React from 'react';
import Link from 'next/link';
import {
  Building2,
  TrendingUp,
  CreditCard,
  AlertTriangle,
  Network,
  ArrowRight,
} from 'lucide-react';
import { getPlatformOverviewData, getPlatformPlansAction } from '@/app/actions/platform';
import { MetricCard } from '@/components/ui/MetricCard';

export const dynamic = 'force-dynamic';

const TIER_DOT: Record<string, string> = {
  enterprise: 'bg-purple-500',
  business: 'bg-brand-primary',
  growth: 'bg-blue-500',
  starter: 'bg-emerald-500',
  free: 'bg-muted',
};

export default async function PlatformOverviewPage() {
  const [{ tenants, kpis, error }, { plans }] = await Promise.all([
    getPlatformOverviewData(),
    getPlatformPlansAction(),
  ]);

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3">
        <AlertTriangle size={20} />
        <div>
          <div className="font-semibold text-sm">Error Loading Platform Overview</div>
          <div className="text-xs opacity-80">{error}</div>
        </div>
      </div>
    );
  }

  // Real Database-driven Attention Items
  const attentionItems: Array<{
    id: string;
    title: string;
    description: string;
    actionLabel: string;
    actionHref: string;
  }> = [];

  if (kpis.urgentTicketsCount > 0) {
    attentionItems.push({
      id: 'att-urgent-tickets',
      title: `${kpis.urgentTicketsCount} Urgent Support Inquiries`,
      description: 'Customer or tenant support requests flagged as urgent in the queue.',
      actionLabel: 'Review Queue',
      actionHref: '/platform/support',
    });
  } else if (kpis.openTicketsCount > 0) {
    attentionItems.push({
      id: 'att-open-tickets',
      title: `${kpis.openTicketsCount} Support Inquiries Pending`,
      description: 'Support cases awaiting response from platform operations staff.',
      actionLabel: 'Open Queue',
      actionHref: '/platform/support',
    });
  }

  if (kpis.pastDueTenants > 0) {
    attentionItems.push({
      id: 'att-past-due',
      title: `${kpis.pastDueTenants} Billing Accounts Past Due`,
      description: 'Subscription billing renewals failed on connected payment rails.',
      actionLabel: 'Inspect Accounts',
      actionHref: '/platform/merchants',
    });
  }

  if (kpis.unprovisionedTenants > 0) {
    attentionItems.push({
      id: 'att-unprovisioned',
      title: `${kpis.unprovisionedTenants} Merchants Without a Subscription`,
      description: 'Workspaces with no tenant_subscriptions row — on no plan and contributing no MRR.',
      actionLabel: 'Assign Plans',
      actionHref: '/platform/merchants',
    });
  }

  if (kpis.suspendedTenants > 0) {
    attentionItems.push({
      id: 'att-suspended',
      title: `${kpis.suspendedTenants} Suspended Merchant Workspaces`,
      description: 'Accounts restricted or suspended for platform policy compliance review.',
      actionLabel: 'View Accounts',
      actionHref: '/platform/merchants',
    });
  }

  return (
    <div className="flex flex-col animate-fadeIn max-w-7xl mx-auto w-full space-y-8">
      {/* Top Reusable MetricCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <MetricCard
          title="Merchants"
          value={kpis.totalTenants}
          subtitle={`${kpis.activeTenants} active • ${kpis.trialTenants} trial`}
          icon={<Building2 size={16} className="text-brand-primary" />}
          iconBg="bg-brand-primary/10"
        />

        <MetricCard
          title="Platform MRR"
          value={`GH₵ ${kpis.platformMRR.toLocaleString()}`}
          diffText={`ARR: GH₵ ${kpis.projectedARR.toLocaleString()}`}
          icon={<TrendingUp size={16} className="text-emerald-500" />}
          iconBg="bg-emerald-500/10"
        />

        <MetricCard
          title="Paid Subscribers"
          value={kpis.payingTenants}
          subtitle={`${kpis.tierCounts.starter} starter • ${kpis.tierCounts.growth} growth • ${kpis.tierCounts.business} business`}
          icon={<CreditCard size={16} className="text-purple-500" />}
          iconBg="bg-purple-500/10"
        />

        <MetricCard
          title="Stores & Catalog"
          value={`${kpis.totalStores} Stores`}
          subtitle={`${kpis.totalProducts} products • ${kpis.totalOrders} orders`}
          icon={<Network size={16} className="text-blue-500" />}
          iconBg="bg-blue-500/10"
        />
      </div>

      {/* Operational Attention Center */}
      {attentionItems.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-foreground">Operational Attention Items</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {attentionItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl border bg-surface border-separator shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-foreground">{item.title}</div>
                  <div className="text-xs text-muted leading-relaxed">{item.description}</div>
                </div>

                <div className="pt-3 mt-3 border-t border-separator/60">
                  <Link
                    href={item.actionHref}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline"
                  >
                    <span>{item.actionLabel}</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Bento Layout: Commercial Tiers & Merchants Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tier Distribution */}
        <div className="lg:col-span-5 bg-surface border border-separator rounded-2xl shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">Commercial Tiers</h2>
            <Link href="/platform/plans-billing" className="text-xs font-semibold text-brand-primary hover:underline">
              Manage Plans
            </Link>
          </div>

          {plans.length === 0 ? (
            <p className="text-xs text-muted leading-relaxed">
              No plans configured. Add commercial tiers in Plans &amp; Billing — pricing shown
              across the console reads from that table.
            </p>
          ) : (
            <div className="space-y-2.5">
              {plans.map((plan) => {
                const count = kpis.tierCounts[plan.slug as keyof typeof kpis.tierCounts] ?? 0;
                return (
                  <div key={plan.id} className="flex items-center justify-between text-xs p-3 rounded-xl bg-surface-elevated border border-separator/40">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${TIER_DOT[plan.slug] || 'bg-muted'}`} />
                      <span className="font-medium text-foreground">{plan.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted tabular-nums">
                        GH₵ {plan.price_ghs.toLocaleString()}/mo
                      </span>
                      <span className="px-2 py-0.5 rounded bg-surface border border-separator font-bold text-foreground tabular-nums">
                        {count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Real Merchants Snapshot */}
        <div className="lg:col-span-7 bg-surface border border-separator rounded-2xl shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">Merchants Registry</h2>
            <Link href="/platform/merchants" className="text-xs font-semibold text-brand-primary hover:underline flex items-center gap-1">
              <span>View All ({tenants.length})</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="divide-y divide-separator/60">
            {tenants.slice(0, 5).map((tenant) => (
              <div key={tenant.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary flex items-center justify-center font-bold text-xs shrink-0">
                    {tenant.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground truncate">{tenant.name}</div>
                    <div className="text-[11px] text-muted truncate">
                      {tenant.email || 'No email registered'} •{' '}
                      {tenant.subscription.tier === 'none' ? 'UNPROVISIONED' : tenant.subscription.tier.toUpperCase()} • Joined {new Date(tenant.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${
                      tenant.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : tenant.status === 'trial'
                        ? 'bg-amber-500/10 text-amber-500'
                        : 'bg-destructive/10 text-destructive'
                    }`}
                  >
                    {tenant.status}
                  </span>
                  <Link
                    href={`/platform/merchants/${tenant.id}`}
                    className="p-1.5 rounded-lg bg-surface-elevated text-secondary hover:text-foreground border border-separator"
                    title="Inspect Context"
                  >
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
