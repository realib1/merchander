'use client';

import React from 'react';
import { FadeInView } from '@/components/motion/FadeInView';
import { Reveal } from '@/components/motion/Reveal';
import { TransactionPipelineWidget } from './ui-widgets/TransactionPipelineWidget';

export function ConnectionFlowSection() {
  return (
    <section
      id="how-it-works"
      className="relative border-b border-separator px-4 py-12 sm:px-6 md:py-16 lg:px-8 lg:py-20 bg-background"
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-start text-left max-w-2xl mb-8 sm:mb-10">
          <Reveal direction="up">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-primary font-display leading-tight">
              Merchander brings the picture together.
            </h2>
          </Reveal>

          <FadeInView delay={0.12}>
            <p className="mt-3 text-sm sm:text-base text-secondary leading-relaxed">
              When a transaction happens, every inventory count, customer ledger, daily revenue, and landed profit
              margin updates in one connected flow.
            </p>
          </FadeInView>
        </div>

        {/* Interactive Transaction Flow */}
        <FadeInView delay={0.2}>
          <TransactionPipelineWidget />
        </FadeInView>
      </div>
    </section>
  );
}
