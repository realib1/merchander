import React from 'react';
import { getPlatformInfrastructureStatus } from '@/app/actions/platform';
import { Database, Activity, ShieldCheck } from 'lucide-react';
import { MetricCard } from '@/components/ui/MetricCard';
import { IncidentsManager } from './components/IncidentsManager';

export const dynamic = 'force-dynamic';

export default async function SystemHealthPage() {
  const { incidents, systemMetrics, error } =
    await getPlatformInfrastructureStatus();

  // Colour the latency reading off the measurement, not a fixed class.
  const latencyMs = systemMetrics.queryRoundTripMs;
  const latencyTone =
    latencyMs < 300 ? 'text-emerald-500' : latencyMs < 1000 ? 'text-amber-500' : 'text-destructive';

  return (
    <div className="flex flex-col animate-fadeIn max-w-7xl mx-auto w-full space-y-8">
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-xs">
          Notice: {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <MetricCard
          title="Query Round-Trip"
          value={`${latencyMs} ms`}
          subtitle="4 platform queries via PostgREST"
          subtitleColor={latencyTone}
          icon={<Database size={16} className={latencyTone} />}
          iconBg="bg-surface-elevated"
        />

        <MetricCard
          title="Active Workspaces"
          value={systemMetrics.activeTenantsCount}
          subtitle="Live multi-tenant nodes"
          icon={<Activity size={16} className="text-brand-primary" />}
          iconBg="bg-brand-primary/10"
        />

        <MetricCard
          title="Row Volume Estimate"
          value={systemMetrics.totalRowsEstimate.toLocaleString()}
          subtitle="Tenants, products & orders"
          icon={<ShieldCheck size={16} className="text-purple-500" />}
          iconBg="bg-purple-500/10"
        />
      </div>

      {/* Interactive Platform Incident Broadcaster */}
      <IncidentsManager initialIncidents={incidents} />


    </div>
  );
}
