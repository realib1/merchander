'use client';

import React, { useState, useTransition } from 'react';
import {
  Edit2,
  Plus,
  Loader2,
  X,
  CreditCard,
  Layers,
  Sparkles,
  Globe,
  Users,
  Package,
  ShoppingBag,
} from 'lucide-react';
import { PlatformPlan, PlatformEntitlements } from '@/types/platform';
import {
  updatePlatformPlanAction,
  createPlatformPlanAction,
  togglePlatformPlanStatusAction,
  SavePlanPayload,
} from '@/app/actions/platform-plans';

interface PlansBillingClientProps {
  initialPlans: PlatformPlan[];
}

export function PlansBillingClient({ initialPlans }: PlansBillingClientProps) {
  const [plans, setPlans] = useState<PlatformPlan[]>(initialPlans);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlatformPlan | null>(null);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [priceGhs, setPriceGhs] = useState(0);
  const [priceUsd, setPriceUsd] = useState(0);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [maxProducts, setMaxProducts] = useState(100);
  const [maxMonthlyOrders, setMaxMonthlyOrders] = useState(300);
  const [maxStaffSeats, setMaxStaffSeats] = useState(3);
  const [aiQueriesMonthly, setAiQueriesMonthly] = useState(250);
  const [customDomainAllowed, setCustomDomainAllowed] = useState(false);
  const [prioritySupport, setPrioritySupport] = useState(false);
  const [reason, setReason] = useState('');

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setName('');
    setSlug('');
    setDescription('');
    setPriceGhs(0);
    setPriceUsd(0);
    setBillingCycle('monthly');
    setMaxProducts(50);
    setMaxMonthlyOrders(100);
    setMaxStaffSeats(2);
    setAiQueriesMonthly(100);
    setCustomDomainAllowed(false);
    setPrioritySupport(false);
    setReason('');
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan: PlatformPlan) => {
    setEditingPlan(plan);
    setName(plan.name);
    setSlug(plan.slug);
    setDescription(plan.description || '');
    setPriceGhs(plan.price_ghs);
    setPriceUsd(plan.price_usd);
    setBillingCycle(plan.billing_cycle);
    setMaxProducts(plan.entitlements.max_products);
    setMaxMonthlyOrders(plan.entitlements.max_monthly_orders);
    setMaxStaffSeats(plan.entitlements.max_staff_seats);
    setAiQueriesMonthly(plan.entitlements.ai_queries_monthly);
    setCustomDomainAllowed(plan.entitlements.custom_domain_allowed);
    setPrioritySupport(plan.entitlements.priority_support);
    setReason('');
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsModalOpen(true);
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Plan name is required');
      return;
    }
    if (!editingPlan && !slug.trim()) {
      setErrorMessage('Plan slug is required');
      return;
    }

    const entitlements: PlatformEntitlements = {
      max_products: Number(maxProducts),
      max_monthly_orders: Number(maxMonthlyOrders),
      max_staff_seats: Number(maxStaffSeats),
      ai_queries_monthly: Number(aiQueriesMonthly),
      custom_domain_allowed: customDomainAllowed,
      priority_support: prioritySupport,
    };

    const payload: SavePlanPayload = {
      name,
      slug: editingPlan ? editingPlan.slug : slug,
      description,
      price_ghs: Number(priceGhs),
      price_usd: Number(priceUsd),
      billing_cycle: billingCycle,
      entitlements,
      is_active: editingPlan ? editingPlan.is_active : true,
      sort_order: editingPlan ? editingPlan.sort_order : plans.length + 1,
    };

    startTransition(async () => {
      if (editingPlan) {
        const res = await updatePlatformPlanAction(editingPlan.id, payload, reason);
        if (res.success) {
          setPlans((prev) =>
            prev.map((p) =>
              p.id === editingPlan.id
                ? {
                    ...p,
                    ...payload,
                    updated_at: new Date().toISOString(),
                  }
                : p
            )
          );
          setSuccessMessage('Plan pricing and entitlements updated successfully!');
          setTimeout(() => setIsModalOpen(false), 800);
        } else {
          setErrorMessage(res.error || 'Failed to update plan');
        }
      } else {
        const res = await createPlatformPlanAction(payload, reason);
        if (res.success) {
          setPlans((prev) => [
            ...prev,
            {
              id: `plan_${Date.now()}`,
              ...payload,
              is_active: true,
              sort_order: payload.sort_order || 99,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ]);
          setSuccessMessage('New commercial tier created successfully!');
          setTimeout(() => setIsModalOpen(false), 800);
        } else {
          setErrorMessage(res.error || 'Failed to create plan');
        }
      }
    });
  };

  const handleToggleStatus = (plan: PlatformPlan) => {
    const nextStatus = !plan.is_active;
    startTransition(async () => {
      const res = await togglePlatformPlanStatusAction(plan.id, nextStatus);
      if (res.success) {
        setPlans((prev) =>
          prev.map((p) => (p.id === plan.id ? { ...p, is_active: nextStatus } : p))
        );
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-4 rounded-2xl border border-separator shadow-xs">
        <div>
          <div className="text-xs font-bold text-foreground">Commercial Plan Tiers & Quotas</div>
          <div className="text-xs text-muted mt-0.5">
            Manage multi-currency subscription rates in GHS & USD and configure feature boundaries.
          </div>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-brand-primary text-brand-primary-foreground hover:opacity-90 transition-opacity shadow-xs shrink-0 cursor-pointer"
        >
          <Plus size={14} />
          <span>Add Custom Tier</span>
        </button>
      </div>

      {/* Plans Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {plans.map((plan) => {
          const isBusiness = plan.slug === 'business';
          const isEnterprise = plan.slug === 'enterprise';

          return (
            <div
              key={plan.id}
              className={`p-6 rounded-2xl border flex flex-col justify-between transition-all ${
                !plan.is_active
                  ? 'opacity-60 bg-surface/50 border-separator'
                  : isBusiness
                  ? 'bg-brand-primary/5 border-brand-primary/30 shadow-md ring-1 ring-brand-primary/20'
                  : 'bg-surface border-separator shadow-xs'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="font-bold text-base text-foreground font-display">{plan.name}</div>
                    {!plan.is_active && (
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-muted/20 text-muted">
                        Inactive
                      </span>
                    )}
                  </div>
                  {isBusiness && plan.is_active && (
                    <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-brand-primary text-brand-primary-foreground">
                      Popular
                    </span>
                  )}
                  {isEnterprise && plan.is_active && (
                    <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-purple-500 text-white">
                      Custom
                    </span>
                  )}
                </div>

                <div className="text-xs text-secondary leading-relaxed min-h-9">
                  {plan.description || 'Commercial tier for multi-channel commerce.'}
                </div>

                <div className="pt-2 border-t border-separator/50">
                  <div className="flex items-baseline gap-1 font-display">
                    <span className="text-2xl font-bold text-foreground font-mono">
                      GH₵ {plan.price_ghs.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted font-mono">/ month</span>
                  </div>
                  <div className="text-[11px] text-muted font-mono mt-0.5">
                    Approx. ${plan.price_usd} USD ({plan.billing_cycle})
                  </div>
                </div>

                {/* Entitlements List */}
                <div className="space-y-2 pt-3 text-xs">
                  <div className="flex items-center gap-2 text-foreground">
                    <Package size={13} className="text-brand-primary shrink-0" />
                    <span>
                      Up to <strong>{plan.entitlements.max_products.toLocaleString()}</strong> products
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <ShoppingBag size={13} className="text-blue-500 shrink-0" />
                    <span>
                      Up to <strong>{plan.entitlements.max_monthly_orders.toLocaleString()}</strong> orders / mo
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <Users size={13} className="text-purple-500 shrink-0" />
                    <span>
                      <strong>{plan.entitlements.max_staff_seats}</strong> staff seats
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <Sparkles size={13} className="text-amber-500 shrink-0" />
                    <span>
                      <strong>{plan.entitlements.ai_queries_monthly.toLocaleString()}</strong> AI queries / mo
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <Globe
                      size={13}
                      className={plan.entitlements.custom_domain_allowed ? 'text-emerald-500' : 'text-muted/40'}
                    />
                    <span
                      className={
                        plan.entitlements.custom_domain_allowed ? 'text-foreground' : 'text-muted line-through'
                      }
                    >
                      Custom Domain Routing
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-5 mt-5 border-t border-separator/50 flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(plan)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold bg-surface-elevated text-foreground border border-separator hover:border-brand-primary transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Edit2 size={13} />
                  <span>Edit Tier & Pricing</span>
                </button>
                <button
                  disabled={isPending}
                  onClick={() => handleToggleStatus(plan)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                    plan.is_active
                      ? 'bg-muted/10 text-muted hover:text-destructive hover:border-destructive/30'
                      : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                  }`}
                  title={plan.is_active ? 'Deactivate Tier' : 'Activate Tier'}
                >
                  {plan.is_active ? 'Archive' : 'Activate'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Plan Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-surface border border-separator rounded-2xl p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-separator pb-3">
              <div>
                <div className="text-xs font-mono font-bold text-brand-primary uppercase">Platform Governance</div>
                <h3 className="text-base font-bold text-foreground font-display mt-0.5">
                  {editingPlan ? `Edit Tier: ${editingPlan.name}` : 'Create New Commercial Tier'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-elevated transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-secondary block">Plan Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Growth Tier"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-surface-elevated border border-separator rounded-xl px-3 py-2 text-foreground focus:outline-hidden focus:border-brand-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-secondary block">Slug Identifier</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingPlan}
                    placeholder="e.g., growth"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full bg-surface-elevated border border-separator rounded-xl px-3 py-2 text-foreground focus:outline-hidden focus:border-brand-primary disabled:opacity-50 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-secondary block">Tier Description</label>
                <input
                  type="text"
                  placeholder="Summary of who this plan is designed for"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-surface-elevated border border-separator rounded-xl px-3 py-2 text-foreground focus:outline-hidden focus:border-brand-primary"
                />
              </div>

              {/* Multi-Currency Pricing */}
              <div className="p-3.5 rounded-xl bg-surface-elevated border border-separator space-y-3">
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <CreditCard size={14} className="text-brand-primary" />
                  <span>Subscription Pricing</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted">Price in GHS (GH₵)</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      value={priceGhs}
                      onChange={(e) => setPriceGhs(Number(e.target.value))}
                      className="w-full bg-surface border border-separator rounded-lg px-2.5 py-1.5 text-foreground font-mono font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted">Price in USD ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      value={priceUsd}
                      onChange={(e) => setPriceUsd(Number(e.target.value))}
                      className="w-full bg-surface border border-separator rounded-lg px-2.5 py-1.5 text-foreground font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Entitlement Quotas */}
              <div className="p-3.5 rounded-xl bg-surface-elevated border border-separator space-y-3">
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <Layers size={14} className="text-brand-primary" />
                  <span>Entitlement Quotas & Boundaries</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted">Max Products Limit</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={maxProducts}
                      onChange={(e) => setMaxProducts(Number(e.target.value))}
                      className="w-full bg-surface border border-separator rounded-lg px-2.5 py-1.5 text-foreground font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted">Max Monthly Orders</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={maxMonthlyOrders}
                      onChange={(e) => setMaxMonthlyOrders(Number(e.target.value))}
                      className="w-full bg-surface border border-separator rounded-lg px-2.5 py-1.5 text-foreground font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted">Staff Seats Included</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={maxStaffSeats}
                      onChange={(e) => setMaxStaffSeats(Number(e.target.value))}
                      className="w-full bg-surface border border-separator rounded-lg px-2.5 py-1.5 text-foreground font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted">AI Queries / Month</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={aiQueriesMonthly}
                      onChange={(e) => setAiQueriesMonthly(Number(e.target.value))}
                      className="w-full bg-surface border border-separator rounded-lg px-2.5 py-1.5 text-foreground font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customDomainAllowed}
                      onChange={(e) => setCustomDomainAllowed(e.target.checked)}
                      className="rounded border-separator text-brand-primary focus:ring-brand-primary"
                    />
                    <span className="text-secondary font-medium">Allow Custom Domain</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prioritySupport}
                      onChange={(e) => setPrioritySupport(e.target.checked)}
                      className="rounded border-separator text-brand-primary focus:ring-brand-primary"
                    />
                    <span className="text-secondary font-medium">Priority SLA Support</span>
                  </label>
                </div>
              </div>

              {/* Mandatory Reason */}
              <div className="space-y-1.5">
                <label className="font-semibold text-secondary block">
                  Change Reason <span className="text-muted font-normal">(Logged to Audit Trail)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Q3 Pricing adjustment per leadership review"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-surface-elevated border border-separator rounded-xl px-3 py-2 text-foreground focus:outline-hidden focus:border-brand-primary"
                />
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-xs">
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs">
                  {successMessage}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-separator">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
                      Saving Tier...
                    </>
                  ) : (
                    'Save Tier Configuration'
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
