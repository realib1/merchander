'use client';

import React from 'react';
import { PreorderBatchStatus } from '@/types/preorder';
import { Check, Clock, Plane, Ship, Package, CheckCircle2, ShoppingBag } from 'lucide-react';

interface BatchLifecycleStepperProps {
  currentStatus: PreorderBatchStatus;
  freightMode?: 'sea' | 'air' | 'express' | 'road';
  compact?: boolean;
}

const ORDERED_STEPS: Array<{
  status: PreorderBatchStatus;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}> = [
  { status: 'OPEN', label: 'Open', shortLabel: 'Open', icon: ShoppingBag },
  { status: 'CLOSING_SOON', label: 'Closing Soon', shortLabel: 'Closing', icon: Clock },
  { status: 'CLOSED', label: 'Closed (PO Prep)', shortLabel: 'Closed', icon: Clock },
  { status: 'ORDER_SUBMITTED', label: 'Supplier Ordered', shortLabel: 'PO Sent', icon: Package },
  { status: 'IN_TRANSIT', label: 'In Transit', shortLabel: 'In Transit', icon: Ship },
  { status: 'ARRIVED', label: 'Arrived at Hub', shortLabel: 'Arrived', icon: CheckCircle2 },
  { status: 'FULFILLING', label: 'Dispatching', shortLabel: 'Fulfilling', icon: Package },
  { status: 'COMPLETED', label: 'Delivered', shortLabel: 'Done', icon: Check },
];

export function BatchLifecycleStepper({
  currentStatus,
  freightMode = 'sea',
  compact = false,
}: BatchLifecycleStepperProps) {
  const currentIndex = ORDERED_STEPS.findIndex((s) => s.status === currentStatus);
  const activeIdx = currentIndex === -1 ? 0 : currentIndex;

  if (compact) {
    return (
      <div className="space-y-1.5 w-full">
        {/* Progress Bar Track */}
        <div className="flex items-center gap-1 w-full">
          {ORDERED_STEPS.map((step, idx) => {
            const isCompleted = idx < activeIdx;
            const isCurrent = idx === activeIdx;

            return (
              <div
                key={step.status}
                className={`h-1.5 rounded-full flex-1 transition-all ${
                  isCompleted
                    ? 'bg-emerald-500'
                    : isCurrent
                    ? 'bg-brand-primary ring-2 ring-brand-primary/20 animate-pulse'
                    : 'bg-separator/60'
                }`}
                title={`${step.label} (${isCompleted ? 'Completed' : isCurrent ? 'Current' : 'Upcoming'})`}
              />
            );
          })}
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono text-muted">
          <span>Step {activeIdx + 1} of 8</span>
          <span className="font-semibold text-foreground">
            {ORDERED_STEPS[activeIdx]?.label || currentStatus}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-2">
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {ORDERED_STEPS.map((step, idx) => {
          const isCompleted = idx < activeIdx;
          const isCurrent = idx === activeIdx;
          const isFreightStep = step.status === 'IN_TRANSIT';
          const StepIcon = isFreightStep && (freightMode === 'air' || freightMode === 'express')
            ? Plane
            : step.icon;

          return (
            <div
              key={step.status}
              className={`flex flex-col items-center text-center p-2 rounded-xl border transition-all ${
                isCompleted
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : isCurrent
                  ? 'bg-brand-primary/10 border-brand-primary text-brand-primary ring-1 ring-brand-primary/30 font-bold shadow-xs'
                  : 'bg-surface-elevated/40 border-separator/40 text-muted opacity-50'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs mb-1 font-mono ${
                  isCompleted
                    ? 'bg-emerald-500 text-white font-bold'
                    : isCurrent
                    ? 'bg-brand-primary text-brand-primary-foreground font-bold'
                    : 'bg-surface border border-separator text-muted'
                }`}
              >
                {isCompleted ? <Check size={12} /> : <StepIcon size={12} />}
              </div>
              <span className="text-[10px] leading-tight font-medium line-clamp-1">
                {step.shortLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
