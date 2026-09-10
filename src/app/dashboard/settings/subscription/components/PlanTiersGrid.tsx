'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react';
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
      description: 'Essential tools for solo sellers launching an online store.',
      features: [
        'Up to 100 Products in Catalog',
        '1 Staff Account',
        'Direct WhatsApp Order Links',
        'Mobile Money Cash Recording',
        'Basic Storefront Subdomain',
      ],
    },
    {
      id: 'pro',
      name: 'Growth Pro',
      monthlyPrice: 250,
      annualPricePerMonth: 200,
      description: 'Complete operating system for growing social commerce boutiques.',
      isPopular: true,
      features: [
        'Up to 500 Products & Variants',
        '7 Staff Accounts & Permissions',
        'WhatsApp Cloud Bot & Auto-Reply',
        'Hubtel & Paystack MoMo Auto-Reconciliation',
        'Supplier Orders & Waybill Dispatch Slips',
        '1,000 AI Bot Message Quota / mo',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise Scale',
      monthlyPrice: 750,
      annualPricePerMonth: 600,
      description: 'High-volume distributors, wholesale merchants, & multiple branches.',
      features: [
        'Unlimited Products & Warehouses',
        '20+ Staff Accounts with Role Isolation',
        'Multi-Branch Inventory Synchronization',
        'Custom Domain Binding (.com / .shop)',
        'Dedicated Priority SLA & WhatsApp Manager',
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
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
              cycle === 'monthly' ? 'bg-brand-primary text-white shadow-xs' : 'text-muted hover:text-foreground'
            }`}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            onClick={() => setCycle('annual')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              cycle === 'annual' ? 'bg-brand-primary text-white shadow-xs' : 'text-muted hover:text-foreground'
            }`}
          >
            <span>Annual Billing</span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-500 text-white">
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
              className={`p-5 rounded-2xl bg-surface border transition-all relative flex flex-col justify-between space-y-4 shadow-xs ${
                t.isPopular
                  ? 'border-brand-primary ring-1 ring-brand-primary/50'
                  : 'border-separator hover:border-separator/80'
              }`}
            >
              {t.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-brand-primary text-white text-[10px] font-bold shadow-xs flex items-center gap-1">
                  <Sparkles size={11} />
                  <span>Recommended for Social Commerce</span>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold font-display text-foreground">{t.name}</h3>
                  {isCurrent && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                      Current Plan
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-2xl font-extrabold text-foreground tabular-nums">{displayPrice}</p>
                  <p className="text-xs text-muted mt-1 leading-relaxed">{t.description}</p>
                </div>

                <ul className="space-y-2.5 pt-3 border-t border-separator/50 text-xs">
                  {t.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-foreground font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand-primary shrink-0 mt-0.5" aria-hidden="true" />
                      <span className="leading-tight">{f}</span>
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
                    `Select ${t.name}`
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
