'use client';

import React, { useState, useTransition } from 'react';
import {
  Edit2,
  Plus,
  Globe,
  Users,
  Package,
  ShoppingBag,
  Bot,
} from 'lucide-react';
import { PlatformPlan } from '@/types/platform';
import { togglePlatformPlanStatusAction } from '@/app/actions/platform-plans';
import { PlanEditorDrawer } from './PlanEditorDrawer';

interface PlansBillingClientProps {
  initialPlans: PlatformPlan[];
}

export function PlansBillingClient({ initialPlans }: PlansBillingClientProps) {
  const [plans, setPlans] = useState<PlatformPlan[]>(initialPlans);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlatformPlan | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (plan: PlatformPlan) => {
    setEditingPlan(plan);
    setIsDrawerOpen(true);
  };

  const handlePlanSaved = (savedPlan: PlatformPlan, isNew: boolean) => {
    if (isNew) {
      setPlans((prev) => [...prev, savedPlan]);
    } else {
      setPlans((prev) => prev.map((p) => (p.id === savedPlan.id ? savedPlan : p)));
    }
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
                    <Bot size={13} className="text-amber-500 shrink-0" />
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

      {/* Plan Editor Drawer */}
      <PlanEditorDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        editingPlan={editingPlan}
        plansCount={plans.length}
        onPlanSaved={handlePlanSaved}
      />
    </div>
  );
}
