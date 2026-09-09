'use client';

import React from 'react';
import { Layers } from 'lucide-react';
import { ARCHETYPES, Archetype, ArchetypeConfig } from './types';

interface ArchetypeSectionProps {
  selectedArchetype: Archetype;
  onSelect: (arch: ArchetypeConfig) => void;
}

export function ArchetypeSection({ selectedArchetype, onSelect }: ArchetypeSectionProps) {
  return (
    <div className="space-y-3 pt-4 border-t border-separator/60">
      <div className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
        <Layers size={13} />
        <span>2. Business Archetype & Capabilities</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {ARCHETYPES.map((arch) => {
          const Icon = arch.icon;
          const isSelected = selectedArchetype === arch.id;
          return (
            <button
              key={arch.id}
              type="button"
              onClick={() => onSelect(arch)}
              className={`flex flex-col items-start p-3 rounded-xl border text-left transition cursor-pointer ${
                isSelected
                  ? 'bg-brand/10 border-brand text-brand shadow-xs'
                  : 'bg-surface border-separator text-muted hover:text-foreground hover:border-separator/80'
              }`}
            >
              <Icon size={16} className="mb-2" />
              <span className="font-bold text-xs text-foreground">{arch.label}</span>
              <span className="text-[10px] text-muted line-clamp-2 mt-1 leading-tight">
                {arch.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
