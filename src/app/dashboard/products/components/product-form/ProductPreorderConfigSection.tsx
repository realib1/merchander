'use client';

import React, { useState } from 'react';
import { PreorderBatch, PreorderFreightMode } from '@/types/preorder';
import { formatArrivalWindow, getBatchCountdown } from '@/utils/preorder-batch';
import { addDays, format } from 'date-fns';
import { Plus, Layers } from 'lucide-react';

export interface PreorderCustomBatchState {
  isNewBatch: boolean;
  batchId?: string;
  name: string;
  code: string;
  closesAt: string;
  supplierOrderDate: string;
  expectedArrivalStart: string;
  expectedArrivalEnd: string;
  freightMode: PreorderFreightMode;
  originCountry: string;
}

interface ProductPreorderConfigSectionProps {
  batches: PreorderBatch[];
  selectedBatchId?: string | null;
  customBatch: PreorderCustomBatchState;
  shippingMode: 'included' | 'tbd';
  productName: string;
  onSelectBatchId: (id: string | null) => void;
  onCustomBatchChange: (batch: PreorderCustomBatchState) => void;
  onShippingModeChange: (mode: 'included' | 'tbd') => void;
}

const durationPresets = [
  { id: '1_week', label: '⚡ 1 Week (Express Air)', days: 7, freight: 'express' as PreorderFreightMode },
  { id: '2_weeks', label: '✈️ 2 Weeks (Air Freight)', days: 14, freight: 'air' as PreorderFreightMode },
  { id: '1_month', label: '🚢 1 Month (Sea / Road)', days: 30, freight: 'sea' as PreorderFreightMode },
  { id: '6_weeks', label: '🚢 1.5 Months (Sea Freight)', days: 45, freight: 'sea' as PreorderFreightMode },
  { id: '2_months', label: '🚢 2 Months (Standard Sea)', days: 60, freight: 'sea' as PreorderFreightMode },
  { id: 'custom', label: '📅 Custom Date Range', days: 0, freight: 'sea' as PreorderFreightMode },
];

export function ProductPreorderConfigSection({
  batches,
  selectedBatchId,
  customBatch,
  shippingMode,
  productName,
  onSelectBatchId,
  onCustomBatchChange,
  onShippingModeChange,
}: ProductPreorderConfigSectionProps) {
  const [activeTab, setActiveTab] = useState<'existing' | 'new'>(
    customBatch.isNewBatch || batches.length === 0 ? 'new' : 'existing'
  );
  const [selectedPreset, setSelectedPreset] = useState<string>('2_months');

  const applyPreset = (presetId: string, baseCloseDateStr?: string) => {
    setSelectedPreset(presetId);
    const preset = durationPresets.find((p) => p.id === presetId);
    if (!preset || preset.id === 'custom') return;

    const closeDate = baseCloseDateStr ? new Date(baseCloseDateStr) : new Date();
    const arrivalStart = addDays(closeDate, preset.days);
    const arrivalEnd = addDays(arrivalStart, 7);

    onCustomBatchChange({
      ...customBatch,
      isNewBatch: true,
      freightMode: preset.freight,
      supplierOrderDate: format(addDays(closeDate, 1), 'yyyy-MM-dd'),
      expectedArrivalStart: format(arrivalStart, 'yyyy-MM-dd'),
      expectedArrivalEnd: format(arrivalEnd, 'yyyy-MM-dd'),
    });
  };

  const handleCloseDateChange = (dateStr: string) => {
    const nextCustom = { ...customBatch, closesAt: dateStr, isNewBatch: true };
    onCustomBatchChange(nextCustom);
    if (selectedPreset !== 'custom') {
      applyPreset(selectedPreset, dateStr);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-separator/80 space-y-4">
      {/* Batch Assignment Mode Switcher */}
      <div className="space-y-1.5">
        <label className="block text-body-sm font-semibold text-foreground">Pre-Order Procurement Batch</label>
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-surface-elevated border border-separator">
          <button
            type="button"
            onClick={() => {
              setActiveTab('existing');
              onCustomBatchChange({ ...customBatch, isNewBatch: false });
              if (!selectedBatchId && batches.length > 0) onSelectBatchId(batches[0].id);
            }}
            disabled={batches.length === 0}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'existing' && batches.length > 0
                ? 'bg-surface text-foreground shadow-2xs border border-separator/80'
                : 'text-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            <Layers size={13} />
            <span>Existing Batch ({batches.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('new');
              onCustomBatchChange({
                ...customBatch,
                isNewBatch: true,
                name: customBatch.name || `${productName || 'Pre-Order'} Batch`,
              });
              onSelectBatchId(null);
            }}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'new'
                ? 'bg-surface text-foreground shadow-2xs border border-separator/80'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <Plus size={13} />
            <span>Custom Batch / Dates</span>
          </button>
        </div>
      </div>

      {/* Existing Batch Dropdown */}
      {activeTab === 'existing' && batches.length > 0 && (
        <div className="space-y-2">
          <select
            value={selectedBatchId || ''}
            onChange={(e) => onSelectBatchId(e.target.value || null)}
            className="w-full px-3 py-2 bg-surface border border-separator rounded-xl text-xs font-semibold text-foreground focus:ring-1 focus:ring-brand-primary"
          >
            {batches.map((b) => {
              const countdown = getBatchCountdown(b.closes_at);
              const arrival = formatArrivalWindow(b.expected_arrival_start, b.expected_arrival_end);
              return (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code}) — Closes: {countdown.label} • Arrives: {arrival}
                </option>
              );
            })}
          </select>
        </div>
      )}

      {/* Custom Batch Form */}
      {activeTab === 'new' && (
        <div className="p-3.5 rounded-2xl bg-surface-elevated/70 border border-separator space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block font-bold text-muted text-[11px] mb-1">Batch Title *</label>
              <input
                type="text"
                placeholder="e.g. Batch A, Wave 1, Sept Air"
                value={customBatch.name}
                onChange={(e) => onCustomBatchChange({ ...customBatch, name: e.target.value, isNewBatch: true })}
                className="w-full rounded-lg bg-surface border border-separator px-2.5 py-1.5 text-foreground text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-muted text-[11px] mb-1">Pre-Orders Close On *</label>
              <input
                type="date"
                value={customBatch.closesAt}
                onChange={(e) => handleCloseDateChange(e.target.value)}
                className="w-full rounded-lg bg-surface border border-separator px-2.5 py-1.5 text-foreground text-xs"
              />
            </div>
          </div>

          {/* Delivery & Arrival Duration Presets */}
          <div className="space-y-1.5">
            <label className="block font-bold text-muted text-[11px]">Expected Duration / Arrival</label>
            <div className="grid grid-cols-2 gap-1.5">
              {durationPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.id, customBatch.closesAt)}
                  className={`p-2 rounded-xl border text-left text-[11px] font-semibold transition cursor-pointer ${
                    selectedPreset === preset.id
                      ? 'border-brand-primary bg-brand-primary/10 text-brand-primary font-bold'
                      : 'border-separator bg-surface text-muted hover:text-foreground'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Pickers */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="block font-semibold text-muted text-[10px] mb-1">Arrival Window Start</label>
              <input
                type="date"
                value={customBatch.expectedArrivalStart}
                onChange={(e) =>
                  onCustomBatchChange({ ...customBatch, expectedArrivalStart: e.target.value, isNewBatch: true })
                }
                className="w-full text-xs rounded-lg bg-surface border border-separator px-2 py-1 text-foreground"
              />
            </div>
            <div>
              <label className="block font-semibold text-muted text-[10px] mb-1">Arrival Window End</label>
              <input
                type="date"
                value={customBatch.expectedArrivalEnd}
                onChange={(e) =>
                  onCustomBatchChange({ ...customBatch, expectedArrivalEnd: e.target.value, isNewBatch: true })
                }
                className="w-full text-xs rounded-lg bg-surface border border-separator px-2 py-1 text-foreground"
              />
            </div>
          </div>
        </div>
      )}

      {/* Shipping Mode */}
      <div>
        <label className="text-body-sm font-semibold mb-1.5 block">Pre-Order Shipping Fee</label>
        <select
          value={shippingMode}
          onChange={(e) => onShippingModeChange(e.target.value as 'included' | 'tbd')}
          className="w-full px-3 py-2 bg-surface border border-separator rounded-xl text-xs text-foreground focus:ring-1 focus:ring-brand-primary"
        >
          <option value="included">Shipping Included in Price</option>
          <option value="tbd">TBD (Customer Pays on Ghana Arrival)</option>
        </select>
      </div>
    </div>
  );
}
