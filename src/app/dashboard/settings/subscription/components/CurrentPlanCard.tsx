'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Zap, Layers, Users, Bot } from 'lucide-react';
import { SubscriptionSettings } from '@/types/settings';
import { formatCurrency } from '@/utils/format';

interface CurrentPlanCardProps {
  settings: SubscriptionSettings;
  onOpenPlans: () => void;
  showPlans: boolean;
}

export function CurrentPlanCard({ settings, onOpenPlans, showPlans }: CurrentPlanCardProps) {
  const planTitle = {
    starter: 'Merchander Starter',
    pro: 'Merchander Growth Pro',
    enterprise: 'Merchander Enterprise Scale',
  }[settings.tier];

  const priceDisplay =
    settings.billingCycle === 'annual'
      ? `${formatCurrency(settings.annualPrice / 12).replace('.00', '')} / month (Billed annually)`
      : `${formatCurrency(settings.monthlyPrice).replace('.00', '')} / month`;

  const renderMeter = (icon: React.ReactNode, label: string, current: number, limit: number, unit: string) => {
    const isUnlimited = limit === -1;
    const percentage = isUnlimited
      ? Math.min(Math.round((current / 50) * 100), 100)
      : Math.min(Math.round((current / limit) * 100), 100);

    return (
      <div className="p-3.5 rounded-xl border border-separator bg-surface-elevated/40 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            {icon}
            <span>{label}</span>
          </div>
          <span className="font-mono text-muted font-medium">
            {current} {isUnlimited ? `(${unit})` : `/ ${limit} ${unit}`}
          </span>
        </div>

        <div className="w-full h-1.5 bg-separator/60 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${percentage > 90 ? 'bg-destructive' : 'bg-brand-primary'}`}
            style={{ width: isUnlimited ? '15%' : `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <Card className="border-brand-primary/30 bg-brand-primary/5 relative overflow-hidden shadow-xs">
      <div className="absolute top-0 right-0 w-48 h-48 bg-brand-primary/10 rounded-bl-full -z-10" />

      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-primary text-white shadow-xs">
              <Zap className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base font-bold font-display text-foreground">{planTitle}</CardTitle>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  ● Active
                </span>
              </div>
              <CardDescription className="text-xs text-muted">
                Renewal on {settings.renewalDate} &bull;{' '}
                {settings.billingCycle === 'annual' ? 'Annual Cycle' : 'Monthly Cycle'}
              </CardDescription>
            </div>
          </div>

          <div className="sm:text-right">
            <p className="text-xl sm:text-2xl font-extrabold text-foreground tabular-nums">{priceDisplay}</p>
          </div>
        </div>
      </CardHeader>

      <CardBody className="space-y-3 pt-0">
        <label className="text-xs font-semibold text-foreground">Real-Time Plan Usage & Quotas</label>
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

      <CardFooter className="justify-end pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenPlans}
          className="cursor-pointer w-full sm:w-auto justify-center text-xs"
        >
          <span>{showPlans ? 'Hide Plan Tiers' : 'Change Plan Tier'}</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
