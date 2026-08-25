'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { FadeInView } from '@/components/motion/FadeInView';
import { Reveal } from '@/components/motion/Reveal';
import { TodaySalesWidget } from './ui-widgets/TodaySalesWidget';
import { LowStockWidget } from './ui-widgets/LowStockWidget';
import { CustomerCreditWidget } from './ui-widgets/CustomerCreditWidget';

export function HeroSection() {
  return (
    <section className="relative border-b border-separator px-4 py-12 sm:px-6 md:py-16 lg:px-8 lg:py-20 bg-background">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Clean, Uncluttered Editorial Messaging */}
          <div className="lg:col-span-6 flex flex-col items-start text-left">
            <Reveal direction="up" delay={0.05}>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-primary font-display leading-[1.12]">
                Open Path.
                <br />
                <span className="text-brand-primary">More Possibilities.</span>
                <br />
                For Every Business.
              </h1>
            </Reveal>

            <FadeInView delay={0.12}>
              <p className="mt-4 max-w-lg text-base sm:text-lg text-secondary leading-relaxed">
                Where your social channels, online storefront, and physical shop connect. So sales, stock, customer
                credit, and profit are always in sync.
              </p>
            </FadeInView>

            {/* Action CTAs */}
            <FadeInView delay={0.18} className="mt-6 flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <a href="#waitlist" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full sm:w-auto h-10 px-5 text-sm font-semibold shadow-2xs"
                >
                  Start with Merchander
                </Button>
              </a>
              <a href="#how-it-works" className="w-full sm:w-auto">
                <Button variant="outline" size="md" className="w-full sm:w-auto h-10 px-4 text-sm font-medium">
                  See how it works
                </Button>
              </a>
            </FadeInView>
          </div>

          {/* Right Column: Clean Live Product Viewport */}
          <div className="lg:col-span-6 w-full">
            <FadeInView delay={0.2}>
              <div className="rounded-2xl border border-separator bg-surface-elevated/40 p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-separator/80 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-secondary">Your Store</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <TodaySalesWidget />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <LowStockWidget />
                    <CustomerCreditWidget />
                  </div>
                </div>
              </div>
            </FadeInView>
          </div>
        </div>
      </div>
    </section>
  );
}
