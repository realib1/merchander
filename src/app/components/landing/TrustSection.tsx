'use client';

import React from 'react';
import { FadeInView } from '@/components/motion/FadeInView';
import { Reveal } from '@/components/motion/Reveal';
import { Lock, History, UserCheck, HardDrive } from 'lucide-react';

const trustItems = [
  {
    icon: Lock,
    title: 'Private to You',
    description: 'Only you and the staff you approve can see your store numbers, costs, and customer information.',
  },
  {
    icon: History,
    title: 'Clear Activity History',
    description: 'Every sale, price change, and stock adjustment shows exactly who did it and what time it happened.',
  },
  {
    icon: UserCheck,
    title: 'Staff Permissions',
    description:
      'Give cashiers fast access to ring up sales while keeping your supplier costs and profit numbers private.',
  },
  {
    icon: HardDrive,
    title: 'Automatic Cloud Backups',
    description:
      'Your sales, customer debts, and stock counts are saved continuously so you never lose a single record.',
  },
];

export function TrustSection() {
  return (
    <section className="relative border-b border-separator bg-surface-elevated/30 px-4 py-12 sm:px-6 md:py-16 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-start text-left max-w-2xl mb-8 sm:mb-10">
          <Reveal direction="up">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-primary font-display leading-tight">
              Protecting your business and its information.
            </h2>
          </Reveal>

          <FadeInView delay={0.12}>
            <p className="mt-3 text-sm sm:text-base text-secondary leading-relaxed">
              Your business records represent your livelihood. We make sure your numbers are completely private,
              protected from staff mistakes, and never lost.
            </p>
          </FadeInView>
        </div>

        {/* 4 Trust Cards Grid */}
        <FadeInView delay={0.2}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {trustItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-separator bg-surface p-5 sm:p-6 shadow-2xs transition-all duration-150 hover:border-separator/80"
                >
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="text-base font-bold font-display text-primary">{item.title}</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-secondary leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        </FadeInView>
      </div>
    </section>
  );
}
