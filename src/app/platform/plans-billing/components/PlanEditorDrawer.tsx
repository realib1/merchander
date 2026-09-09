'use client';

import React, { useState, useTransition } from 'react';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { CreditCard, Layers } from 'lucide-react';
import {
  createPlatformPlanAction,
  updatePlatformPlanAction,
  SavePlanPayload,
} from '@/app/actions/platform-plans';
import type { PlatformPlan, PlatformEntitlements } from '@/types/platform';

interface PlanEditorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  editingPlan: PlatformPlan | null;
  plansCount: number;
  onPlanSaved: (plan: PlatformPlan, isNew: boolean) => void;
}

function PlanEditorFormContent({
  editingPlan,
  plansCount,
  onClose,
  onPlanSaved,
}: {
  editingPlan: PlatformPlan | null;
  plansCount: number;
  onClose: () => void;
  onPlanSaved: (plan: PlatformPlan, isNew: boolean) => void;
}) {
  const [name, setName] = useState(editingPlan?.name || '');
  const [slug, setSlug] = useState(editingPlan?.slug || '');
  const [description, setDescription] = useState(editingPlan?.description || '');
  const [priceGhs, setPriceGhs] = useState<number>(editingPlan?.price_ghs ?? 0);
  const [priceUsd, setPriceUsd] = useState<number>(editingPlan?.price_usd ?? 0);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(
    editingPlan?.billing_cycle || 'monthly'
  );
  const [maxProducts, setMaxProducts] = useState(editingPlan?.entitlements.max_products ?? 100);
  const [maxMonthlyOrders, setMaxMonthlyOrders] = useState(
    editingPlan?.entitlements.max_monthly_orders ?? 300
  );
  const [maxStaffSeats, setMaxStaffSeats] = useState(
    editingPlan?.entitlements.max_staff_seats ?? 3
  );
  const [aiQueriesMonthly, setAiQueriesMonthly] = useState(
    editingPlan?.entitlements.ai_queries_monthly ?? 250
  );
  const [customDomainAllowed, setCustomDomainAllowed] = useState(
    editingPlan?.entitlements.custom_domain_allowed ?? false
  );
  const [prioritySupport, setPrioritySupport] = useState(
    editingPlan?.entitlements.priority_support ?? false
  );
  const [reason, setReason] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

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
      sort_order: editingPlan ? editingPlan.sort_order : plansCount + 1,
    };

    startTransition(async () => {
      if (editingPlan) {
        const res = await updatePlatformPlanAction(editingPlan.id, payload, reason);
        if (res.success) {
          const updatedPlan: PlatformPlan = {
            ...editingPlan,
            ...payload,
            updated_at: new Date().toISOString(),
          };
          onPlanSaved(updatedPlan, false);
          setSuccessMessage('Plan pricing and entitlements updated successfully!');
          setTimeout(() => onClose(), 600);
        } else {
          setErrorMessage(res.error || 'Failed to update plan');
        }
      } else {
        const res = await createPlatformPlanAction(payload, reason);
        if (res.success) {
          const createdPlan: PlatformPlan = {
            id: `plan_${Date.now()}`,
            ...payload,
            is_active: true,
            sort_order: payload.sort_order || 99,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          onPlanSaved(createdPlan, true);
          setSuccessMessage('New commercial tier created successfully!');
          setTimeout(() => onClose(), 600);
        } else {
          setErrorMessage(res.error || 'Failed to create plan');
        }
      }
    });
  };

  return (
    <form id="plan-editor-form" onSubmit={handleSavePlan} className="space-y-5 text-xs">
      {/* Basic Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="font-semibold text-foreground block">Plan Name</label>
          <input
            type="text"
            required
            placeholder="e.g., Growth Tier"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-surface border border-separator rounded-xl px-3 py-2 text-foreground focus:outline-hidden focus:border-brand-primary"
          />
        </div>
        <div className="space-y-1.5">
          <label className="font-semibold text-foreground block">Slug Identifier</label>
          <input
            type="text"
            required
            disabled={!!editingPlan}
            placeholder="e.g., growth"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full bg-surface border border-separator rounded-xl px-3 py-2 text-foreground focus:outline-hidden focus:border-brand-primary disabled:opacity-50 font-mono"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="font-semibold text-foreground block">Tier Description</label>
        <input
          type="text"
          placeholder="Summary of who this plan is designed for"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-surface border border-separator rounded-xl px-3 py-2 text-foreground focus:outline-hidden focus:border-brand-primary"
        />
      </div>

      {/* Multi-Currency Pricing */}
      <div className="p-4 rounded-2xl bg-surface border border-separator space-y-3">
        <div className="font-bold text-foreground flex items-center gap-2">
          <CreditCard size={15} className="text-brand-primary" />
          <span className="text-sm">Subscription Pricing</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] text-muted font-medium">Price in GHS (GH₵)</label>
            <input
              type="number"
              min="0"
              step="1"
              required
              value={priceGhs}
              onChange={(e) => setPriceGhs(Number(e.target.value))}
              className="w-full bg-surface-elevated border border-separator rounded-lg px-2.5 py-1.5 text-foreground font-mono font-bold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-muted font-medium">Price in USD ($)</label>
            <input
              type="number"
              min="0"
              step="1"
              required
              value={priceUsd}
              onChange={(e) => setPriceUsd(Number(e.target.value))}
              className="w-full bg-surface-elevated border border-separator rounded-lg px-2.5 py-1.5 text-foreground font-mono font-bold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-muted font-medium">Billing Cadence</label>
            <select
              value={billingCycle}
              onChange={(e) => setBillingCycle(e.target.value as 'monthly' | 'annual')}
              className="w-full bg-surface-elevated border border-separator rounded-lg px-2.5 py-1.5 text-foreground font-medium capitalize"
            >
              <option value="monthly">Monthly</option>
              <option value="annual">Annual</option>
            </select>
          </div>
        </div>
      </div>

      {/* Entitlement Quotas */}
      <div className="p-4 rounded-2xl bg-surface border border-separator space-y-3">
        <div className="font-bold text-foreground flex items-center gap-2">
          <Layers size={15} className="text-brand-primary" />
          <span className="text-sm">Entitlement Quotas &amp; Boundaries</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] text-muted font-medium">Max Products Limit</label>
            <input
              type="number"
              min="1"
              required
              value={maxProducts}
              onChange={(e) => setMaxProducts(Number(e.target.value))}
              className="w-full bg-surface-elevated border border-separator rounded-lg px-2.5 py-1.5 text-foreground font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-muted font-medium">Max Monthly Orders</label>
            <input
              type="number"
              min="1"
              required
              value={maxMonthlyOrders}
              onChange={(e) => setMaxMonthlyOrders(Number(e.target.value))}
              className="w-full bg-surface-elevated border border-separator rounded-lg px-2.5 py-1.5 text-foreground font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-muted font-medium">Staff Seats Included</label>
            <input
              type="number"
              min="1"
              required
              value={maxStaffSeats}
              onChange={(e) => setMaxStaffSeats(Number(e.target.value))}
              className="w-full bg-surface-elevated border border-separator rounded-lg px-2.5 py-1.5 text-foreground font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-muted font-medium">AI Queries / Month</label>
            <input
              type="number"
              min="0"
              required
              value={aiQueriesMonthly}
              onChange={(e) => setAiQueriesMonthly(Number(e.target.value))}
              className="w-full bg-surface-elevated border border-separator rounded-lg px-2.5 py-1.5 text-foreground font-mono"
            />
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-4 border-t border-separator/60">
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
        <label className="font-semibold text-foreground block">
          Change Reason <span className="text-muted font-normal">(Logged to Audit Trail)</span>
        </label>
        <input
          type="text"
          placeholder="e.g., Q3 Pricing adjustment per leadership review"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full bg-surface border border-separator rounded-xl px-3 py-2 text-foreground focus:outline-hidden focus:border-brand-primary"
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

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-separator">
        <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          type="submit"
          isLoading={isPending}
          className="font-bold"
        >
          Save Tier Configuration
        </Button>
      </div>
    </form>
  );
}

export function PlanEditorDrawer({
  isOpen,
  onClose,
  editingPlan,
  plansCount,
  onPlanSaved,
}: PlanEditorDrawerProps) {
  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      icon={<CreditCard className="text-brand-primary" size={20} />}
      title={editingPlan ? `Edit Tier: ${editingPlan.name}` : 'Create New Commercial Tier'}
      description="Configure multi-currency pricing, quota boundaries, and feature toggles."
    >
      {isOpen && (
        <PlanEditorFormContent
          key={editingPlan?.id || 'new-tier'}
          editingPlan={editingPlan}
          plansCount={plansCount}
          onClose={onClose}
          onPlanSaved={onPlanSaved}
        />
      )}
    </Drawer>
  );
}
