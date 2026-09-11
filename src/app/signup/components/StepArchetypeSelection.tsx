'use client';

import React from 'react';
import { Check } from 'lucide-react';
import {
  ARCHETYPE_DEFINITIONS,
  MODULE_DEFINITIONS,
} from '@/utils/business-modules';
import { BusinessIcon } from '@/components/ui/BusinessIcon';
import { BusinessArchetype, BusinessModuleKey } from '@/types/business-modules';

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
  const moduleKeys = Object.keys(MODULE_DEFINITIONS) as BusinessModuleKey[];

  return (
    <div className="space-y-4 animate-in fade-in">
      <div>
        <h2 className="text-xl font-bold text-foreground">Select your business model</h2>
        <p className="text-sm text-muted mt-1">
          Choose the model that matches how you sell. We will activate the right tools for you.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {archetypeKeys.map((key) => {
          const def = ARCHETYPE_DEFINITIONS[key];
          const isSelected = archetype === key;

          return (
            <div
              key={key}
              onClick={() => setArchetype(key)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-brand-primary bg-brand-primary/5 shadow-md shadow-brand-primary/10'
                  : 'border-separator bg-surface-elevated/40 hover:border-separator-hover'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-surface border border-separator flex items-center justify-center text-brand-primary shrink-0">
                    <BusinessIcon name={def.icon} size={18} />
                  </div>
                  {def.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        def.badgeType === 'primary'
                          ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20'
                          : def.badgeType === 'emerald'
                          ? 'bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20'
                          : def.badgeType === 'indigo'
                          ? 'bg-brand-indigo/10 text-brand-indigo border border-brand-indigo/20'
                          : 'bg-brand-amber/10 text-brand-amber border border-brand-amber/20'
                      }`}
                    >
                      {def.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-foreground">{def.name}</h3>
                <p className="text-xs text-muted mt-1 leading-relaxed">{def.tagline}</p>
              </div>

              <div className="mt-3 pt-3 border-t border-separator/60">
                <ul className="space-y-1">
                  {def.highlights.slice(0, 2).map((h, i) => (
                    <li
                      key={i}
                      className="text-[11px] text-secondary flex items-center gap-1.5"
                    >
                      <Check size={12} className="text-brand-emerald shrink-0" />
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
        <div className="mt-4 p-4 rounded-xl bg-surface-elevated/60 border border-separator">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
            Select Your Custom Modules
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {moduleKeys.map((modKey) => {
              const mod = MODULE_DEFINITIONS[modKey];
              const isChecked = customModules.includes(modKey);

              return (
                <label
                  key={modKey}
                  className="flex items-center gap-2.5 p-2 rounded-lg bg-surface border border-separator text-xs cursor-pointer hover:bg-surface-elevated transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggleCustomModule(modKey)}
                    className="rounded text-brand-primary focus:ring-brand-primary"
                  />
                  <BusinessIcon name={mod.icon} size={14} className="text-brand-primary shrink-0" />
                  <span className="font-medium text-foreground">{mod.name}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
