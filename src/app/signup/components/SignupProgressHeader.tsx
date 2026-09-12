'use client';

import React from 'react';

interface SignupProgressHeaderProps {
  currentStep: number;
}

const STEP_NAMES = [
  'Account Credentials',
  'Store Profile',
  'Business Model',
  'Review & Launch',
];

export function SignupProgressHeader({ currentStep }: SignupProgressHeaderProps) {
  const stepIndex = Math.min(Math.max(currentStep, 1), 4) - 1;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between text-xs font-medium mb-2.5">
        <span className="font-semibold text-foreground tracking-tight">
          {STEP_NAMES[stepIndex]}
        </span>
        <span className="text-muted tabular-nums">
          Step <span className="font-semibold text-foreground">{currentStep}</span> of 4
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2 h-1 w-full rounded-full overflow-hidden">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`h-full rounded-full transition-all duration-300 ${
              s <= currentStep ? 'bg-brand-primary' : 'bg-separator/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
