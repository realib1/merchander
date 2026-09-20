'use client';

import React from 'react';
import { ARCHETYPE_DEFINITIONS, MODULE_DEFINITIONS } from '@/utils/business-modules';
import { BusinessIcon } from '@/components/ui/BusinessIcon';
import { BusinessArchetype, BusinessModuleKey } from '@/types/business-modules';

interface StepReviewLaunchProps {
  archetype: BusinessArchetype;
  slug: string;
  customModules: BusinessModuleKey[];
  onChangeArchetype: () => void;
}

export function StepReviewLaunch({ archetype, slug, customModules, onChangeArchetype }: StepReviewLaunchProps) {
  const activeArchetypeDef = ARCHETYPE_DEFINITIONS[archetype];
  const activeModulesList = archetype === 'custom' ? customModules : activeArchetypeDef.defaultModules;

  const categories: { title: string; pillar: 'commerce' | 'money' | 'intelligence' }[] = [
    { title: 'Commerce & Logistics', pillar: 'commerce' },
    { title: 'Money & Finances', pillar: 'money' },
    { title: 'Intelligence', pillar: 'intelligence' },
  ];

  return (
    <div className="space-y-4 animate-in fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-display">Ready to launch</h1>
        <p className="text-xs sm:text-sm text-muted mt-1">
          Review your workspace configuration before creating your account.
        </p>
      </div>

      {/* Summary card */}
      <div className="p-4 rounded-xl bg-surface/50 border border-separator flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-background border border-separator flex items-center justify-center text-brand-primary shrink-0">
            <BusinessIcon name={activeArchetypeDef.icon} size={20} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{activeArchetypeDef.name}</h3>
            <p className="text-xs font-mono text-muted mt-0.5">https://{slug}.merchander.store</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onChangeArchetype}
          className="text-xs font-medium text-brand-primary hover:underline cursor-pointer shrink-0"
        >
          Change
        </button>
      </div>

      {/* Modules grouped by pillar */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Active Modules ({activeModulesList.length})
        </div>

        <div className="space-y-2.5">
          {categories.map((cat) => {
            const mods = activeModulesList.filter((m) => MODULE_DEFINITIONS[m]?.pillar === cat.pillar);
            if (mods.length === 0) return null;

            return (
              <div key={cat.pillar} className="p-3 rounded-xl bg-surface/30 border border-separator/60 space-y-2">
                <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">{cat.title}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {mods.map((modKey) => {
                    const mod = MODULE_DEFINITIONS[modKey];
                    if (!mod) return null;

                    return (
                      <div
                        key={modKey}
                        className="p-2 rounded-lg bg-background border border-separator/60 flex items-center gap-2 text-xs"
                      >
                        <BusinessIcon name={mod.icon} size={14} className="text-brand-primary shrink-0" />
                        <span className="font-medium text-foreground truncate">{mod.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Free access guarantee */}
      <div className="p-3 rounded-xl bg-surface/40 border border-separator/60 text-xs text-muted">
        <span className="font-semibold text-foreground">14-day full access included.</span> No credit card or payment
        details required to start.
      </div>
    </div>
  );
}
