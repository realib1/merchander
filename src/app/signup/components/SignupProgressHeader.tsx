'use client';

import React from 'react';

interface SignupProgressHeaderProps {
  currentStep: number;
}

const STEP_NAMES = ['Account Setup', 'Store Profile', 'Business Type', 'Review & launch'];

export function SignupProgressHeader({ currentStep }: SignupProgressHeaderProps) {
  const stepIndex = Math.min(Math.max(currentStep, 1), 4) - 1;

  return (
    <div className="mb-7">
      <div className="flex items-center justify-between mb-2.5">
        <span className="font-medium text-foreground text-xs uppercase tracking-wider text-muted">
          {STEP_NAMES[stepIndex]}
        </span>
        <span className="text-xs text-muted tabular-nums">
          <span className="font-semibold text-foreground">{currentStep}</span> / 4
        </span>
      </div>
      <div className="grid grid-cols-4 gap-1.5 h-1 w-full rounded-full overflow-hidden">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`h-full rounded-full transition-all duration-300 ${
              s <= currentStep ? 'bg-brand-primary' : 'bg-separator/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
