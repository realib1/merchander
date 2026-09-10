'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Sparkles, Layers, Users, Bot, Clock, ChevronRight } from 'lucide-react';
import { SubscriptionSettings } from '@/types/settings';
import { formatCurrency } from '@/utils/format';
import { formatRenewalDate, getTrialCountdown, formatTierName } from '@/utils/subscription';

interface CurrentPlanCardProps {
  settings: SubscriptionSettings;
  onOpenPlans: () => void;
  showPlans: boolean;
}

export function CurrentPlanCard({ settings, onOpenPlans, showPlans }: CurrentPlanCardProps) {
  const isTrial = Boolean(settings.isTrial || settings.status === 'trialing');
  const tierTitle = `Merchander ${formatTierName(settings.tier)}`;
  const renewalText = formatRenewalDate(settings.renewalDate, settings.billingCycle, isTrial);
  const trialMetrics = getTrialCountdown(settings.renewalDate, 14);

  const priceDisplay = isTrial
    ? 'GH₵ 0'
    : settings.billingCycle === 'annual'
      ? `${formatCurrency(settings.annualPrice / 12).replace('.00', '')} / month`
      : `${formatCurrency(settings.monthlyPrice).replace('.00', '')} / month`;

  const priceSubtext = isTrial
    ? `Free during trial • Renews at ${formatCurrency(settings.monthlyPrice).replace('.00', '')} / mo`
    : settings.billingCycle === 'annual'
      ? 'Billed annually (Save 20%)'
      : 'Billed monthly';

  const renderMeter = (icon: React.ReactNode, label: string, current: number, limit: number, unit: string) => {
    const isUnlimited = limit === -1;
    const percentage = isUnlimited
      ? Math.min(Math.round((current / 50) * 100), 100)
      : Math.min(Math.round((current / limit) * 100), 100);

    return (
      <div className="p-3 sm:p-3.5 rounded-xl border border-separator bg-surface-elevated/40 space-y-2.5 transition-all hover:bg-surface-elevated/70">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-medium text-foreground">
            {icon}
            <span className="truncate">{label}</span>
          </div>
          <span className="font-mono text-muted text-[11px] font-semibold shrink-0">
            {current} {isUnlimited ? `(${unit})` : `/ ${limit} ${unit}`}
          </span>
        </div>

        <div className="w-full h-2 bg-separator/50 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              percentage >= 90 ? 'bg-amber-500' : 'bg-brand-primary'
            }`}
            style={{ width: isUnlimited ? '20%' : `${Math.max(percentage, 4)}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <Card className="border border-separator bg-surface shadow-xs relative overflow-hidden">
      {/* Decorative subtle ambient backdrop */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-brand-primary/5 rounded-bl-full pointer-events-none -z-10" />

      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-brand-primary/10 text-brand-primary shrink-0 ring-1 ring-brand-primary/20">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base sm:text-lg font-bold font-display text-foreground">
                  {tierTitle}
                </CardTitle>
                {isTrial ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <Clock size={11} />
                    <span>14-Day Free Trial</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    ● Active Subscription
                  </span>
                )}
              </div>
              <p className="text-xs text-muted font-medium">{renewalText}</p>
            </div>
          </div>

          <div className="sm:text-right">
            <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight tabular-nums">
              {priceDisplay}
            </p>
            <p className="text-[11px] text-muted font-medium mt-0.5">{priceSubtext}</p>
          </div>
        </div>

        {/* Visual Trial Progress Timeline Banner */}
        {isTrial && trialMetrics.daysRemaining > 0 && (
          <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-900 dark:text-amber-300">
              <div className="flex items-center gap-1.5">
                <Clock size={13} className="text-amber-600 dark:text-amber-400" />
                <span>{trialMetrics.formattedTimeline}</span>
              </div>
              <span className="text-[11px] font-mono">{trialMetrics.percentElapsed}% of trial period</span>
            </div>
            <div className="w-full h-1.5 bg-amber-500/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${trialMetrics.percentElapsed}%` }}
              />
            </div>
            <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
              All Growth Pro features are unlocked. No payment method required during your trial.
            </p>
          </div>
        )}
      </CardHeader>

      <CardBody className="space-y-3 pt-0">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-foreground uppercase tracking-wider text-[11px]">
            Real-Time Quotas & Resource Allocation
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {renderMeter(
            <Layers size={14} className="text-brand-primary" />,
            settings.usage.products.label,
            settings.usage.products.current,
            settings.usage.products.limit,
            settings.usage.products.unit
          )}
          {renderMeter(
            <Users size={14} className="text-blue-500" />,
            settings.usage.staffSeats.label,
            settings.usage.staffSeats.current,
            settings.usage.staffSeats.limit,
            settings.usage.staffSeats.unit
          )}
          {renderMeter(
            <Bot size={14} className="text-emerald-500" />,
            settings.usage.botMessages.label,
            settings.usage.botMessages.current,
            settings.usage.botMessages.limit,
            settings.usage.botMessages.unit
          )}
        </div>
      </CardBody>

      <CardFooter className="justify-between items-center pt-3 border-t border-separator/60">
        <p className="text-[11px] text-muted hidden sm:block">
          Need custom limits or multi-branch warehousing? Explore enterprise scale options.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenPlans}
          className="cursor-pointer w-full sm:w-auto justify-center text-xs gap-1.5"
        >
          <span>{showPlans ? 'Hide Plan Tiers' : 'Compare & Change Plans'}</span>
          <ChevronRight size={13} className={`transition-transform duration-200 ${showPlans ? 'rotate-90' : ''}`} />
        </Button>
      </CardFooter>
    </Card>
  );
}
