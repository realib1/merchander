'use client';

import React from 'react';

interface SignupProgressHeaderProps {
  currentStep: number;
}

const STEP_TITLES = [
  'Step 1 of 4: Account Credentials',
  'Step 2 of 4: Business Details',
  'Step 3 of 4: Business Archetype',
  'Step 4 of 4: Review & Launch',
];

const NEXT_TITLES = [
  'Next: Store Setup',
  'Next: Model Selection',
  'Next: Launch',
  'Ready to Launch',
];

export function SignupProgressHeader({ currentStep }: SignupProgressHeaderProps) {
  const stepIndex = Math.min(Math.max(currentStep, 1), 4) - 1;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between text-xs font-semibold mb-2">
        <span className="text-brand-primary flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-primary text-white text-[10px] font-bold">
            {currentStep}
          </span>
          {STEP_TITLES[stepIndex]}
        </span>
        <span className="text-[11px] text-muted hidden sm:inline">
          {NEXT_TITLES[stepIndex]}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full bg-separator/50 rounded-full overflow-hidden">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`h-full rounded-full transition-all duration-300 ${
              s <= currentStep ? 'bg-brand-primary' : 'bg-separator'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
