'use client';

import React from 'react';
import { FadeInView } from '@/components/motion/FadeInView';
import { Package, Truck, Receipt, User, Coins } from 'lucide-react';
import { motion } from 'motion/react';

export function MerchantJourneySection() {
  const steps = [
    {
      icon: User,
      title: 'Pre-order',
      desc: 'Customer commits to GH₵600 item. Pays deposit.',
    },
    {
      icon: Package,
      title: 'Supplier',
      desc: 'You source the goods and pay supplier.',
    },
    {
      icon: Truck,
      title: 'Shipment',
      desc: 'Goods arrive. Shipping calculated (GH₵85).',
    },
    {
      icon: Receipt,
      title: 'Final Payment',
      desc: 'Customer owes GH₵85 for shipping. Pays balance.',
    },
    {
      icon: Coins,
      title: 'True Margin',
      desc: 'Product GH₵600 + Shipping GH₵85 - Landed Cost = Profit.',
    },
  ];

  return (
    <section className="relative px-4 py-20 sm:px-6 md:py-28 lg:px-8 border-b border-separator bg-surface overflow-hidden">
      <div className="mx-auto max-w-6xl">
        <FadeInView>
          <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-primary font-display leading-tight mb-4">
              A real merchant journey.
            </h2>
            <p className="text-sm text-secondary leading-relaxed text-balance">
              We know you don&apos;t just &quot;sell items.&quot; You take pre-orders, manage suppliers, wait for
              shipments, calculate landed costs, and collect balance payments. Merchander understands this reality.
            </p>
          </div>
        </FadeInView>

        {/* --- DESKTOP HORIZONTAL JOURNEY --- */}
        <div className="relative hidden lg:block mx-auto max-w-6xl mt-12">
          {/* Elegant Horizontal Track */}
          <div className="absolute top-6 left-[10%] right-[10%] h-0.5 bg-separator/60 z-0 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: '100%' }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
              className="absolute top-0 left-0 h-full bg-brand-primary/60"
            />
          </div>

          <div className="grid grid-cols-5 gap-6 relative z-10">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <FadeInView key={index} delay={index * 0.1}>
                  <div className="relative flex flex-col items-center text-center">
                    {/* Node on track */}
                    <div className="relative mb-5 transition-transform hover:scale-105 duration-200">
                      <div className="w-12 h-12 rounded-full bg-surface-elevated border border-brand-primary/50 flex items-center justify-center shadow-sm">
                        <Icon size={20} className="text-brand-primary" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-brand-primary rounded-full text-xs font-bold flex items-center justify-center shadow-sm ring-2 ring-surface z-20 leading-none">
                        {index + 1}
                      </div>
                    </div>

                    <div className="px-1">
                      <h3 className="text-base font-bold text-primary font-display mb-1.5">{step.title}</h3>
                      <p className="text-xs sm:text-sm text-secondary leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                </FadeInView>
              );
            })}
          </div>
        </div>

        {/* --- MOBILE/TABLET VERTICAL JOURNEY --- */}
        <div className="relative lg:hidden mx-auto max-w-2xl mt-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="space-y-10 relative z-10 pb-12"
          >
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="relative">
                  {/* Segmented Vertical Track */}
                  {index !== steps.length - 1 && (
                    <div className="absolute left-6 md:left-7 top-6 -bottom-16 w-0.5 bg-separator/60 overflow-hidden">
                      <motion.div
                        variants={{
                          hidden: { height: 0 },
                          visible: {
                            height: '100%',
                            transition: { duration: 0.3, delay: index * 0.3, ease: 'linear' },
                          },
                        }}
                        className="absolute top-0 left-0 w-full bg-brand-primary/60"
                      />
                    </div>
                  )}

                  <FadeInView delay={index * 0.1} className="relative pl-16 md:pl-20">
                    {/* Node on track */}
                    <div className="absolute left-0 md:left-1 top-0 w-12 h-12">
                      <div className="w-12 h-12 bg-surface-elevated rounded-full border border-brand-primary/50 flex items-center justify-center shadow-sm">
                        <Icon size={20} className="text-brand-primary" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-brand-primary rounded-full text-xs font-bold flex items-center justify-center shadow-sm ring-2 ring-surface z-20 leading-none">
                        {index + 1}
                      </div>
                    </div>

                    <div className="pt-1">
                      <h3 className="text-base font-bold text-primary font-display mb-1">{step.title}</h3>
                      <p className="text-sm text-secondary leading-relaxed">{step.desc}</p>
                    </div>
                  </FadeInView>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
