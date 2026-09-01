'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { SubscriptionTier, BillingCycle } from '@/types/settings';
import { formatCurrency } from '@/utils/format';

interface PlanTiersGridProps {
  currentTier: SubscriptionTier;
  currentCycle: BillingCycle;
  onSelectPlan: (tier: SubscriptionTier, cycle: BillingCycle) => void;
  isPending: boolean;
}

export function PlanTiersGrid({ currentTier, currentCycle, onSelectPlan, isPending }: PlanTiersGridProps) {
  const [cycle, setCycle] = useState<BillingCycle>(currentCycle);

  const tiers: Array<{
    id: SubscriptionTier;
    name: string;
    monthlyPrice: number;
    annualPricePerMonth: number;
    description: string;
    isPopular?: boolean;
    features: string[];
  }> = [
    {
      id: 'starter',
      name: 'Starter',
      monthlyPrice: 0,
      annualPricePerMonth: 0,
      description: 'For solo sellers launching an online store.',
      features: [
        'Up to 25 Catalog Products',
        '1 Staff Account',
        'Direct WhatsApp Order Links',
        'Manual Payment Logging',
      ],
    },
    {
      id: 'pro',
      name: 'Growth Pro',
      monthlyPrice: 250,
      annualPricePerMonth: 200,
      description: 'For expanding social commerce merchants & boutiques.',
      isPopular: true,
      features: [
        'Unlimited Products & Variants',
        '5 Staff Seats & Granular Roles',
        'WhatsApp Cloud API & Bot Assistant',
        'MoMo Auto-Reconciliation',
        'Landed Freight Costs & Margins',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise Scale',
      monthlyPrice: 750,
      annualPricePerMonth: 600,
      description: 'For multi-branch distributors and wholesale operations.',
      features: [
        'Unlimited Everything & Multi-Branch',
        'Dedicated Priority Queue & SLAs',
        'Custom Webhooks & ERP Sync',
        'Dedicated Account Manager',
      ],
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Billing Cycle Switcher */}
      <div className="flex items-center justify-center">
        <div className="p-1 rounded-xl bg-surface-elevated border border-separator inline-flex items-center gap-1 shadow-xs max-w-full overflow-x-auto">
          <button
            type="button"
            onClick={() => setCycle('monthly')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
              cycle === 'monthly' ? 'bg-brand-primary text-white shadow-xs' : 'text-muted hover:text-foreground'
            }`}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            onClick={() => setCycle('annual')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              cycle === 'annual' ? 'bg-brand-primary text-white shadow-xs' : 'text-muted hover:text-foreground'
            }`}
          >
            <span>Annual Billing</span>
            <span className="text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-500 text-white">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiers.map((t) => {
          const isCurrent = currentTier === t.id && currentCycle === cycle;
          const displayPrice =
            t.monthlyPrice === 0
              ? 'Free'
              : cycle === 'annual'
                ? `${formatCurrency(t.annualPricePerMonth).replace('.00', '')} / mo`
                : `${formatCurrency(t.monthlyPrice).replace('.00', '')} / mo`;

          return (
            <div
              key={t.id}
              className={`p-4 sm:p-5 rounded-2xl bg-surface border transition-all relative flex flex-col justify-between space-y-4 ${
                t.isPopular
                  ? 'border-brand-primary shadow-md ring-1 ring-brand-primary/50'
                  : 'border-separator hover:border-text-secondary/40'
              }`}
            >
              {t.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-brand-primary text-white text-[10px] font-bold shadow-xs flex items-center gap-1">
                  <span>Most Popular</span>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm sm:text-base font-bold font-display text-foreground">{t.name}</h3>
                  {isCurrent && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                      Current Plan
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-xl sm:text-2xl font-extrabold text-foreground tabular-nums">{displayPrice}</p>
                  <p className="text-xs text-muted mt-0.5">{t.description}</p>
                </div>

                <ul className="space-y-2 pt-2 border-t border-separator/50 text-xs">
                  {t.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-foreground font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand-primary shrink-0" aria-hidden="true" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-3">
                <Button
                  variant={isCurrent ? 'outline' : t.isPopular ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => onSelectPlan(t.id, cycle)}
                  disabled={isCurrent || isPending}
                  className="w-full cursor-pointer justify-center"
                >
                  {isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : isCurrent ? (
                    'Active Plan'
                  ) : (
                    `Switch to ${t.name}`
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
