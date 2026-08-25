'use client';

import React, { useState } from 'react';
import {
  ShoppingBag,
  Receipt,
  PackageCheck,
  UserCheck,
  Wallet2,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface PipelineStep {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  preview: {
    label: string;
    value: string;
    subtext: string;
  };
}

const steps: PipelineStep[] = [
  {
    id: 'buy',
    icon: ShoppingBag,
    title: 'Customer buys GH₵ 450',
    subtitle: 'Social channel, online storefront, or counter order',
    preview: {
      label: 'TRANSACTION INITIATED',
      value: 'GH₵ 450.00',
      subtext: '3x Golden Penny 1kg • Paid via MTN MoMo',
    },
  },
  {
    id: 'sale',
    icon: Receipt,
    title: 'Sale recorded',
    subtitle: 'Instant digital receipt generated & logged',
    preview: {
      label: 'SALE RECORD',
      value: 'Order #ORD-2026-88',
      subtext: 'Receipt dispatched to customer • Cashier: Fatima',
    },
  },
  {
    id: 'inventory',
    icon: PackageCheck,
    title: 'Inventory updated',
    subtitle: 'Stock reduced across storeroom & shop floor',
    preview: {
      label: 'LIVE INVENTORY',
      value: '11 → 8 units left',
      subtext: 'Batch #BP-2026-08 • Shelf A3',
    },
  },
  {
    id: 'customer',
    icon: UserCheck,
    title: 'Customer history updated',
    subtitle: 'Purchase frequency & credit balance refreshed',
    preview: {
      label: 'CUSTOMER PROFILE',
      value: 'Mariam Issah',
      subtext: '4th order this month • Total spend GH₵ 2,420',
    },
  },
  {
    id: 'revenue',
    icon: Wallet2,
    title: 'Revenue updated',
    subtitle: 'Daily cash & Mobile Money ledger reconciled',
    preview: {
      label: 'DAILY REVENUE',
      value: 'GH₵ 12,840.00',
      subtext: 'MoMo: 64% • Cash: 28% • Card: 8%',
    },
  },
  {
    id: 'profit',
    icon: TrendingUp,
    title: 'Profit updated',
    subtitle: 'True landed cost margin calculated instantly',
    preview: {
      label: 'ESTIMATED MARGIN',
      value: '+GH₵ 135.00',
      subtext: 'Unit Cost GH₵ 105 • Selling GH₵ 150 (30% net margin)',
    },
  },
  {
    id: 'stock-check',
    icon: CheckCircle2,
    title: 'Stock level checked',
    subtitle: 'Automated reorder suggestion triggered',
    preview: {
      label: 'SYSTEM HEALTH',
      value: 'Reorder Alert',
      subtext: 'Stock at reorder point (8 left). Supplier draft ready.',
    },
  },
];

export function TransactionPipelineWidget() {
  const [activeStep, setActiveStep] = useState<number>(0);

  return (
    <div className="w-full rounded-2xl border border-separator bg-surface p-4 sm:p-6 lg:p-7 shadow-xs">
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-separator pb-3.5">
        <div>
          <span className="text-xs font-bold text-brand-primary">One sale. Everything updates.</span>
          <h3 className="text-base sm:text-lg font-bold text-primary font-display mt-0.5">
            What happens when 1 transaction occurs?
          </h3>
        </div>
        <span className="text-[11px] text-muted font-medium">Click any step to inspect</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 7-Step Progression List */}
        <div className="lg:col-span-7 space-y-1.5">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const isCurrent = activeStep === idx;
            const isDone = activeStep > idx;

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveStep(idx)}
                className={cn(
                  'w-full flex items-center gap-3 p-2 sm:p-2.5 rounded-xl border text-left transition-all duration-150 cursor-pointer',
                  isCurrent
                    ? 'border-brand-primary bg-brand-primary/5 text-primary shadow-2xs'
                    : isDone
                      ? 'border-separator/80 bg-surface text-secondary hover:border-separator hover:bg-surface-elevated'
                      : 'border-transparent bg-transparent text-muted hover:bg-surface-elevated hover:text-secondary'
                )}
              >
                <div
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition-colors',
                    isCurrent
                      ? 'border-brand-primary bg-brand-primary text-white'
                      : isDone
                        ? 'border-separator bg-surface-elevated text-emerald-600 dark:text-emerald-400'
                        : 'border-separator bg-surface-elevated text-muted'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div
                    className={cn('text-xs sm:text-sm font-semibold truncate', isCurrent && 'text-primary font-bold')}
                  >
                    {s.title}
                  </div>
                  <div className="text-[11px] text-muted truncate">{s.subtitle}</div>
                </div>

                {isCurrent && <ArrowRight className="h-3.5 w-3.5 text-brand-primary shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Live Inspection Card */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <div className="rounded-xl border border-separator bg-surface-elevated p-4 sm:p-5 shadow-2xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-brand-primary">
              {steps[activeStep].preview.label}
            </div>

            <div className="mt-2 text-xl sm:text-2xl font-extrabold text-primary font-display tabular-nums">
              {steps[activeStep].preview.value}
            </div>

            <p className="mt-1.5 text-xs text-secondary font-medium leading-relaxed">
              {steps[activeStep].preview.subtext}
            </p>

            <div className="mt-5 pt-3 border-t border-separator/80 flex items-center justify-between text-[11px] text-muted">
              <span>
                Step {activeStep + 1} of {steps.length}
              </span>
              <div className="flex gap-1">
                {steps.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'h-1 rounded-full transition-all duration-200',
                      activeStep === i ? 'w-4 bg-brand-primary' : 'w-1.5 bg-separator'
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          <p className="mt-3 text-[11px] text-center text-muted">
            Merchander connects the different parts of the business in real time.
          </p>
        </div>
      </div>
    </div>
  );
}
