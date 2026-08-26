'use client';

import React from 'react';
import { FadeInView } from '@/components/motion/FadeInView';
import { Reveal } from '@/components/motion/Reveal';
import { Smartphone, MessageSquare, HandCoins } from 'lucide-react';

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
];

export function AfricanRootsSection() {
  return (
    <section className="relative border-b border-separator px-4 py-16 sm:px-6 md:py-24 lg:px-8 bg-background">
      <div className="mx-auto max-w-6xl">
        
        {/* Authentic, Grounded Quote */}
        <div className="max-w-4xl mb-16 md:mb-20">
          <Reveal direction="up">
            <div className="border-l-[3px] border-brand-primary pl-6 md:pl-8">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-primary leading-snug">
                &quot;Born from the realities of African commerce. Built for ambitious businesses everywhere.&quot;
              </h2>
              <FadeInView delay={0.1}>
                <p className="mt-4 text-base md:text-lg text-secondary font-medium">
                  Merchander was built from the ground up for how trade actually moves.
                </p>
              </FadeInView>
            </div>
          </Reveal>
        </div>

        {/* Clean, Communicable Feature Cards */}
        <FadeInView delay={0.2}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="bg-surface border border-separator rounded-2xl p-6 md:p-8 flex flex-col items-start transition-shadow hover:shadow-sm"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary mb-6">
                    <Icon className="h-6 w-6" strokeWidth={2} />
                  </div>
                  <h3 className="text-lg font-bold text-primary mb-2">{item.title}</h3>
                  <p className="text-sm md:text-base text-secondary leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </FadeInView>
      </div>
    </section>
  );
}
