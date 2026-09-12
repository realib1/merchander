'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface WizardControlsProps {
  currentStep: number;
  isSubmitting: boolean;
  onBack: () => void;
  onNext: () => void;
  onLaunch: () => void;
}

export function WizardControls({
  currentStep,
  isSubmitting,
  onBack,
  onNext,
  onLaunch,
}: WizardControlsProps) {
  if (currentStep <= 1) return null;

  return (
    <div className="mt-8 pt-5 border-t border-separator flex items-center justify-between">
      <button
        type="button"
        onClick={onBack}
        disabled={isSubmitting}
        className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-xl border border-separator transition-all text-foreground hover:bg-surface cursor-pointer disabled:opacity-50"
      >
        <ChevronLeft size={16} />
        <span>Back</span>
      </button>

      {currentStep < 4 ? (
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold rounded-xl bg-brand-primary text-white hover:bg-brand-primary-hover shadow-xs shadow-brand-primary/25 transition-all cursor-pointer"
        >
          <span>Continue</span>
          <ChevronRight size={16} />
        </button>
      ) : (
        <button
          type="button"
          onClick={onLaunch}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl bg-brand-primary text-white hover:bg-brand-primary-hover shadow-xs shadow-brand-primary/25 transition-all cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Setting up your store...</span>
            </>
          ) : (
            <>
              <span>Launch Workspace</span>
              <ChevronRight size={16} />
            </>
          )}
        </button>
      )}
    </div>
  );
}
