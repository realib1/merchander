'use client';

import React, { useState } from 'react';
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
  Plus,
  CreditCard,
} from 'lucide-react';
import { PlatformTenant, PlatformPlan, TenantPlatformStatus, PlatformRole } from '@/types/platform';
import { AddMerchanderDrawer } from './AddMerchanderDrawer';
import { MerchantStatusModal } from './MerchantStatusModal';
import { MerchantPlanModal } from './MerchantPlanModal';

interface MerchantsClientProps {
  initialTenants: PlatformTenant[];
  plans: PlatformPlan[];
  currentRole?: PlatformRole;
}

export function MerchantsClient({ initialTenants, plans, currentRole }: MerchantsClientProps) {
  const [tenants, setTenants] = useState<PlatformTenant[]>(initialTenants);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');

  // Modals state
  const [selectedTenant, setSelectedTenant] = useState<PlatformTenant | null>(null);
  const [statusTarget, setStatusTarget] = useState<TenantPlatformStatus>('active');
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isAddMerchanderOpen, setIsAddMerchanderOpen] = useState(false);

  const canProvision = !currentRole || ['platform_owner', 'platform_admin', 'operations'].includes(currentRole);

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
    setStatusTarget(status);
    setIsStatusModalOpen(true);
  };

  const handleOpenPlanModal = (tenant: PlatformTenant) => {
    setSelectedTenant(tenant);
    setIsPlanModalOpen(true);
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
              {plans.map((plan) => (
                <option key={plan.id} value={plan.slug}>
                  {plan.name}
                </option>
              ))}
              <option value="none">Unprovisioned</option>
            </select>
          </div>

          {canProvision && (
            <button
              onClick={() => setIsAddMerchanderOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-brand text-brand-foreground hover:bg-brand/90 transition shadow-xs cursor-pointer shrink-0"
            >
              <Plus size={14} />
              <span>Add Merchander</span>
            </button>
          )}
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
                          <CreditCard
                            size={11}
                            className={t.subscription.tier === 'none' ? 'text-amber-500' : 'text-muted'}
                          />
                          <span className={t.subscription.tier === 'none' ? 'text-amber-500' : undefined}>
                            {t.subscription.tier === 'none' ? 'Unprovisioned' : t.subscription.tier}
                          </span>
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

      {/* Status Modifier Modal */}
      <MerchantStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        tenant={selectedTenant}
        initialStatus={statusTarget}
        onSuccess={(newStatus) => {
          if (!selectedTenant) return;
          setTenants((prev) =>
            prev.map((t) => (t.id === selectedTenant.id ? { ...t, status: newStatus } : t))
          );
        }}
      />

      {/* Plan Override Modal */}
      <MerchantPlanModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        tenant={selectedTenant}
        plans={plans}
        onSuccess={(newTier, newCycle) => {
          if (!selectedTenant) return;
          setTenants((prev) =>
            prev.map((t) =>
              t.id === selectedTenant.id
                ? {
                    ...t,
                    subscription: {
                      ...t.subscription,
                      tier: newTier,
                      billingCycle: newCycle,
                    },
                  }
                : t
            )
          );
        }}
      />

      {/* Add Merchander Drawer */}
      <AddMerchanderDrawer
        isOpen={isAddMerchanderOpen}
        onClose={() => setIsAddMerchanderOpen(false)}
        plans={plans}
        onMerchantCreated={(newTenant) => {
          setTenants((prev) => [newTenant, ...prev]);
        }}
      />
    </div>
  );
}
