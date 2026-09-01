'use client';

import React, { useState } from 'react';
import { FadeInView } from '@/components/motion/FadeInView';
import { Reveal } from '@/components/motion/Reveal';
import { ShoppingBag, Heart, Store, Smartphone, Layers, Boxes, Check } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Sector {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  tagline: string;
  highlights: string[];
  sampleMetric: {
    label: string;
    value: string;
  };
}

const sectors: Sector[] = [
  {
    id: 'boutique',
    name: 'Boutiques & Apparel',
    icon: ShoppingBag,
    tagline: 'Size & color variants, social pre-orders, and in-person fitting sales.',
    highlights: [
      'Shareable storefront link for Instagram bio',
      'Variant-level stock counts (S/M/L/XL)',
      'WhatsApp reservations & MoMo checkout',
    ],
    sampleMetric: { label: 'Top Category Turnover', value: '4.2 days' },
  },
  {
    id: 'beauty',
    name: 'Beauty & Cosmetics',
    icon: Heart,
    tagline: 'Product shade variants, bundle promotions, and repeat buyer profiles.',
    highlights: [
      'Shade, scent, and bundle inventory',
      'Repeat customer purchase frequency',
      'Instant catalog link for TikTok & Instagram',
    ],
    sampleMetric: { label: 'Repeat Customer Rate', value: '41.8%' },
  },
  {
    id: 'general',
    name: 'General Merchandise',
    icon: Layers,
    tagline: 'Multi-category stock, mixed supplier shipments, and fast daily turnover.',
    highlights: [
      'Multi-category inventory & category tags',
      'Landed shipping cost allocation per batch',
      'Fast counter search & digital price checks',
    ],
    sampleMetric: { label: 'Tracked Product Lines', value: '450+ SKUs' },
  },
  {
    id: 'provisions',
    name: 'Provision Shops',
    icon: Store,
    tagline: 'High item volume, rapid shelf turnover, and regular supplier restocks.',
    highlights: [
      'Instant online product catalog',
      'Fast-moving item reorder alerts',
      'Cash & MoMo cashier reconciliations',
    ],
    sampleMetric: { label: 'Daily Checkout Volume', value: '180+ orders' },
  },
  {
    id: 'electronics',
    name: 'Electronics & Phones',
    icon: Smartphone,
    tagline: 'High-value inventory, serial numbers, and warranty tracking.',
    highlights: [
      'Storefront with WhatsApp inquiry links',
      'Serial/IMEI number recording',
      'Supplier payment schedules & warranty logs',
    ],
    sampleMetric: { label: 'Tracked Assets', value: '100% verified' },
  },
  {
    id: 'wholesale',
    name: 'Wholesale & Distribution',
    icon: Boxes,
    tagline: 'Carton quantities, tier pricing, and multi-branch distribution.',
    highlights: ['Multi-branch online catalog link', 'Volume-based pricing tiers', 'Inter-branch stock transfers'],
    sampleMetric: { label: 'Multi-Branch Sync', value: 'Real-time' },
  },
];

export function BusinessTypesSection() {
  const [selectedId, setSelectedId] = useState<string>('boutique');
  const activeSector = sectors.find((s) => s.id === selectedId) || sectors[0];

  return (
    <section
      id="businesses"
      className="relative border-b border-separator bg-surface-elevated/30 px-4 py-12 sm:px-6 md:py-16 lg:px-8 lg:py-20"
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-start text-left max-w-2xl mb-8 sm:mb-10">
          <Reveal direction="up">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-primary font-display leading-tight">
              Built around the way businesses actually work.
            </h2>
          </Reveal>

          <FadeInView delay={0.12}>
            <p className="mt-3 text-sm sm:text-base text-secondary leading-relaxed">
              Whether you sell apparel with size variants, mixed general merchandise, or high-value electronics,
              Merchander adapts to the way your inventory actually moves.
            </p>
          </FadeInView>
        </div>

        {/* Sector Selector Tabs */}
        <FadeInView delay={0.18}>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-6 sm:mb-8">
            {sectors.map((s) => {
              const Icon = s.icon;
              const isSelected = selectedId === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedId(s.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150 cursor-pointer',
                    isSelected
                      ? 'bg-brand-primary text-white border border-brand-primary shadow-2xs font-semibold'
                      : 'bg-surface border border-separator text-secondary hover:border-separator/80 hover:text-primary'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{s.name}</span>
                </button>
              );
            })}
          </div>

          {/* Active Sector Card */}
          <div className="rounded-2xl border border-separator bg-surface p-5 sm:p-7 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center">
              <div className="md:col-span-8">
                <h3 className="text-xl sm:text-2xl font-bold font-display text-primary">{activeSector.name}</h3>
                <p className="mt-2 text-xs sm:text-sm text-secondary leading-relaxed">{activeSector.tagline}</p>

                <div className="mt-5 space-y-2">
                  {activeSector.highlights.map((h) => (
                    <div key={h} className="flex items-center gap-2 text-xs sm:text-sm text-primary font-medium">
                      <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <Check className="h-2.5 w-2.5" />
                      </div>
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="md:col-span-4 rounded-xl border border-separator bg-surface-elevated p-4 text-center">
                <div className="text-[11px] font-semibold uppercase text-muted">{activeSector.sampleMetric.label}</div>
                <div className="mt-1 text-2xl sm:text-3xl font-extrabold font-display text-primary tabular-nums">
                  {activeSector.sampleMetric.value}
                </div>
                <p className="mt-1 text-[11px] text-muted">Configured instantly on store setup</p>
              </div>
            </div>
          </div>
        </FadeInView>
      </div>
    </section>
  );
}
