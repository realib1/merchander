import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AuditLogEntry, TenantPlatformStatus, PlatformTier } from '@/types/platform';
import { MerchantControlsClient } from './components/MerchantControlsClient';
import {
  ArrowLeft,
  Globe,
  Network,
  CreditCard,
  CheckCircle2,
  History,
  Store,
  Package,
  ShoppingBag,
  Key,
  ShieldAlert,
  Clock,
  Lock,
} from 'lucide-react';
import { getMerchantContextAction } from '@/app/actions/platform';
import { MetricCard } from '@/components/ui/MetricCard';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function MerchantContextPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const resolvedParams = await searchParams;
  
  const reason = typeof resolvedParams.reason === 'string' ? resolvedParams.reason : undefined;
  const ticketId = typeof resolvedParams.ticket_id === 'string' ? resolvedParams.ticket_id : undefined;

  // Gate Check
  if (!reason) {
    return (
      <div className="flex flex-col animate-fadeIn max-w-7xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/platform/merchants"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Merchants</span>
          </Link>
        </div>

        <div className="max-w-md mx-auto mt-12 p-8 bg-surface border border-separator rounded-2xl shadow-xl w-full">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary">
              <Lock size={28} />
            </div>
          </div>
          <h2 className="text-xl font-bold font-display text-center mb-2">Access Protected</h2>
          <p className="text-sm text-muted text-center mb-8">
            You are attempting to access sensitive merchant data. This action will be recorded in the immutable audit log.
          </p>

          <form method="GET" action={`/platform/merchants/${id}`} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="reason" className="text-xs font-bold text-foreground">
                Reason for Access <span className="text-destructive">*</span>
              </label>
              <select
                id="reason"
                name="reason"
                required
                className="w-full px-3 py-2 bg-background border border-separator rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all appearance-none"
              >
                <option value="">Select a reason...</option>
                <option value="Customer Support Investigation">Customer Support Investigation</option>
                <option value="Billing & Subscription Review">Billing & Subscription Review</option>
                <option value="Security Incident Investigation">Security Incident Investigation</option>
                <option value="Compliance Audit">Compliance Audit</option>
                <option value="Account Suspension/Reactivation">Account Suspension/Reactivation</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="ticket_id" className="text-xs font-bold text-foreground">
                Support Ticket ID <span className="text-muted font-normal">(Optional)</span>
              </label>
              <input
                id="ticket_id"
                name="ticket_id"
                type="text"
                placeholder="e.g. TKT-8492"
                className="w-full px-3 py-2 bg-background border border-separator rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-brand-primary text-brand-primary-foreground text-sm font-bold rounded-xl hover:bg-brand-primary/90 transition-colors shadow-sm mt-2"
            >
              Confirm Access
            </button>
          </form>
        </div>
      </div>
    );
  }

  const fullReason = ticketId ? `${reason} (Ticket #${ticketId})` : reason;

  const { tenant, activeGrant, auditTrail, error } = await getMerchantContextAction(
    id,
    fullReason
  );

  if (error || !tenant) {
    notFound();
  }

  return (
    <div className="flex flex-col animate-fadeIn max-w-7xl mx-auto w-full space-y-6">
      {/* Top Banner Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/platform/merchants"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Merchants</span>
        </Link>
      </div>

      {/* Support Delegation Handshake Banner */}
      {activeGrant ? (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 shrink-0">
              <Key size={16} />
            </div>
            <div>
              <div className="font-bold text-amber-300 font-mono flex items-center gap-2">
                <span>ACTIVE DELEGATION TOKEN VERIFIED</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/30">
                  Read-Only
                </span>
              </div>
              <div className="text-amber-200/80 text-[11px] mt-0.5">
                Granted for: <em>&ldquo;{activeGrant.reason}&rdquo;</em> {activeGrant.ticket_id && `(Ticket #${activeGrant.ticket_id})`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 shrink-0">
            <Clock size={13} />
            <span>Valid until {new Date(activeGrant.expires_at).toLocaleTimeString()}</span>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-surface border border-separator text-muted flex items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-muted/10 text-muted shrink-0">
              <ShieldAlert size={16} />
            </div>
            <div>
              <div className="font-semibold text-foreground">Standard Diagnostic Context</div>
              <div className="text-[11px] text-muted mt-0.5">
                No active merchant support grant on record. Live order payloads and sensitive catalog details remain locked.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Header Card */}
      <div className="bg-surface p-6 rounded-2xl border border-separator shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary flex items-center justify-center font-bold text-lg shrink-0">
            {tenant.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold font-display text-foreground">{tenant.name}</h1>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${
                  tenant.status === 'active'
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'bg-destructive/10 text-destructive'
                }`}
              >
                {tenant.status}
              </span>
            </div>
            <div className="text-xs text-muted mt-0.5">
              ID: {tenant.id} • Registered {new Date(tenant.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Action Menu */}
        <div className="flex items-center justify-end sm:shrink-0">
          <MerchantControlsClient
            tenantId={tenant.id}
            currentStatus={tenant.status as TenantPlatformStatus}
            currentTier={tenant.subscription.tier as PlatformTier}
          />
        </div>
      </div>

      {/* 4 MetricCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <MetricCard
          title="Plan Tier"
          value={
            tenant.subscription.tier === 'none'
              ? 'UNPROVISIONED'
              : tenant.subscription.tier.toUpperCase()
          }
          subtitle={
            tenant.subscription.tier === 'none'
              ? 'No subscription record'
              : `GH₵ ${tenant.subscription.priceMonthly}/mo • ${tenant.subscription.status}`
          }
          icon={<CreditCard size={16} className="text-brand-primary" />}
          iconBg="bg-brand-primary/10"
        />

        <MetricCard
          title="Store Locations"
          value={`${tenant.stores.length} Registered`}
          subtitle={tenant.stores[0]?.name || 'Primary Store'}
          icon={<Store size={16} className="text-blue-500" />}
          iconBg="bg-blue-500/10"
        />

        <MetricCard
          title="Product Catalog"
          value={`${tenant.productCount} Items`}
          subtitle="Active listings"
          icon={<Package size={16} className="text-purple-500" />}
          iconBg="bg-purple-500/10"
        />

        <MetricCard
          title="Total Paid GMV"
          value={`GH₵ ${tenant.totalGmv.toLocaleString()}`}
          diffText={`${tenant.orderCount} Orders`}
          icon={<ShoppingBag size={16} className="text-emerald-500" />}
          iconBg="bg-emerald-500/10"
        />
      </div>

      {/* Operational Metadata & Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connected Rails */}
        <div className="bg-surface border border-separator rounded-2xl shadow-xs p-6 space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Network size={18} className="text-brand-primary" />
            <span>Connected Rails & Infrastructure</span>
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-elevated border border-separator/40 text-xs">
              <div className="flex items-center gap-2.5">
                <Globe size={15} className="text-muted" />
                <span className="font-semibold text-foreground">Custom Domain</span>
              </div>
              <span className="text-muted">
                {tenant.customDomain || `${tenant.slug || tenant.id.substring(0, 8)}.merchander.app`}
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-elevated border border-separator/40 text-xs">
              <div className="flex items-center gap-2.5">
                <CheckCircle2
                  size={15}
                  className={
                    (tenant.connectedChannels || []).length > 0 ? 'text-emerald-500' : 'text-muted'
                  }
                />
                <span className="font-semibold text-foreground">Active Channels</span>
              </div>
              <span className="text-muted">
                {(tenant.connectedChannels || []).join(', ') || 'None connected'}
              </span>
            </div>
          </div>
        </div>

        {/* Audit Trail from Database */}
        <div className="bg-surface border border-separator rounded-2xl shadow-xs p-6 space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <History size={18} className="text-brand-primary" />
            <span>Administrative Audit Log</span>
          </h2>

          {!auditTrail || auditTrail.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted">
              No recent administrative audit events recorded for this tenant.
            </div>
          ) : (
            <div className="space-y-2">
              {auditTrail.map((log, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-surface-elevated border border-separator/40 flex items-center justify-between text-xs"
                >
                  <div className="truncate pr-2">
                    <span className="font-semibold text-foreground">{log.event}</span>
                    <span className="text-muted"> by {log.actor}</span>
                  </div>
                  <span className="text-[11px] text-muted shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
