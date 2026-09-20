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

export function WizardControls({ currentStep, isSubmitting, onBack, onNext, onLaunch }: WizardControlsProps) {
  if (currentStep <= 1) return null;

  return (
    <div className="mt-8 pt-4 border-t border-separator flex items-center justify-between">
      <button
        type="button"
        onClick={onBack}
        disabled={isSubmitting}
        className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-semibold rounded-xl border border-separator text-foreground hover:bg-surface cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={14} />
        <span>Back</span>
      </button>

      {currentStep < 4 ? (
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-brand-primary text-white hover:bg-brand-primary-hover active:scale-[0.99] transition-colors cursor-pointer"
        >
          <span>Continue</span>
          <ChevronRight size={14} />
        </button>
      ) : (
        <button
          type="button"
          onClick={onLaunch}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl bg-brand-primary text-white hover:bg-brand-primary-hover active:scale-[0.99] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Setting up store...</span>
            </>
          ) : (
            <span>Create Workspace</span>
          )}
        </button>
      )}
    </div>
  );
}
