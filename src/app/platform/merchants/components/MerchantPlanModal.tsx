'use client';

import React, { useState, useTransition } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { updateTenantPlanAction } from '@/app/actions/platform';
import { toast } from 'sonner';
import type { PlatformTenant, PlatformPlan } from '@/types/platform';

interface MerchantPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: PlatformTenant | null;
  plans: PlatformPlan[];
  onSuccess: (tier: 'free' | 'starter' | 'growth' | 'business' | 'enterprise', cycle: 'monthly' | 'annual') => void;
}

function MerchantPlanFormContent({
  tenant,
  plans,
  onClose,
  onSuccess,
}: {
  tenant: PlatformTenant;
  plans: PlatformPlan[];
  onClose: () => void;
  onSuccess: (tier: 'free' | 'starter' | 'growth' | 'business' | 'enterprise', cycle: 'monthly' | 'annual') => void;
}) {
  const initialTier = tenant.subscription?.tier;
  const [targetTier, setTargetTier] = useState<'free' | 'starter' | 'growth' | 'business' | 'enterprise'>(
    initialTier && initialTier !== 'none' ? initialTier : 'growth'
  );
  const [targetCycle, setTargetCycle] = useState<'monthly' | 'annual'>(
    tenant.subscription?.billingCycle || 'monthly'
  );
  const [planReason, setPlanReason] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planReason.trim()) {
      setModalError('A mandatory reason is required for plan overrides');
      return;
    }

    startTransition(async () => {
      const res = await updateTenantPlanAction(
        tenant.id,
        targetTier,
        targetCycle,
        planReason
      );
      if (res.success) {
        toast.success(`Updated plan for ${tenant.name} to ${targetTier}`);
        onSuccess(targetTier, targetCycle);
        onClose();
      } else {
        setModalError(res.error || 'Failed to update plan');
      }
    });
  };

  return (
    <form id="merchant-plan-form" onSubmit={handleSavePlan} className="space-y-4 text-xs">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="font-semibold text-foreground block">Select Plan Tier</label>
          <select
            value={targetTier}
            onChange={(e) =>
              setTargetTier(
                e.target.value as 'free' | 'starter' | 'growth' | 'business' | 'enterprise'
              )
            }
            className="w-full bg-surface-elevated border border-separator rounded-xl px-3 py-2 text-foreground focus:outline-hidden font-medium capitalize"
          >
            {plans.map((plan) => (
              <option key={plan.id} value={plan.slug}>
                {plan.name} (GH₵ {plan.price_ghs.toLocaleString()})
              </option>
            ))}
          </select>
          {plans.length === 0 && (
            <p className="text-[11px] text-destructive">
              No plans configured - add commercial tiers in Plans &amp; Billing first.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="font-semibold text-foreground block">Billing Cycle</label>
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
        <label className="font-semibold text-foreground block">
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
          Apply Plan Override
        </Button>
      </div>
    </form>
  );
}

export function MerchantPlanModal({
  isOpen,
  onClose,
  tenant,
  plans,
  onSuccess,
}: MerchantPlanModalProps) {
  if (!tenant) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex flex-col">
          <span className="text-xs font-mono font-bold text-brand-primary uppercase tracking-wider">
            Subscription Override
          </span>
          <span className="text-base font-bold text-foreground font-display mt-0.5">
            Modify Plan for {tenant.name}
          </span>
        </div>
      }
      description="Manually override plan tier and billing cadence for commercial contracts."
      size="md"
    >
      {isOpen && (
        <MerchantPlanFormContent
          key={tenant.id}
          tenant={tenant}
          plans={plans}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      )}
    </Modal>
  );
}
