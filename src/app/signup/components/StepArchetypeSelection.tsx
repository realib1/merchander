'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { ARCHETYPE_DEFINITIONS } from '@/utils/business-modules';
import { BusinessIcon } from '@/components/ui/BusinessIcon';
import { BusinessArchetype, BusinessModuleKey } from '@/types/business-modules';
import { ArchetypeCustomModulesGrid } from './ArchetypeCustomModulesGrid';

interface StepArchetypeSelectionProps {
  archetype: BusinessArchetype;
  setArchetype: (archetype: BusinessArchetype) => void;
  customModules: BusinessModuleKey[];
  onToggleCustomModule: (modKey: BusinessModuleKey) => void;
}

export function StepArchetypeSelection({
  archetype,
  setArchetype,
  customModules,
  onToggleCustomModule,
}: StepArchetypeSelectionProps) {
  const archetypeKeys = Object.keys(ARCHETYPE_DEFINITIONS) as BusinessArchetype[];

  return (
    <div className="space-y-4 animate-in fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-display">
          Select your business model
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1">
          Choose the setup that fits how you operate. We will activate the relevant tools for your workspace.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {archetypeKeys.map((key) => {
          const def = ARCHETYPE_DEFINITIONS[key];
          const isSelected = archetype === key;

          return (
            <div
              key={key}
              onClick={() => setArchetype(key)}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-brand-primary bg-brand-primary/[0.03] ring-1 ring-brand-primary/25 shadow-xs'
                  : 'border-separator bg-surface/40 hover:bg-surface hover:border-separator/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary'
                        : 'bg-background border-separator text-muted'
                    }`}
                  >
                    <BusinessIcon name={def.icon} size={16} />
                  </div>
                  {def.badge && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-surface border border-separator text-muted">
                      {def.badge}
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-semibold text-foreground">{def.name}</h3>
                <p className="text-xs text-muted mt-1 leading-relaxed line-clamp-2">{def.tagline}</p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-separator/50">
                <ul className="space-y-1">
                  {def.highlights.slice(0, 2).map((h, i) => (
                    <li key={i} className="text-[11px] text-muted flex items-center gap-1.5">
                      <Check size={12} className="text-emerald-500 shrink-0" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {archetype === 'custom' && (
        <ArchetypeCustomModulesGrid
          customModules={customModules}
          onToggleCustomModule={onToggleCustomModule}
        />
      )}
    </div>
  );
}
