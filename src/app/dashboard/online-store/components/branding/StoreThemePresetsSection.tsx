'use client';

import React from 'react';
import { Palette } from 'lucide-react';
import { BRAND_THEME_PRESETS } from './branding-presets';

interface StoreThemePresetsSectionProps {
  primaryColor: string;
  secondaryColor: string;
  onPrimaryColorChange: (val: string) => void;
  onSecondaryColorChange: (val: string) => void;
}

export function StoreThemePresetsSection({
  primaryColor,
  secondaryColor,
  onPrimaryColorChange,
  onSecondaryColorChange,
}: StoreThemePresetsSectionProps) {
  return (
    <div className="bg-surface border border-separator rounded-2xl p-6 shadow-xs space-y-5">
      <div className="pb-3 border-b border-separator/60">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Palette size={16} style={{ color: primaryColor }} /> Color Palette &amp; Theme Presets
        </h3>
        <p className="text-xs text-muted mt-0.5">
          Select a curated aesthetic theme or enter custom HEX values for your buttons and accents.
        </p>
      </div>

      {/* Preset Chips */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground block">Curated Brand Themes</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {BRAND_THEME_PRESETS.map((preset) => {
            const isSelected =
              primaryColor.toLowerCase() === preset.primary.toLowerCase() &&
              secondaryColor.toLowerCase() === preset.secondary.toLowerCase();
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => {
                  onPrimaryColorChange(preset.primary);
                  onSecondaryColorChange(preset.secondary);
                }}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  isSelected
                    ? 'border-brand-primary bg-surface-elevated ring-1 ring-brand-primary/40 shadow-xs'
                    : 'border-separator/80 bg-surface hover:border-separator text-muted hover:text-foreground'
                }`}
              >
                <div className="flex items-center -space-x-1 shrink-0">
                  <span className="w-4 h-4 rounded-full border border-white/20 shadow-xs" style={{ backgroundColor: preset.primary }} />
                  <span className="w-4 h-4 rounded-full border border-white/20 shadow-xs" style={{ backgroundColor: preset.secondary }} />
                </div>
                <span className="text-xs font-medium truncate text-foreground">{preset.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Color Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-separator/40">
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Primary Color (Buttons &amp; Badges)</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => onPrimaryColorChange(e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer border border-separator bg-transparent p-0"
            />
            <input
              type="text"
              value={primaryColor}
              onChange={(e) => onPrimaryColorChange(e.target.value)}
              className="flex-1 bg-surface-elevated border border-separator rounded-xl px-3.5 py-2 text-xs font-mono text-foreground outline-none focus-visible:ring-1 focus-visible:ring-brand-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted mb-1">Secondary / Dark Accent</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={secondaryColor}
              onChange={(e) => onSecondaryColorChange(e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer border border-separator bg-transparent p-0"
            />
            <input
              type="text"
              value={secondaryColor}
              onChange={(e) => onSecondaryColorChange(e.target.value)}
              className="flex-1 bg-surface-elevated border border-separator rounded-xl px-3.5 py-2 text-xs font-mono text-foreground outline-none focus-visible:ring-1 focus-visible:ring-brand-primary"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
