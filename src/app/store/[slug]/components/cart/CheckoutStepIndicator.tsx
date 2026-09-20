'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface Step {
  num: 1 | 2 | 3;
  label: string;
}

interface CheckoutStepIndicatorProps {
  steps: Step[];
  activeStep: 1 | 2 | 3;
  primaryColor: string;
  onSelectStep: (step: 1 | 2 | 3) => void;
}

export function CheckoutStepIndicator({
  steps,
  activeStep,
  primaryColor,
  onSelectStep,
}: CheckoutStepIndicatorProps) {
  return (
    <div className="flex items-center justify-center py-2 px-1">
      {steps.map((step, idx) => {
        const isCompleted = activeStep > step.num;
        const isActive = activeStep === step.num;
        const canClick = isCompleted || isActive;

        return (
          <React.Fragment key={step.num}>
            <button
              type="button"
              disabled={!canClick}
              onClick={() => canClick && onSelectStep(step.num)}
              className={`flex items-center gap-2 group transition cursor-pointer disabled:cursor-not-allowed ${
                isActive ? 'opacity-100' : isCompleted ? 'opacity-85 hover:opacity-100' : 'opacity-40'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold transition-transform shrink-0 ${
                  isActive
                    ? 'text-white shadow-xs scale-105'
                    : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-surface-elevated border border-separator text-muted'
                }`}
                style={isActive ? { backgroundColor: primaryColor } : undefined}
              >
                {isCompleted ? <Check size={12} strokeWidth={3} /> : step.num}
              </span>
              <span
                className={`text-xs font-bold ${
                  isActive ? 'text-foreground font-black' : isCompleted ? 'text-foreground' : 'text-muted'
                }`}
              >
                {step.label}
              </span>
            </button>

            {idx < steps.length - 1 && (
              <div
                className={`h-0.5 w-8 sm:w-12 mx-2 rounded transition-colors ${
                  activeStep > step.num ? 'bg-emerald-500' : 'bg-separator'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
