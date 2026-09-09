'use client';

import React from 'react';
import { FadeInView } from '@/components/motion/FadeInView';
import { Reveal } from '@/components/motion/Reveal';
import { BusinessIntelligenceWidget } from './ui-widgets/BusinessIntelligenceWidget';
import { Eye, Target, Compass } from 'lucide-react';

const principles = [
  {
    icon: Eye,
    title: 'Know what happened.',
    description:
      'Accurate daily sales, reconciled Mobile Money payments, and true inventory counts across all locations.',
  },
  {
    icon: Target,
    title: 'Know what matters.',
    description:
      'Pinpoint which products generate actual landed profit, which customers owe you money, and which items are running out.',
  },
  {
    icon: Compass,
    title: 'Know what to do next.',
    description:
      'Automated reorder triggers, customer debt reminders, and supplier restock plans based on real sales velocity.',
  },
];

export function IntelligenceSection() {
  return (
    <section
      id="intelligence"
      className="relative border-b border-separator px-4 py-12 sm:px-6 md:py-16 lg:px-8 lg:py-20 bg-background"
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-start text-left max-w-2xl mb-8 sm:mb-10">
          <Reveal direction="up">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-primary font-display leading-tight">
              Merchander understands your business.
            </h2>
          </Reveal>

          <FadeInView delay={0.12}>
            <p className="mt-3 text-sm sm:text-base text-secondary leading-relaxed">
              Merchander brings together what you paid for stock, your shipping costs, customer debts, and sales speed,
              so you know where you stand every single day.
            </p>
          </FadeInView>
        </div>

        {/* Business Intelligence Snapshot Card */}
        <FadeInView delay={0.18}>
          <BusinessIntelligenceWidget />
        </FadeInView>

        {/* The 3 Guiding Pillars: Happened -> Matters -> Next */}
        <FadeInView delay={0.25} className="mt-10 sm:mt-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {principles.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-separator bg-surface-elevated/40 p-5 transition-all duration-150 hover:border-separator/80"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary mb-3">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-base font-bold font-display text-primary">{item.title}</h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-secondary leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        </FadeInView>
      </div>
    </section>
  );
}
