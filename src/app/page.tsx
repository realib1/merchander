"use client";

import React from "react";
import { Ship, Wallet, MessageSquare, LineChart, Package, CheckCircle, Store, Box, Briefcase, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { FadeInView } from "@/components/motion/FadeInView";
import { Reveal } from "@/components/motion/Reveal";
import { StaggerContainer } from "@/components/motion/StaggerContainer";
import { StaggerItem } from "@/components/motion/StaggerItem";

export default function LandingPage() {
  const router = useRouter();

  const navItems = [
    { label: "How it works", href: "#demo" },
    { label: "Features", href: "#features" },
  ];

  const headerActions = (
    <Button variant="primary" size="sm" onClick={() => router.push("#")}>
      Join Waitlist
    </Button>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header navItems={navItems} actions={headerActions} sticky />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-[var(--color-border)] px-4 py-24 text-center sm:px-6 lg:px-8 xl:py-32">
          {/* Subtle Glow Background */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-brand-secondary)]/10 blur-[120px]" />
          
          <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center">

            <Reveal direction="up" delay={0.1}>
              <h1 className="text-4xl font-extrabold tracking-tight text-[var(--color-text-primary)] sm:text-6xl md:text-7xl font-display leading-[1.1] text-balance px-4 sm:px-0">
                Open Path for <br />
                <span className="text-5xl sm:text-6xl md:text-7xl bg-gradient-to-r from-[var(--color-brand-primary-400)] to-[var(--color-brand-primary-700)] bg-clip-text text-transparent pb-1 mt-2 inline-block sm:mt-0 sm:pb-2">
                  Social First Merchants.
                </span>
              </h1>
            </Reveal>

            <FadeInView delay={0.2}>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-[var(--color-text-secondary)] md:text-lg">
                From the first customer message to the final delivery, Merchander is the operating system that keeps your growing social-first business perfectly organized.
              </p>
            </FadeInView>

            <FadeInView delay={0.3} className="w-full">
              <form className="mt-10 flex w-full max-w-lg flex-col gap-3 mx-auto sm:w-auto sm:flex-row" onSubmit={(e) => e.preventDefault()}>
                <input 
                  type="email" 
                  placeholder="Enter your email address..." 
                  required
                  className="flex h-11 w-full rounded-[var(--radius-md,6px)] border border-slate-300 dark:border-slate-700 bg-[var(--color-surface)] px-4 py-2 text-base sm:text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:border-brand-primary"
                />
                <Button type="submit" variant="primary" size="md" className="h-11 w-full sm:w-auto shadow-[0_0_40px_rgba(245,158,11,0.2)] whitespace-nowrap">
                  Join Waitlist
                </Button>
              </form>
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[var(--color-text-secondary)]">
                <CheckCircle className="h-4 w-4 text-brand-primary" />
                <span>Get early access before public launch</span>
              </div>
            </FadeInView>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="demo" className="relative px-4 py-24 sm:px-6 lg:px-8 border-b border-[var(--color-border)] overflow-hidden bg-[var(--color-background)]">
          {/* Dotted Grid Background pattern */}
          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, var(--color-border) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          
          <div className="relative z-10 mx-auto max-w-5xl">
            <FadeInView>
              <div className="text-center mb-24 flex flex-col items-center">
              
                <h2 className="text-3xl font-bold tracking-tight font-display sm:text-4xl text-[var(--color-text-primary)]">
                  The complete business lifecycle.
                </h2>
                <p className="mt-4 text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
                  From the supplier&apos;s warehouse to your customer&apos;s doorstep, see how everything connects.
                </p>
              </div>
            </FadeInView>

            <div className="relative">
              {/* Central Vertical Line */}
              <div className="absolute left-6 top-0 bottom-0 w-px bg-brand-primary/30 md:left-1/2 md:-ml-px"></div>

              <div className="space-y-12 md:space-y-0">
                {/* Step 1: Procure */}
                <div className="relative flex flex-col md:flex-row items-center md:justify-between group">
                  <div className="md:w-1/2 md:pr-12 lg:pr-16 flex justify-end w-full pl-16 md:pl-0 mb-8 md:mb-0">
                    <FadeInView className="w-full">
                      <div className="relative rounded-xl border border-brand-primary/20 bg-[var(--color-surface)] shadow-md p-8 overflow-hidden transition-all hover:shadow-lg">
                        <span className="absolute bottom-0 right-4 text-[100px] font-bold leading-[0.8] text-brand-primary/5 select-none font-display">01</span>
                        <div className="relative z-10">
                          <h3 className="text-xl font-bold font-display text-[var(--color-brand-primary)] mb-3">Procure</h3>
                          <p className="text-[var(--color-text-secondary)]">Record purchases, track supplier balances, and manage incoming shipments efficiently.</p>
                        </div>
                      </div>
                    </FadeInView>
                  </div>
                  {/* Circle Node */}
                  <div className="absolute left-6 md:left-1/2 -translate-x-1/2 flex h-10 w-10 items-center justify-center rounded-full border-4 border-[var(--color-background)] bg-[var(--color-brand-primary)] shadow-sm z-20 transition-transform group-hover:scale-110">
                    <Package className="h-4 w-4 text-white" />
                  </div>
                  <div className="hidden md:block md:w-1/2" />
                </div>

                {/* Step 2: Sell */}
                <div className="relative flex flex-col md:flex-row items-center md:justify-between group md:mt-[-40px]">
                  <div className="hidden md:block md:w-1/2" />
                  {/* Circle Node */}
                  <div className="absolute left-6 md:left-1/2 -translate-x-1/2 flex h-10 w-10 items-center justify-center rounded-full border-4 border-[var(--color-background)] bg-[var(--color-surface-elevated)] dark:bg-slate-800 shadow-sm z-20 transition-colors group-hover:bg-[var(--color-brand-primary)] text-slate-500 group-hover:text-white">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div className="md:w-1/2 md:pl-12 lg:pl-16 flex justify-start w-full pl-16 md:pl-0 mt-8 md:mt-0">
                    <FadeInView className="w-full">
                      <div className="relative rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-md p-8 overflow-hidden transition-all hover:shadow-lg">
                        <span className="absolute bottom-0 right-4 text-[100px] font-bold leading-[0.8] text-text-primary/5 select-none font-display">02</span>
                        <div className="relative z-10">
                          <h3 className="text-xl font-bold font-display text-[var(--color-text-primary)] mb-3">Sell</h3>
                          <p className="text-[var(--color-text-secondary)]">Let AI turn social conversations into pre-orders and confirmed sales effortlessly.</p>
                        </div>
                      </div>
                    </FadeInView>
                  </div>
                </div>

                {/* Step 3: Fulfill */}
                <div className="relative flex flex-col md:flex-row items-center md:justify-between group md:mt-[-40px]">
                  <div className="md:w-1/2 md:pr-12 lg:pr-16 flex justify-end w-full pl-16 md:pl-0 mb-8 md:mb-0">
                    <FadeInView className="w-full">
                      <div className="relative rounded-xl border border-brand-primary/20 bg-[var(--color-surface)] shadow-md p-8 overflow-hidden transition-all hover:shadow-lg">
                        <span className="absolute bottom-0 right-4 text-[100px] font-bold leading-[0.8] text-brand-primary/5 select-none font-display">03</span>
                        <div className="relative z-10">
                          <h3 className="text-xl font-bold font-display text-[var(--color-brand-primary)] mb-3">Fulfill</h3>
                          <p className="text-[var(--color-text-secondary)]">Track customer payments, manage live inventory, and dispatch deliveries on time.</p>
                        </div>
                      </div>
                    </FadeInView>
                  </div>
                  {/* Circle Node */}
                  <div className="absolute left-6 md:left-1/2 -translate-x-1/2 flex h-10 w-10 items-center justify-center rounded-full border-4 border-[var(--color-background)] bg-[var(--color-brand-primary)] shadow-sm z-20 transition-transform group-hover:scale-110 text-white">
                    <Truck className="h-4 w-4" />
                  </div>
                  <div className="hidden md:block md:w-1/2" />
                </div>

                {/* Step 4: Profit */}
                <div className="relative flex flex-col md:flex-row items-center md:justify-between group md:mt-[-40px]">
                  <div className="hidden md:block md:w-1/2" />
                  {/* Circle Node */}
                  <div className="absolute left-6 md:left-1/2 -translate-x-1/2 flex h-10 w-10 items-center justify-center rounded-full border-4 border-[var(--color-background)] bg-[var(--color-surface-elevated)] dark:bg-slate-800 shadow-sm z-20 transition-colors group-hover:bg-[var(--color-brand-primary)] text-slate-500 group-hover:text-white">
                    <LineChart className="h-4 w-4" />
                  </div>
                  <div className="md:w-1/2 md:pl-12 lg:pl-16 flex justify-start w-full pl-16 md:pl-0 mt-8 md:mt-0">
                    <FadeInView className="w-full">
                      <div className="relative rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-md p-8 overflow-hidden transition-all hover:shadow-lg">
                        <span className="absolute bottom-0 right-4 text-[100px] font-bold leading-[0.8] text-text-primary/5 select-none font-display">04</span>
                        <div className="relative z-10">
                          <h3 className="text-xl font-bold font-display text-[var(--color-text-primary)] mb-3">Profit</h3>
                          <p className="text-[var(--color-text-secondary)]">See true landed-cost margins and business intelligence in real-time.</p>
                        </div>
                      </div>
                    </FadeInView>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-[var(--color-surface-elevated)] px-4 py-24 sm:px-6 lg:px-8 border-b border-[var(--color-border)]">
          <div className="mx-auto max-w-7xl">
            <FadeInView>
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold tracking-tight font-display sm:text-4xl text-[var(--color-text-primary)]">
                  Beyond a basic bot.
                </h2>
                <p className="mt-4 text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
                  Most tools just send automatic replies. Merchander connects your entire supply chain to your customer conversations.
                </p>
              </div>
            </FadeInView>

            <StaggerContainer className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1: Conversational Commerce */}
              <StaggerItem>
                <div className="group h-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 transition-colors hover:border-[var(--color-brand-secondary)]/50">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-brand-secondary)]/10 text-[var(--color-brand-secondary)] transition-transform group-hover:scale-110">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold font-display text-[var(--color-text-primary)]">Conversational Commerce</h3>
                  <p className="leading-relaxed text-[var(--color-text-secondary)]">
                    Convert customer conversations into structured commerce. The AI handles pricing, availability, and simple orders, escalating complex negotiations directly to you.
                  </p>
                </div>
              </StaggerItem>

              {/* Feature 2: Supplier & Procurement */}
              <StaggerItem>
                <div className="group h-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 transition-colors hover:border-[var(--color-brand-primary)]/50">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] transition-transform group-hover:scale-110">
                    <Briefcase className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold font-display text-[var(--color-text-primary)]">Supplier Management</h3>
                  <p className="leading-relaxed text-[var(--color-text-secondary)]">
                    Record supplier purchases, track invoices, and monitor exactly how much you&apos;ve paid versus your outstanding balances.
                  </p>
                </div>
              </StaggerItem>

              {/* Feature 3: Shipment & Import */}
              <StaggerItem>
                <div className="group h-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 transition-colors hover:border-blue-500/50">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 transition-transform group-hover:scale-110">
                    <Ship className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold font-display text-[var(--color-text-primary)]">Shipments & Pre-orders</h3>
                  <p className="leading-relaxed text-[var(--color-text-secondary)]">
                    Sell products before they arrive. Track sea-freight shipments, manage import costs, and automatically fulfill customer reservations when goods land.
                  </p>
                </div>
              </StaggerItem>

              {/* Feature 4: Inventory Management */}
              <StaggerItem>
                <div className="group h-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 transition-colors hover:border-emerald-500/50">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 transition-transform group-hover:scale-110">
                    <Box className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold font-display text-[var(--color-text-primary)]">Connected Inventory</h3>
                  <p className="leading-relaxed text-[var(--color-text-secondary)]">
                    Inventory isn&apos;t just a number. Merchander understands when stock is purchased, in-transit, received, available, reserved, or sold.
                  </p>
                </div>
              </StaggerItem>

              {/* Feature 5: Orders & Payments */}
              <StaggerItem>
                <div className="group h-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 transition-colors hover:border-[var(--color-brand-primary)]/50">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] transition-transform group-hover:scale-110">
                    <Wallet className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold font-display text-[var(--color-text-primary)]">Orders & Payments</h3>
                  <p className="leading-relaxed text-[var(--color-text-secondary)]">
                    Connect every order to a payment status and fulfillment stage. Always know who has paid, who owes you, and what needs to be delivered.
                  </p>
                </div>
              </StaggerItem>

              {/* Feature 6: Business Intelligence */}
              <StaggerItem>
                <div className="group h-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 transition-colors hover:border-purple-500/50">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500 transition-transform group-hover:scale-110">
                    <LineChart className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold font-display text-[var(--color-text-primary)]">Business Intelligence</h3>
                  <p className="leading-relaxed text-[var(--color-text-secondary)]">
                    Turn operational data into decisions. See your true landed-cost profitability, sales performance, and demand trends instantly.
                  </p>
                </div>
              </StaggerItem>

              {/* Feature 7: Commerce Core (spans full width on tablet/desktop if odd number) */}
              <StaggerItem className="md:col-span-2 lg:col-span-3">
                <div className="group flex flex-col md:flex-row items-center gap-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 sm:p-12 transition-colors hover:border-[var(--color-brand-secondary)]/50">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-secondary)]/10 text-[var(--color-brand-secondary)] transition-transform group-hover:scale-110">
                    <Store className="h-10 w-10" />
                  </div>
                  <div>
                    <h3 className="mb-3 text-2xl font-bold font-display text-[var(--color-text-primary)]">The Commerce Core</h3>
                    <p className="leading-relaxed text-[var(--color-text-secondary)] text-lg">
                      Beneath the conversational interface is a robust e-commerce engine managing your entire catalog, product variants, dynamic pricing, and staff permissions. It&apos;s the central nervous system for your growing business.
                    </p>
                  </div>
                </div>
              </StaggerItem>

            </StaggerContainer>
          </div>
        </section>
      </main>

      <Footer brandName="Merchander" tagline="Open Path for Social First Merchants." />
    </div>
  );
}
