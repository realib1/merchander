'use client';

import React from 'react';
import { FadeInView } from '@/components/motion/FadeInView';
import { Reveal } from '@/components/motion/Reveal';
import { WaitlistForm } from '@/app/components/WaitlistForm';
import { CheckCircle2 } from 'lucide-react';

export function CtaSection() {
  return (
    <section id="waitlist" className="relative px-4 py-12 sm:px-6 md:py-16 lg:px-8 lg:py-20 bg-background">
      <div className="mx-auto max-w-7xl">
        <div className=" p-6 sm:p-10 lg:p-12">
          <div className="max-w-3xl mx-auto text-center">
            <Reveal direction="up">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-primary font-display leading-tight text-balance">
                Be among the first merchants to run their entire business from one connected system.
              </h2>
            </Reveal>

            <FadeInView delay={0.12}>
              <p className="mt-3 text-sm sm:text-base text-secondary leading-relaxed text-balance">
                Replace mental guesswork and scattered records with calm, daily clarity.
              </p>
            </FadeInView>

            <FadeInView delay={0.2} className="mt-6 flex flex-col items-center">
              <div className="w-full max-w-md">
                <WaitlistForm />
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs text-muted">
                <span className="inline-flex items-center gap-1.5 font-medium text-secondary">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Early merchant onboarding
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium text-secondary">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Free for 30 days
                </span>
              </div>
            </FadeInView>
          </div>
        </div>
      </div>
    </section>
  );
}
