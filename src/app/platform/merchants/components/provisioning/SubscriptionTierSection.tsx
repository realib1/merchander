'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { PlatformPlan, PlatformTier } from '@/types/platform';

interface SubscriptionTierSectionProps {
  selectedTier: PlatformTier;
  billingCycle: 'monthly' | 'annual';
  plans: PlatformPlan[];
  onTierChange: (val: PlatformTier) => void;
  onCycleChange: (val: 'monthly' | 'annual') => void;
}

export function SubscriptionTierSection({
  selectedTier,
  billingCycle,
  plans,
  onTierChange,
  onCycleChange,
}: SubscriptionTierSectionProps) {
  return (
    <div className="space-y-3 pt-4 border-t border-separator/60">
      <div className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
        <Sparkles size={13} />
        <span>4. Subscription Tier & Billing Cycle</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="font-semibold text-secondary block text-xs">Initial Plan Tier</label>
          <select
            value={selectedTier}
            onChange={(e) => onTierChange(e.target.value as PlatformTier)}
            className="w-full bg-surface-elevated border border-separator rounded-xl px-3 py-2 text-foreground focus:outline-hidden focus:border-brand font-medium text-xs"
          >
            {plans && plans.length > 0 ? (
              plans.map((p) => (
                <option key={p.id} value={p.slug}>
                  {p.name} (GH₵ {p.price_ghs}/mo) {p.slug === 'growth' ? '(Most Popular)' : ''}
                </option>
              ))
            ) : (
              <>
                <option value="growth">Growth (GH₵ 350/mo) (Most Popular)</option>
                <option value="starter">Starter (GH₵ 150/mo)</option>
                <option value="business">Business (GH₵ 750/mo)</option>
                <option value="enterprise">Enterprise (GH₵ 1,800/mo)</option>
                <option value="free">Free / Sandbox (GH₵ 0/mo)</option>
              </>
            )}
          </select>
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-secondary block text-xs">Billing Cycle</label>
          <select
            value={billingCycle}
            onChange={(e) => onCycleChange(e.target.value as 'monthly' | 'annual')}
            className="w-full bg-surface-elevated border border-separator rounded-xl px-3 py-2 text-foreground focus:outline-hidden focus:border-brand font-medium text-xs"
          >
            <option value="monthly">Monthly</option>
            <option value="annual">Annual (with 2 months discount)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
