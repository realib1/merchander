'use client';

import React from 'react';
import { FadeInView } from '@/components/motion/FadeInView';
import { Reveal } from '@/components/motion/Reveal';
import { Smartphone, MessageSquare, HandCoins, Ship } from 'lucide-react';

const highlights = [
  {
    icon: Smartphone,
    title: 'Mobile Money Built-In',
    description: 'Reconcile MTN MoMo, Telecel Cash, AT Money, and cash into one clear daily balance.',
  },
  {
    icon: MessageSquare,
    title: 'Social & Chat Orders',
    description: 'Turn DMs, WhatsApp messages, and phone orders into real sales without manual re-typing.',
  },
  {
    icon: HandCoins,
    title: 'Customer Credit & Trust',
    description: 'Keep track of friendly customer credit without risking your daily cash flow.',
  },
  {
    icon: Ship,
    title: 'Shipping & Cargo Tracking',
    description: 'Track sea freight and air cargo from your suppliers straight to your store shelves.',
  },
];

export function AfricanRootsSection() {
  return (
    <section className="relative border-b border-separator px-4 py-12 sm:px-6 md:py-16 lg:px-8 lg:py-20 bg-background">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-start text-left max-w-3xl mb-8 sm:mb-10">
          <Reveal direction="up">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-primary font-display leading-tight">
              &ldquo;Born from the realities of African commerce. Built for ambitious businesses everywhere.&rdquo;
            </h2>
          </Reveal>

          <FadeInView delay={0.12}>
            <p className="mt-3 text-sm sm:text-base text-secondary leading-relaxed">
              We did not copy foreign software and hope it fits. Merchander was built from the ground up for how trade
              actually moves.
            </p>
          </FadeInView>
        </div>

        {/* 4 Pillars of Local Commerce */}
        <FadeInView delay={0.2}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-separator bg-surface p-5 shadow-2xs transition-all duration-150 hover:border-separator/80"
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
