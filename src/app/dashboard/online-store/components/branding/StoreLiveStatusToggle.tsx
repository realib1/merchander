'use client';

import React from 'react';

interface StoreLiveStatusToggleProps {
  isActive: boolean;
  primaryColor: string;
  onIsActiveChange: (val: boolean) => void;
}

export function StoreLiveStatusToggle({
  isActive,
  primaryColor,
  onIsActiveChange,
}: StoreLiveStatusToggleProps) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide transition-all ${
          isActive
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs'
            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
          }`}
        />
        <span>{isActive ? 'Live Store' : 'Offline / Draft'}</span>
      </span>

      <button
        type="button"
        role="switch"
        aria-checked={isActive}
        onClick={() => onIsActiveChange(!isActive)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 ${
          isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-zinc-700'
        }`}
        style={isActive ? { backgroundColor: primaryColor || '#10b981' } : undefined}
      >
        <span className="sr-only">Toggle Storefront Active Status</span>
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
            isActive ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
