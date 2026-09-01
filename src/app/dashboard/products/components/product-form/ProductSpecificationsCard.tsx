'use client';

import React from 'react';
import { Plus, Trash2, SlidersHorizontal, Layers, RotateCcw, Check } from 'lucide-react';
import { ProductSpecification } from '@/types/product';

interface ProductSpecificationsCardProps {
  specifications: ProductSpecification[];
  onChange: (specs: ProductSpecification[]) => void;
}

interface SpecPreset {
  id: string;
  name: string;
  keys: string[];
}

const PRESETS: SpecPreset[] = [
  {
    id: 'phones',
    name: 'Phones & Tablets',
    keys: ['Brand', 'Model', 'Storage', 'RAM', 'Battery', 'Screen Size', 'Condition', 'Warranty'],
  },
  {
    id: 'laptops',
    name: 'Laptops & Computers',
    keys: [
      'Brand',
      'Model',
      'Processor',
      'RAM',
      'Storage',
      'Screen Size',
      'Graphics',
      'Operating System',
      'Condition',
      'Warranty',
    ],
  },
  {
    id: 'fashion',
    name: 'Fashion & Apparel',
    keys: ['Brand', 'Material', 'Fit / Cut', 'Gender', 'Care Instructions', 'Country of Origin'],
  },
  {
    id: 'beauty',
    name: 'Beauty & Skincare',
    keys: ['Brand', 'Volume / Net Wt', 'Skin Type', 'Key Ingredients', 'Shelf Life', 'Country of Origin'],
  },
  {
    id: 'appliances',
    name: 'Electronics & Appliances',
    keys: ['Brand', 'Model', 'Power / Wattage', 'Dimensions', 'Connectivity', 'Warranty'],
  },
];

function getValuePlaceholder(rawKey: string): string {
  const k = rawKey.toLowerCase().trim();
  if (k.includes('ram') || k.includes('memory')) return 'e.g. 8GB, 16GB Unified Memory, 32GB DDR5';
  if (k.includes('storage') || k.includes('ssd') || k.includes('hdd')) return 'e.g. 256GB SSD, 512GB NVMe, 1TB';
  if (k.includes('processor') || k.includes('cpu')) return 'e.g. Intel Core i7 13th Gen, Apple M3 Pro, Ryzen 7';
  if (k.includes('graphic') || k.includes('gpu')) return 'e.g. NVIDIA RTX 4060 8GB, Apple M3 GPU';
  if (k.includes('screen') || k.includes('display')) return 'e.g. 15.6" FHD IPS 144Hz, 14" Liquid Retina XDR';
  if (k.includes('os') || k.includes('system')) return 'e.g. Windows 11 Pro, macOS Sonoma';
  if (k.includes('brand')) return 'e.g. Apple, Samsung, HP, Dell, Zara, CeraVe';
  if (k.includes('model')) return 'e.g. MacBook Pro 14", iPhone 15 Pro, XPS 15';
  if (k.includes('battery')) return 'e.g. 5000mAh, 100% Battery Health, 18 Hours';
  if (k.includes('condition')) return 'e.g. Brand New Sealed, UK Used (Grade A+)';
  if (k.includes('warranty')) return 'e.g. 1 Year AppleCare, 6 Months Store Warranty';
  if (k.includes('material') || k.includes('fabric')) return 'e.g. 100% Organic Cotton, Genuine Leather, Silk';
  if (k.includes('fit') || k.includes('cut')) return 'e.g. Regular Fit, Slim Fit, Boxy Oversized';
  if (k.includes('gender')) return 'e.g. Unisex, Men, Women';
  if (k.includes('care')) return 'e.g. Machine wash cold, Dry clean only';
  if (k.includes('volume') || k.includes('weight') || k.includes('size')) return 'e.g. 50ml / 1.7 fl oz, 250g';
  if (k.includes('skin')) return 'e.g. Normal, Dry, Oily, Combination, Sensitive';
  if (k.includes('ingredient')) return 'e.g. Niacinamide 10%, Hyaluronic Acid, Shea Butter';
  if (k.includes('shelf') || k.includes('expir')) return 'e.g. 24 Months after opening, Exp: 12/2027';
  if (k.includes('origin')) return 'e.g. Made in Ghana, France, South Korea';
  if (k.includes('power') || k.includes('watt')) return 'e.g. 2200W, 110V - 240V';
  if (k.includes('dimension')) return 'e.g. 35 x 24 x 1.8 cm, 1.4 kg';
  if (k.includes('connect')) return 'e.g. Wi-Fi 6E, Bluetooth 5.3, USB-C';
  return 'e.g. Enter specification value...';
}

export function ProductSpecificationsCard({ specifications, onChange }: ProductSpecificationsCardProps) {
  const handleAddSpec = (key = '', value = '') => {
    onChange([...specifications, { key, value }]);
  };

  const handleUpdateSpec = (index: number, field: 'key' | 'value', text: string) => {
    const updated = specifications.map((spec, i) => (i === index ? { ...spec, [field]: text } : spec));
    onChange(updated);
  };

  const handleRemoveSpec = (index: number) => {
    onChange(specifications.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const handleApplyPreset = (preset: SpecPreset) => {
    const valueMap = new Map<string, string>();
    for (const spec of specifications) {
      if (spec.key.trim()) {
        valueMap.set(spec.key.toLowerCase().trim(), spec.value);
      }
    }

    const newSpecs: ProductSpecification[] = preset.keys.map((key) => ({
      key,
      value: valueMap.get(key.toLowerCase().trim()) || '',
    }));

    onChange(newSpecs);
  };

  const handleAddSingleKey = (key: string) => {
    const exists = specifications.some((s) => s.key.toLowerCase().trim() === key.toLowerCase().trim());
    if (!exists) {
      handleAddSpec(key, '');
    }
  };

  const activePreset = PRESETS.find((p) => {
    if (specifications.length === 0) return false;
    const currentKeys = specifications.map((s) => s.key.toLowerCase().trim());
    const presetKeys = p.keys.map((k) => k.toLowerCase().trim());
    return presetKeys.every((pk) => currentKeys.includes(pk));
  });

  return (
    <div className="bg-surface border border-separator rounded-2xl p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-brand-primary" />
            Product Specifications & Details
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Add structured attributes (e.g., Processor, RAM, Storage, Condition, Warranty) tailored for your products.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {specifications.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-surface-elevated hover:bg-destructive/10 text-muted hover:text-destructive border border-separator transition active:scale-95 cursor-pointer"
              title="Clear all attributes and reset"
            >
              <RotateCcw size={13} />
              Clear All
            </button>
          )}
          <button
            type="button"
            onClick={() => handleAddSpec()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 border border-separator text-foreground transition active:scale-95 cursor-pointer shrink-0"
          >
            <Plus size={14} />
            Add Attribute
          </button>
        </div>
      </div>

      <div className="mb-5 p-3.5 rounded-xl bg-surface-elevated/50 border border-separator/60 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            <Layers size={13} className="text-brand-primary" />
            Industry Templates (1-Click Switch)
          </div>
          {activePreset && (
            <span className="text-[11px] font-semibold text-brand-primary flex items-center gap-1">
              <Check size={12} /> {activePreset.name} Active
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => {
            const isSelected = activePreset?.id === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                    : 'bg-surface border-separator hover:border-brand-primary text-foreground hover:bg-surface-elevated'
                }`}
              >
                {isSelected && <Check size={13} className="text-white" />}
                <span>{preset.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {specifications.length === 0 ? (
        <div className="p-8 border-2 border-dashed border-separator/80 rounded-xl text-center bg-surface-elevated/30">
          <SlidersHorizontal size={28} className="mx-auto text-muted/40 mb-2" />
          <p className="text-sm font-medium text-foreground">No specifications added yet</p>
          <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
            Choose an industry template above or click &quot;Add Attribute&quot; to define custom specs like Processor,
            Storage, or Warranty.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-3 text-xs font-bold text-muted uppercase tracking-wider px-1">
            <span className="col-span-5">Attribute / Spec Name</span>
            <span className="col-span-6">Value</span>
            <span className="col-span-1 text-center">Action</span>
          </div>

          <div className="space-y-2">
            {specifications.map((spec, index) => {
              const valuePlaceholder = getValuePlaceholder(spec.key);
              return (
                <div key={index} className="grid grid-cols-12 gap-2 sm:gap-3 items-center group">
                  <div className="col-span-5">
                    <input
                      type="text"
                      value={spec.key}
                      onChange={(e) => handleUpdateSpec(index, 'key', e.target.value)}
                      placeholder="e.g. Processor, RAM, Storage"
                      className="w-full h-10 px-3 text-sm rounded-xl bg-surface-elevated border border-separator focus:ring-1 focus:ring-brand-primary focus:outline-none transition font-medium"
                    />
                  </div>
                  <div className="col-span-6">
                    <input
                      type="text"
                      value={spec.value}
                      onChange={(e) => handleUpdateSpec(index, 'value', e.target.value)}
                      placeholder={valuePlaceholder}
                      className="w-full h-10 px-3 text-sm rounded-xl bg-surface-elevated border border-separator focus:ring-1 focus:ring-brand-primary focus:outline-none transition"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveSpec(index)}
                      aria-label={`Remove specification ${spec.key || index + 1}`}
                      className="p-2 rounded-xl text-muted hover:text-danger hover:bg-danger/10 transition cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-separator/40 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-muted font-medium">Quick add:</span>
            {[
              'Brand',
              'Model',
              'Processor',
              'Storage',
              'RAM',
              'Graphics',
              'Battery',
              'Condition',
              'Warranty',
              'Color',
              'Material',
            ].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => handleAddSingleKey(key)}
                className="px-2 py-0.5 text-[11px] rounded-md bg-surface-elevated border border-separator/60 text-muted hover:text-foreground hover:border-brand-primary transition cursor-pointer"
              >
                +{key}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
