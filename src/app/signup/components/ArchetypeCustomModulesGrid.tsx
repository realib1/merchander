'use client';

import React from 'react';
import { MODULE_DEFINITIONS } from '@/utils/business-modules';
import { BusinessModuleKey } from '@/types/business-modules';

interface ArchetypeCustomModulesGridProps {
  customModules: BusinessModuleKey[];
  onToggleCustomModule: (modKey: BusinessModuleKey) => void;
}

const CUSTOM_PILLAR_GROUPS: { title: string; modules: BusinessModuleKey[] }[] = [
  {
    title: 'Commerce & Logistics',
    modules: ['storefront', 'shipments', 'batches', 'suppliers'],
  },
  {
    title: 'Money & Invoicing',
    modules: [
      'cashflow',
      'invoices',
      'quotes',
      'compliance',
      'payroll',
      'funding_plans',
      'calculators',
      'profitability',
    ],
  },
  {
    title: 'Intelligence',
    modules: ['intelligence'],
  },
];

export function ArchetypeCustomModulesGrid({
  customModules,
  onToggleCustomModule,
}: ArchetypeCustomModulesGridProps) {
  return (
    <div className="mt-4 p-4 rounded-xl bg-surface/40 border border-separator space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Customize Active Modules</h4>
        <span className="text-xs text-muted">{customModules.length} selected</span>
      </div>

      <div className="space-y-3.5">
        {CUSTOM_PILLAR_GROUPS.map((group) => (
          <div key={group.title} className="space-y-2">
            <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">{group.title}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {group.modules.map((modKey) => {
                const mod = MODULE_DEFINITIONS[modKey];
                if (!mod) return null;
                const isChecked = customModules.includes(modKey);

                return (
                  <label
                    key={modKey}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                      isChecked
                        ? 'bg-background border-brand-primary/40 text-foreground'
                        : 'bg-background/60 border-separator hover:bg-background text-muted hover:text-foreground'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleCustomModule(modKey)}
                      className="rounded text-brand-primary focus:ring-brand-primary/20 accent-brand-primary cursor-pointer shrink-0"
                    />
                    <span className="font-medium">{mod.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
