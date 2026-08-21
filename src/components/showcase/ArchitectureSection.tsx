"use client";

import React from "react";
import { Layers, ShieldCheck, CreditCard } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { StaggerContainer } from "@/components/motion/StaggerContainer";
import { StaggerItem } from "@/components/motion/StaggerItem";

/**
 * Three-Layer Architecture overview section.
 */
export const ArchitectureSection: React.FC = () => {
  return (
    <section
      id="architecture"
      className="border-t border-[var(--color-border)] bg-[var(--color-surface)]/50 px-4 py-16 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Three-Layer Architecture
          </h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Decoupled foundation, optional feature modules, and pluggable vendor adapters.
          </p>
        </div>

        <StaggerContainer className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <StaggerItem>
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center gap-2 font-semibold">
                  <Layers className="h-5 w-5 text-[var(--color-brand-primary)]" />
                  <span>Layer 1: Foundation</span>
                </div>
              </CardHeader>
              <CardBody className="text-sm text-[var(--color-text-secondary)]">
                Always present. Zero backend assumptions. Includes OKLCH tokens, buttons, forms,
                tables, modals, motion wrappers, and utilities.
              </CardBody>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="h-5 w-5 text-[var(--color-brand-secondary)]" />
                  <span>Layer 2: Modules</span>
                </div>
              </CardHeader>
              <CardBody className="text-sm text-[var(--color-text-secondary)]">
                Optional feature systems: Auth, Payments, Notifications, Database, and Dashboard
                layout shells activated via <code className="text-xs">shero.config.ts</code>.
              </CardBody>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center gap-2 font-semibold">
                  <CreditCard className="h-5 w-5 text-[var(--color-info)]" />
                  <span>Layer 3: Integrations</span>
                </div>
              </CardHeader>
              <CardBody className="text-sm text-[var(--color-text-secondary)]">
                Adapter implementations for Hubtel, Paystack, Stripe, WhatsApp Cloud API, Resend,
                Drizzle ORM, Prisma, and Supabase.
              </CardBody>
            </Card>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </section>
  );
};
