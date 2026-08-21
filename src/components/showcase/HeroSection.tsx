"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { FadeInView } from "@/components/motion/FadeInView";
import { Reveal } from "@/components/motion/Reveal";
import { useToast } from "@/components/ui/Toast";

export interface HeroSectionProps {
  onOpenConfirm: () => void;
}

/**
 * Hero section for the SHERO Core starter showcase.
 */
export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenConfirm }) => {
  const { addToast } = useToast();

  return (
    <section
      id="overview"
      className="relative overflow-hidden border-b border-[var(--color-border)] px-4 py-20 text-center sm:px-6 lg:px-8"
    >
      <div className="mx-auto flex max-w-4xl flex-col items-center">
        <FadeInView>
          <Badge variant="info" className="mb-4 gap-1.5 px-3 py-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span>SHERO Core v1.0.0 Ready</span>
          </Badge>
        </FadeInView>

        <Reveal direction="up" delay={0.1}>
          <h1 className="text-4xl font-extrabold tracking-tight text-[var(--color-text-primary)] sm:text-6xl lg:text-7xl">
            Universal Scaffolding for{" "}
            <span className="text-[var(--color-brand-primary)]">Modern Web Apps</span>
          </h1>
        </Reveal>

        <FadeInView delay={0.2}>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--color-text-secondary)]">
            Minimal by default. Powerful when needed. OKLCH dual-primary design system, accessible
            UI primitives, motion wrappers, and swappable module adapters.
          </p>
        </FadeInView>

        <FadeInView delay={0.3}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={() =>
                addToast({
                  title: "Welcome to SHERO Core!",
                  message: "Everything is loaded and running.",
                  type: "success",
                })
              }
            >
              Trigger Toast
            </Button>
            <Button variant="outline" size="lg" onClick={onOpenConfirm}>
              Confirm Dialog
            </Button>
          </div>
        </FadeInView>
      </div>
    </section>
  );
};
