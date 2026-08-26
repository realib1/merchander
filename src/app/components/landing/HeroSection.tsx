'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { FadeInView } from '@/components/motion/FadeInView';
import { Reveal } from '@/components/motion/Reveal';
import { Store } from 'lucide-react';
import { TodaySalesWidget } from './ui-widgets/TodaySalesWidget';
import { LowStockWidget } from './ui-widgets/LowStockWidget';
import { CustomerCreditWidget } from './ui-widgets/CustomerCreditWidget';

export function HeroSection() {
  return (
    <section className="relative border-b border-separator px-4 py-16 sm:px-6 md:py-24 lg:px-8 lg:py-32 bg-background">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

          {/* Left Column: Clean, Uncluttered Editorial Messaging */}
          <div className="lg:col-span-6 flex flex-col items-start text-left">
            <Reveal direction="up" delay={0.05}>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-primary font-display leading-[1.1] max-w-2xl text-balance">
                Open Path. <br /> <span className="text-brand-primary">More Possibilities.</span> <br /> For the ambitious merchant.
              </h1>
            </Reveal>

            <FadeInView delay={0.12}>
              <p className="mt-6 max-w-lg text-base sm:text-lg text-secondary leading-relaxed">
                Where your social channels, online storefront, and physical shop connect. So sales, stock, customer
                credit, and profit are always in sync.
              </p>
            </FadeInView>

            {/* Action CTAs */}
            <FadeInView delay={0.18} className="mt-8 flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <a href="#waitlist" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full sm:w-auto h-11 px-6 text-sm font-semibold shadow-xs"
                >
                  Start with Merchander
                </Button>
              </a>
              <a href="#how-it-works" className="w-full sm:w-auto">
                <Button variant="outline" size="md" className="w-full sm:w-auto h-11 px-5 text-sm font-medium">
                  See how it works
                </Button>
              </a>
            </FadeInView>
          </div>

          {/* Right Column: Clean Live Product Viewport */}
          <div className="lg:col-span-6 w-full relative">
            
            {/* Floating Decorative Storefront Icon */}
            <div className="absolute -top-5 -right-2 sm:-top-6 sm:-right-6 z-20">
              <FadeInView delay={0.3}>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-xl ring-4 ring-background">
                  <Store className="h-6 w-6" />
                </div>
              </FadeInView>
            </div>

            <FadeInView delay={0.2}>
              <div className="rounded-2xl border border-separator bg-surface-elevated/20 shadow-sm overflow-hidden flex flex-col relative z-10">
                {/* Minimalist OS/Browser Header Bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-separator bg-surface-elevated/50">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-separator/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-separator/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-separator/80" />
                  </div>
                  <span className="ml-2 text-xs font-semibold text-secondary tracking-wide uppercase">Dashboard</span>
                </div>
                
                {/* Widget Area */}
                <div className="p-4 sm:p-6 space-y-4 bg-surface-elevated/10">
                  <TodaySalesWidget />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
