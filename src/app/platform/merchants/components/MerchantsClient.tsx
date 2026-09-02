'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  ArrowRight,
  Phone,
  Mail,
  Store,
  Package,
  ShoppingBag,
  Loader2,
  X,
  CreditCard,
  AlertTriangle,
} from 'lucide-react';
import { PlatformTenant, TenantPlatformStatus } from '@/types/platform';
import { updateTenantStatusAction, updateTenantPlanAction } from '@/app/actions/platform';

interface MerchantsClientProps {
  initialTenants: PlatformTenant[];
}

export function MerchantsClient({ initialTenants }: MerchantsClientProps) {
  const [tenants, setTenants] = useState<PlatformTenant[]>(initialTenants);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');

  // Modals state
  const [selectedTenant, setSelectedTenant] = useState<PlatformTenant | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

  // Status modal form
  const [targetStatus, setTargetStatus] = useState<TenantPlatformStatus>('active');
  const [statusReason, setStatusReason] = useState('');

  // Plan modal form
  const [targetTier, setTargetTier] = useState<'free' | 'starter' | 'growth' | 'business' | 'enterprise'>('growth');
  const [targetCycle, setTargetCycle] = useState<'monthly' | 'annual'>('monthly');
  const [planReason, setPlanReason] = useState('');

  const [isPending, startTransition] = useTransition();
  const [modalError, setModalError] = useState<string | null>(null);

  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.email && t.email.toLowerCase().includes(search.toLowerCase())) ||
      (t.phone && t.phone.toLowerCase().includes(search.toLowerCase())) ||
      (t.slug && t.slug.toLowerCase().includes(search.toLowerCase())) ||
      t.id.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesTier = tierFilter === 'all' || t.subscription.tier === tierFilter;

    return matchesSearch && matchesStatus && matchesTier;
  });

  const handleOpenStatusModal = (tenant: PlatformTenant, status: TenantPlatformStatus) => {
    setSelectedTenant(tenant);
    setTargetStatus(status);
    setStatusReason('');
    setModalError(null);
    setIsStatusModalOpen(true);
  };

  const handleOpenPlanModal = (tenant: PlatformTenant) => {
    setSelectedTenant(tenant);
    setTargetTier(tenant.subscription.tier);
    setTargetCycle(tenant.subscription.billingCycle);
    setPlanReason('');
    setModalError(null);
    setIsPlanModalOpen(true);
  };

  const handleSaveStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;
    if (!statusReason.trim()) {
      setModalError('A mandatory operational reason is required for status changes');
      return;
    }

    startTransition(async () => {
      const res = await updateTenantStatusAction(selectedTenant.id, targetStatus, statusReason);
      if (res.success) {
        setTenants((prev) =>
          prev.map((t) =>
            t.id === selectedTenant.id ? { ...t, status: targetStatus } : t
          )
        );
        setIsStatusModalOpen(false);
      } else {
        setModalError(res.error || 'Failed to update tenant status');
      }
    });
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;
    if (!planReason.trim()) {
      setModalError('A mandatory reason is required for plan overrides');
      return;
    }

    startTransition(async () => {
      const res = await updateTenantPlanAction(
        selectedTenant.id,
        targetTier,
        targetCycle,
        planReason
      );
      if (res.success) {
        setTenants((prev) =>
          prev.map((t) =>
            t.id === selectedTenant.id
              ? {
                  ...t,
                  subscription: {
                    ...t.subscription,
                    tier: targetTier,
                    billingCycle: targetCycle,
                  },
                }
              : t
          )
        );
        setIsPlanModalOpen(false);
      } else {
        setModalError(res.error || 'Failed to update plan');
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface p-4 rounded-2xl border border-separator shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search by store name, owner email, phone, or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs bg-surface-elevated border border-separator placeholder:text-muted focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 bg-surface-elevated px-3 py-1.5 rounded-xl border border-separator text-xs">
            <Filter size={13} className="text-muted" />
            <span className="text-muted text-[11px] font-mono">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-foreground text-xs focus:outline-hidden font-medium cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="past_due">Past Due</option>
              <option value="restricted">Restricted</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-surface-elevated px-3 py-1.5 rounded-xl border border-separator text-xs">
            <span className="text-muted text-[11px] font-mono">Tier:</span>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="bg-transparent text-foreground text-xs focus:outline-hidden font-medium cursor-pointer"
            >
              <option value="all">All Tiers</option>
              <option value="enterprise">Enterprise</option>
              <option value="business">Business</option>
              <option value="growth">Growth</option>
              <option value="starter">Starter</option>
              <option value="free">Free</option>
            </select>
          </div>
        </div>
      </div>

      {/* Merchants Table */}
      <div className="bg-surface rounded-2xl border border-separator overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-elevated text-muted font-mono uppercase text-[10px] border-b border-separator">
              <tr>
                <th className="py-3 px-4">Merchant Business</th>
                <th className="py-3 px-4">Owner & Contact</th>
                <th className="py-3 px-4">Stores / Catalog</th>
                <th className="py-3 px-4">Active Plan</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-separator/60">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted">
                    No merchants found in database matching your query.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => {
                  return (
                    <tr key={t.id} className="hover:bg-surface-elevated/50 transition-colors">
                      {/* Business Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary flex items-center justify-center font-bold font-mono text-sm shrink-0">
                            {t.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-foreground text-xs sm:text-sm">{t.name}</div>
                            <div className="text-[11px] text-muted font-mono">
                              ID: {t.id.substring(0, 8)}... • Joined {new Date(t.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Owner & Contact */}
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <div className="text-foreground font-semibold flex items-center gap-1">
                          <Mail size={11} className="text-muted" />
                          <span>{t.email || 'No email registered'}</span>
                        </div>
                        {t.phone && (
                          <div className="text-muted flex items-center gap-1 mt-0.5">
                            <Phone size={11} />
                            <span>{t.phone}</span>
                          </div>
                        )}
                      </td>

                      {/* Store count & Catalog */}
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <div className="flex items-center gap-2 text-foreground">
                          <span className="flex items-center gap-1">
                            <Store size={11} className="text-muted" />
                            {t.stores.length} Store{t.stores.length !== 1 ? 's' : ''}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Package size={11} className="text-muted" />
                            {t.productCount} Prod
                          </span>
                        </div>
                        <div className="text-muted mt-0.5 flex items-center gap-1">
                          <ShoppingBag size={11} />
                          <span>{t.orderCount} Orders</span>
                        </div>
                      </td>

                      {/* Plan Tier with Override Modal Button */}
                      <td className="py-3.5 px-4 font-mono">
                        <button
                          onClick={() => handleOpenPlanModal(t)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold capitalize border border-separator bg-surface-elevated hover:border-brand-primary transition-colors cursor-pointer"
                          title="Override Plan Tier"
                        >
                          <CreditCard size={11} className="text-muted" />
                          <span>{t.subscription.tier}</span>
                        </button>
                      </td>

                      {/* Status with Modal Button */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() =>
                            handleOpenStatusModal(
                              t,
                              t.status === 'suspended' ? 'active' : 'suspended'
                            )
                          }
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border font-mono transition-opacity hover:opacity-80 cursor-pointer ${
                            t.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : t.status === 'trial'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : t.status === 'past_due'
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                              : 'bg-destructive/10 text-destructive border-destructive/20'
                          }`}
                        >
                          <span>{t.status}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2 font-mono">
                          {t.status === 'suspended' ? (
                            <button
                              onClick={() => handleOpenStatusModal(t, 'active')}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                            >
                              Reactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenStatusModal(t, 'suspended')}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors cursor-pointer"
                            >
                              Suspend
                            </button>
                          )}

                          <Link
                            href={`/platform/merchants/${t.id}`}
                            className="p-1.5 rounded-lg bg-surface-elevated text-secondary hover:text-foreground border border-separator transition-colors"
                            title="Inspect Diagnostic Context"
                          >
                            <ArrowRight size={14} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Modifier Modal with Mandatory Reason */}
      {isStatusModalOpen && selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-surface border border-separator rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-separator pb-3">
              <div>
                <div className="text-xs font-mono font-bold text-rose-400 uppercase">Tenant Governance</div>
                <h3 className="text-base font-bold text-foreground font-display mt-0.5">
                  Update Status for {selectedTenant.name}
                </h3>
              </div>
              <button
                onClick={() => setIsStatusModalOpen(false)}
                className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-elevated transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-secondary block">Select Target Status</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as TenantPlatformStatus)}
                  className="w-full bg-surface-elevated border border-separator rounded-xl px-3 py-2 text-foreground focus:outline-hidden font-medium capitalize"
                >
                  <option value="active">Active (Full platform and checkout access)</option>
                  <option value="trial">Trial (Extended evaluation status)</option>
                  <option value="past_due">Past Due (Subscription renewal failed)</option>
                  <option value="restricted">Restricted (Channel or payment limits)</option>
                  <option value="suspended">Suspended (Storefront and dashboard locked)</option>
                </select>
              </div>

              {targetStatus === 'suspended' && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-start gap-2">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong>Warning:</strong> Suspending this tenant will immediately disable their customer storefront, lock their merchant dashboard, and pause WhatsApp integrations.
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-semibold text-secondary block">
                  Mandatory Reason <span className="text-rose-400 font-bold">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="State the explicit operational or policy justification (e.g., Compliance investigation #104, Payment dispute)..."
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="w-full bg-surface-elevated border border-separator rounded-xl px-3 py-2 text-foreground focus:outline-hidden focus:border-brand-primary"
                />
              </div>

              {modalError && (
                <div className="p-3 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-xs">
                  {modalError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-separator">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-muted hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-primary text-brand-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer"
                >
                  {isPending ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Saving Status...
                    </>
                  ) : (
                    'Confirm Status Update'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plan Override Modal with Mandatory Reason */}
      {isPlanModalOpen && selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-surface border border-separator rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-separator pb-3">
              <div>
                <div className="text-xs font-mono font-bold text-brand-primary uppercase">Subscription Override</div>
                <h3 className="text-base font-bold text-foreground font-display mt-0.5">
                  Modify Plan for {selectedTenant.name}
                </h3>
              </div>
              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-elevated transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-secondary block">Select Plan Tier</label>
                  <select
                    value={targetTier}
                    onChange={(e) =>
                      setTargetTier(
                        e.target.value as 'free' | 'starter' | 'growth' | 'business' | 'enterprise'
                      )
                    }
                    className="w-full bg-surface-elevated border border-separator rounded-xl px-3 py-2 text-foreground focus:outline-hidden font-medium capitalize"
                  >
                    <option value="free">Free Explorer (GH₵ 0)</option>
                    <option value="starter">Starter Tier (GH₵ 150)</option>
                    <option value="growth">Growth Tier (GH₵ 350)</option>
                    <option value="business">Business Pro (GH₵ 750)</option>
                    <option value="enterprise">Enterprise Custom (GH₵ 1,800)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-secondary block">Billing Cycle</label>
                  <select
                    value={targetCycle}
                    onChange={(e) => setTargetCycle(e.target.value as 'monthly' | 'annual')}
                    className="w-full bg-surface-elevated border border-separator rounded-xl px-3 py-2 text-foreground focus:outline-hidden font-medium capitalize"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-secondary block">
                  Override Justification <span className="text-rose-400 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Extended pilot sponsor / High-volume partner contract"
                  value={planReason}
                  onChange={(e) => setPlanReason(e.target.value)}
                  className="w-full bg-surface-elevated border border-separator rounded-xl px-3 py-2 text-foreground focus:outline-hidden focus:border-brand-primary"
                />
              </div>

              {modalError && (
                <div className="p-3 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-xs">
                  {modalError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-separator">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-muted hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-primary text-brand-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer"
                >
                  {isPending ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Applying Override...
                    </>
                  ) : (
                    'Apply Plan Override'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
