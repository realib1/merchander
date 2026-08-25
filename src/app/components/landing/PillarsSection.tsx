'use client';

import React from 'react';
import { FadeInView } from '@/components/motion/FadeInView';
import { Reveal } from '@/components/motion/Reveal';
import {
  SellMiniWidget,
  StockMiniWidget,
  CustomerMiniWidget,
  SupplierMiniWidget,
  MoneyMiniWidget,
  BusinessMiniWidget,
} from './ui-widgets/PillarWidgets';

interface PillarCard {
  id: string;
  verb: string;
  tagline: string;
  description: string;
  widget: React.ReactNode;
}

const pillars: PillarCard[] = [
  {
    id: 'sell',
    verb: 'Sell',
    tagline: "Know what you're selling.",
    description: 'See every order from social DMs, your online store, and the counter in one clean stream.',
    widget: <SellMiniWidget />,
  },
  {
    id: 'stock',
    verb: 'Stock',
    tagline: 'Know what you have before you run out.',
    description: 'Live inventory counts and reorder warnings before your fastest-moving items run dry.',
    widget: <StockMiniWidget />,
  },
  {
    id: 'customers',
    verb: 'Customers',
    tagline: 'Know who buys from you and who still owes you.',
    description: 'Customer purchase histories and credit balances that protect your daily cash flow.',
    widget: <CustomerMiniWidget />,
  },
  {
    id: 'suppliers',
    verb: 'Suppliers',
    tagline: 'Know what you bought, what you owe and what you need next.',
    description: 'Supplier invoices, balance owed, and incoming shipment timelines in one place.',
    widget: <SupplierMiniWidget />,
  },
  {
    id: 'money',
    verb: 'Money',
    tagline: 'Know where your money is going.',
    description: 'Reconcile Mobile Money wallets, cash drawers, and store expenses by closing time.',
    widget: <MoneyMiniWidget />,
  },
  {
    id: 'business',
    verb: 'Business',
    tagline: "Know what's really happening.",
    description: 'See your true landed-cost profit margins, top items, and real business performance.',
    widget: <BusinessMiniWidget />,
  },
];

export function PillarsSection() {
  return (
    <section
      id="areas"
      className="relative border-b border-separator bg-surface-elevated/30 px-4 py-12 sm:px-6 md:py-16 lg:px-8 lg:py-20"
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-start text-left max-w-2xl mb-8 sm:mb-10">
          <Reveal direction="up">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-primary font-display leading-tight">
              Six simple areas. One connected business.
            </h2>
          </Reveal>

          <FadeInView delay={0.12}>
            <p className="mt-3 text-sm sm:text-base text-secondary leading-relaxed">
              No bloated menus or confusing accounting jargon. Every area operates on the same live numbers.
            </p>
          </FadeInView>
        </div>

        {/* 6 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {pillars.map((pillar, idx) => (
            <FadeInView key={pillar.id} delay={0.04 * idx} className="flex flex-col">
              <div className="group flex h-full flex-col justify-between rounded-2xl border border-separator bg-surface p-5 shadow-2xs transition-all duration-150 hover:border-separator/80">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold font-display text-primary">{pillar.verb}</h3>
                    <span className="text-xs font-mono font-bold text-muted">0{idx + 1}</span>
                  </div>
                  <p className="mt-1 text-xs sm:text-sm font-semibold text-brand-primary leading-snug">
                    {pillar.tagline}
                  </p>
                  <p className="mt-2 text-xs sm:text-sm text-secondary leading-relaxed">{pillar.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-separator/60">{pillar.widget}</div>
              </div>
            </FadeInView>
          ))}
        </div>
      </div>
    </section>
  );
}
