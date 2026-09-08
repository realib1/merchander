'use client';

import React from 'react';
import { AIActionRecord } from '@/types/actions';
import { UrgentExceptionCard } from './UrgentExceptionCard';
import { ShieldCheck } from 'lucide-react';

interface UrgentExceptionsListProps {
  exceptions: AIActionRecord[];
  onMutated?: () => void;
}

export function UrgentExceptionsList({ exceptions, onMutated }: UrgentExceptionsListProps) {
  if (exceptions.length === 0) {
    return (
      <div className="bg-surface border border-separator rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">No Urgent Exceptions</h3>
          <p className="text-xs text-muted max-w-sm mt-1">
            All customer dialogues are proceeding safely under AI guidance. Explicit human escalations or disputes will appear here for 1-click takeover.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {exceptions.map((exc) => (
        <UrgentExceptionCard key={exc.id} action={exc} onMutated={onMutated} />
      ))}
    </div>
  );
}
