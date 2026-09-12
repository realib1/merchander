'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import {
  ARCHETYPE_DEFINITIONS,
  MODULE_DEFINITIONS,
} from '@/utils/business-modules';
import { BusinessIcon } from '@/components/ui/BusinessIcon';
import { BusinessArchetype, BusinessModuleKey } from '@/types/business-modules';

interface StepReviewLaunchProps {
  archetype: BusinessArchetype;
  slug: string;
  customModules: BusinessModuleKey[];
  onChangeArchetype: () => void;
}

export function StepReviewLaunch({
  archetype,
  slug,
  customModules,
  onChangeArchetype,
}: StepReviewLaunchProps) {
  const activeArchetypeDef = ARCHETYPE_DEFINITIONS[archetype];
  const activeModulesList =
    archetype === 'custom' ? customModules : activeArchetypeDef.defaultModules;
  const moduleKeys = Object.keys(MODULE_DEFINITIONS) as BusinessModuleKey[];

  return (
    <div className="space-y-5 animate-in fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-display">
          Ready to launch your workspace
        </h1>
        <p className="text-xs sm:text-sm text-muted font-medium mt-1">
          We configured your tools based on your business model. You can adjust modules anytime.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-surface/60 border border-separator flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-background border border-separator flex items-center justify-center text-brand-primary shrink-0">
            <BusinessIcon name={activeArchetypeDef.icon} size={24} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">
              {activeArchetypeDef.name}
            </h2>
            <p className="text-xs text-brand-primary font-mono mt-0.5">
              https://{slug}.merchander.store
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onChangeArchetype}
          className="text-xs font-medium text-muted hover:text-foreground px-2.5 py-1 rounded-lg border border-separator bg-background cursor-pointer transition-colors"
        >
          Change
        </button>
      </div>

      <div>
        <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-2.5">
          Active Modules for Your Workspace
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {moduleKeys.map((modKey) => {
            const mod = MODULE_DEFINITIONS[modKey];
            const isEnabled = activeModulesList.includes(modKey);

            return (
              <div
                key={modKey}
                className={`p-3 rounded-xl border flex items-center gap-3 ${
                  isEnabled
                    ? 'bg-surface/50 border-separator'
                    : 'bg-surface/20 border-separator/40 opacity-40'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${
                    isEnabled
                      ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary'
                      : 'bg-surface border-separator text-muted'
                  }`}
                >
                  <BusinessIcon name={mod.icon} size={14} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">{mod.name}</div>
                  <div className="text-[10px] text-muted">
                    {isEnabled ? 'Active in navigation' : 'Dormant (can enable later)'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
        <CheckCircle2 size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
        <span>
          <strong>14-Day Free Access:</strong> All features are unlocked with zero payment details required upfront.
        </span>
      </div>
    </div>
  );
}
