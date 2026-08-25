'use client';

import React from 'react';
import { Share2, Package, Wallet, Users } from 'lucide-react';
import { FadeInView } from '@/components/motion/FadeInView';
import { Reveal } from '@/components/motion/Reveal';

interface FrictionPoint {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  detail: string;
}

const frictionPoints: FrictionPoint[] = [
  {
    icon: Share2,
    title: 'Sales in Different Places',
    detail: 'Orders and customer requests scattered across social DMs, phone calls, and the counter.',
  },
  {
    icon: Package,
    title: 'Stock on Shelves',
    detail: 'Fastest-moving products run out before anyone remembers to reorder from suppliers.',
  },
  {
    icon: Users,
    title: 'Customer Credit in Notebooks',
    detail: 'Outstanding customer balances remembered only on paper or in personal memory.',
  },
  {
    icon: Wallet,
    title: 'Money & Receipts Scattered',
    detail: 'Daily MoMo SMS alerts, bank transfers, and cash that never get reconciled with store costs.',
  },
];

export function ProblemSection() {
  return (
    <section
      id="problem"
      className="relative border-b border-separator bg-surface-elevated/30 px-4 py-12 sm:px-6 md:py-16 lg:px-8 lg:py-20"
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: The Reality & Problem */}
          <div className="lg:col-span-5 flex flex-col items-start text-left">
            <Reveal direction="up">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-primary font-display leading-tight">
                Your business is moving. But the picture is scattered.
              </h2>
            </Reveal>

            <FadeInView delay={0.12}>
              <p className="mt-4 text-sm sm:text-base text-secondary leading-relaxed">
                Sales happen in DMs, payments arrive on Mobile Money, and stock is counted by hand. When your
                information is scattered, seeing your true daily profit takes hours of mental guesswork.
              </p>
            </FadeInView>

            <FadeInView delay={0.2} className="mt-6 w-full">
              <div className="rounded-xl border border-separator bg-surface p-5 shadow-2xs">
                <p className="text-base sm:text-lg font-bold text-primary font-display leading-snug">
                  &ldquo;The problem isn&apos;t having data.
                  <br />
                  <span className="text-brand-primary">It&apos;s knowing what it means.&rdquo;</span>
                </p>
              </div>
            </FadeInView>
          </div>

          {/* Right Column: 4 Everyday Friction Cards */}
          <div className="lg:col-span-7 w-full">
            <FadeInView delay={0.18}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {frictionPoints.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-separator bg-surface p-4 sm:p-5 shadow-2xs transition-all duration-150 hover:border-separator/80"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary mb-3">
                        <Icon className="h-4 w-4" />
                      </div>
                      <h3 className="text-sm font-bold text-primary font-display">{item.title}</h3>
                      <p className="mt-1 text-xs text-secondary leading-relaxed">{item.detail}</p>
                    </div>
                  );
                })}
              </div>
            </FadeInView>
          </div>
        </div>
      </div>
    </section>
  );
}
