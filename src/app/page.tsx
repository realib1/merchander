import React from 'react';
import {
  Ship,
  Wallet,
  MessageSquare,
  LineChart,
  Package,
  CheckCircle,
  Store,
  Box,
  Briefcase,
  Truck,
  ArrowBigRight,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { WaitlistForm } from './components/WaitlistForm';
import { FadeInView } from '@/components/motion/FadeInView';
import { Reveal } from '@/components/motion/Reveal';
import { StaggerContainer } from '@/components/motion/StaggerContainer';
import { StaggerItem } from '@/components/motion/StaggerItem';

export default function LandingPage() {
  const navItems = [
    { label: 'How it works', href: '#demo' },
    { label: 'Features', href: '#features' },
  ];

  const headerActions = (
    <Link href="#">
      <Button variant="primary" size="sm">
        Join Waitlist
      </Button>
    </Link>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header navItems={navItems} actions={headerActions} sticky />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-separator px-4 py-24 text-center sm:px-6 lg:px-8 xl:py-32">
          {/* Subtle Glow Background */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-100 w-200 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-secondary/10 blur-[120px]" />

          <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center">
            <Reveal direction="up" delay={0.1}>
              <h1 className="text-2xl font-extrabold tracking-tight  sm:text-6xl md:text-7xl font-display leading-[1.1] text-balance px-4 sm:px-0">
                Open Path. <br />
                <span className="bg-linear-to-r from-brand-primary-400 to-brand-primary-700 bg-clip-text text-transparent pb-1 mt-2 inline-block sm:mt-0 sm:pb-2">
                  More Possibilities.
                </span>
                <br />
                For Every Business.
              </h1>
            </Reveal>

            <FadeInView delay={0.2}>
              <p className="mt-6 max-w-2xl text-base leading-relaxed  md:text-lg">
                From the first customer message to the final delivery, Merchander is the operating system that keeps
                your growing social-first business perfectly organized.
              </p>
            </FadeInView>

            <FadeInView delay={0.3} className="w-full">
              <WaitlistForm />
              <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-brand-primary" />
                <span>Get early access before public launch</span>
              </div>
            </FadeInView>
          </div>
        </section>

        {/* Dashboard Mockup Section */}
        <section className="relative px-4 py-16 sm:px-6 lg:px-8 bg-background flex flex-col items-center border-b border-separator">
          <div className="w-full max-w-5xl">
            <FadeInView delay={0.4}>
              <div className="text-center mb-10">
                <h2 className="text-sm font-bold tracking-widest text-brand-primary uppercase">
                  Your business, at a glance.
                </h2>
              </div>

              <div className="rounded-xl border border-separator/80 bg-surface shadow-2xl overflow-hidden relative ring-1 ring-white/5">
                {/* Mockup Header */}
                <div className="border-b border-separator bg-surface-elevated/80 px-4 py-3 flex items-center justify-between backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]"></div>
                  </div>
                  <div className="text-caption font-semibold text-muted/80 tracking-wide">Merchander Dashboard</div>
                  <div className="w-12"></div>
                </div>

                {/* Mockup Content */}
                <div className="p-6 md:p-8 space-y-6 bg-background">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold">Good morning.</h3>
                      <p className="text-sm text-warning font-medium mt-1">5 things need attention.</p>
                    </div>
                  </div>

                  {/* Mockup Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl border border-separator bg-surface">
                      <div className="text-caption uppercase text-muted font-bold mb-1">Sales</div>
                      <div className="text-xl font-bold tabular-nums">₵18.4k</div>
                    </div>
                    <div className="p-4 rounded-xl border border-separator bg-surface">
                      <div className="text-caption uppercase text-muted font-bold mb-1">Orders</div>
                      <div className="text-xl font-bold tabular-nums">42</div>
                    </div>
                    <div className="p-4 rounded-xl border border-separator bg-surface">
                      <div className="text-caption uppercase text-muted font-bold mb-1">To receive</div>
                      <div className="text-xl font-bold tabular-nums">3 shipments</div>
                    </div>
                    <div className="p-4 rounded-xl border border-brand-primary/20 bg-brand-primary/5">
                      <div className="text-caption uppercase text-brand-primary font-bold mb-1">Profit</div>
                      <div className="text-xl font-bold text-brand-primary tabular-nums">₵6.8k</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Mock Chart */}
                    <div className="p-4 rounded-xl border border-separator bg-surface md:col-span-2 h-40 flex flex-col">
                      <div className="text-caption uppercase text-muted font-bold mb-4">Sales Performance</div>
                      <div className="flex-1 flex items-end justify-between gap-2 pb-1">
                        {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                          <div
                            key={i}
                            className="w-full bg-brand-primary/20 rounded-t-sm transition-all hover:bg-brand-primary/40"
                            style={{ height: `${h}%` }}
                          >
                            {i === 6 && (
                              <div className="w-full h-full bg-brand-primary rounded-t-sm shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Attention List */}
                    <div className="p-4 rounded-xl border border-separator bg-surface h-40 flex flex-col justify-center space-y-3">
                      <div className="text-caption uppercase text-muted font-bold mb-1">Attention Center</div>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <div className="w-2 h-2 rounded-full bg-warning"></div>
                        <span className="text-xs">SHP-024 arriving</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <div className="w-2 h-2 rounded-full bg-destructive animate-pulse"></div>
                        <span className="text-xs">Low inventory</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-xs">12 new orders</span>
                      </div>
                    </div>
                  </div>

                  {/* List of Products */}
                  <div className="rounded-xl border border-separator bg-surface overflow-hidden">
                    <div className="px-4 py-3 border-b border-separator bg-surface-elevated">
                      <div className="text-caption uppercase text-muted font-bold">Top Selling Products</div>
                    </div>
                    <div className="divide-y divide-separator">
                      <div className="px-4 py-3 flex items-center justify-between hover:bg-surface-elevated/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-surface-elevated border border-separator flex items-center justify-center">
                            <Box className="w-4 h-4 text-muted" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold">Black Leather Sandal</div>
                            <div className="text-xs  mt-0.5">Size 42 • 4 units left</div>
                          </div>
                        </div>
                        <div className="text-sm font-bold">₵1,200</div>
                      </div>
                      <div className="px-4 py-3 flex items-center justify-between hover:bg-surface-elevated/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-surface-elevated border border-separator flex items-center justify-center">
                            <Box className="w-4 h-4 text-muted" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold">Canvas Tote Bag</div>
                            <div className="text-xs  mt-0.5">Beige • 15 units left</div>
                          </div>
                        </div>
                        <div className="text-sm font-bold">₵450</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center mt-12">
                <h3 className="text-2xl font-bold  font-display mb-2">One business. One connected system.</h3>
                <p className="text-lg  font-medium infline-flex item-center">
                  Procure <ArrowBigRight size={12} className="inline" /> Sell{' '}
                  <ArrowBigRight size={12} className="inline" /> Fulfill <ArrowBigRight size={12} className="inline" />{' '}
                  Profit
                </p>
              </div>
            </FadeInView>
          </div>
        </section>

        {/* How It Works Section */}
        <section
          id="demo"
          className="relative px-4 py-24 sm:px-6 lg:px-8 border-b border-separator overflow-hidden bg-background"
        >
          {/* Dotted Grid Background pattern */}
          <div
            className="absolute inset-0 z-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at center, var(--color-separator) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          ></div>

          <div className="relative z-10 mx-auto max-w-5xl">
            <FadeInView>
              <div className="text-center mb-24 flex flex-col items-center">
                <h2 className="text-3xl font-bold tracking-tight font-display sm:text-4xl">
                  The complete business lifecycle.
                </h2>
                <p className="mt-4 text-lg  max-w-2xl mx-auto">
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
                      <div className="relative rounded-xl border border-brand-primary/20 bg-surface shadow-md p-8 overflow-hidden transition-all hover:shadow-lg">
                        <span className="absolute bottom-0 right-4 text-[100px] font-bold leading-[0.8] text-brand-primary/5 select-none font-display">
                          01
                        </span>
                        <div className="relative z-10">
                          <h3 className="text-xl font-bold font-display text-brand-primary mb-3">Procure</h3>
                          <p className="">
                            Record purchases, track supplier balances, and manage incoming shipments efficiently.
                          </p>
                        </div>
                      </div>
                    </FadeInView>
                  </div>
                  {/* Circle Node */}
                  <div className="absolute left-6 md:left-1/2 -translate-x-1/2 flex h-10 w-10 items-center justify-center rounded-full border-4 border-background bg-brand-primary shadow-sm z-20 transition-transform group-hover:scale-110">
                    <Package className="h-4 w-4 text-white" />
                  </div>
                  <div className="hidden md:block md:w-1/2" />
                </div>

                {/* Step 2: Sell */}
                <div className="relative flex flex-col md:flex-row items-center md:justify-between group md:-mt-10">
                  <div className="hidden md:block md:w-1/2" />
                  {/* Circle Node */}
                  <div className="absolute left-6 md:left-1/2 -translate-x-1/2 flex h-10 w-10 items-center justify-center rounded-full border-4 border-background bg-surface-elevated dark:bg-slate-800 shadow-sm z-20 transition-colors group-hover:bg-brand-primary text-slate-500 group-hover:text-white">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div className="md:w-1/2 md:pl-12 lg:pl-16 flex justify-start w-full pl-16 md:pl-0 mt-8 md:mt-0">
                    <FadeInView className="w-full">
                      <div className="relative rounded-xl border border-separator bg-surface shadow-md p-8 overflow-hidden transition-all hover:shadow-lg">
                        <span className="absolute bottom-0 right-4 text-[100px] font-bold leading-[0.8] text-primary/5 select-none font-display">
                          02
                        </span>
                        <div className="relative z-10">
                          <h3 className="text-xl font-bold font-display  mb-3">Sell</h3>
                          <p className="">
                            Let AI turn social conversations into pre-orders and confirmed sales effortlessly.
                          </p>
                        </div>
                      </div>
                    </FadeInView>
                  </div>
                </div>

                {/* Step 3: Fulfill */}
                <div className="relative flex flex-col md:flex-row items-center md:justify-between group md:-mt-10">
                  <div className="md:w-1/2 md:pr-12 lg:pr-16 flex justify-end w-full pl-16 md:pl-0 mb-8 md:mb-0">
                    <FadeInView className="w-full">
                      <div className="relative rounded-xl border border-brand-primary/20 bg-surface shadow-md p-8 overflow-hidden transition-all hover:shadow-lg">
                        <span className="absolute bottom-0 right-4 text-[100px] font-bold leading-[0.8] text-brand-primary/5 select-none font-display">
                          03
                        </span>
                        <div className="relative z-10">
                          <h3 className="text-xl font-bold font-display text-brand-primary mb-3">Fulfill</h3>
                          <p className="">
                            Track customer payments, manage live inventory, and dispatch deliveries on time.
                          </p>
                        </div>
                      </div>
                    </FadeInView>
                  </div>
                  {/* Circle Node */}
                  <div className="absolute left-6 md:left-1/2 -translate-x-1/2 flex h-10 w-10 items-center justify-center rounded-full border-4 border-background bg-brand-primary shadow-sm z-20 transition-transform group-hover:scale-110 text-white">
                    <Truck className="h-4 w-4" />
                  </div>
                  <div className="hidden md:block md:w-1/2" />
                </div>

                {/* Step 4: Profit */}
                <div className="relative flex flex-col md:flex-row items-center md:justify-between group md:-mt-10">
                  <div className="hidden md:block md:w-1/2" />
                  {/* Circle Node */}
                  <div className="absolute left-6 md:left-1/2 -translate-x-1/2 flex h-10 w-10 items-center justify-center rounded-full border-4 border-background bg-surface-elevated dark:bg-slate-800 shadow-sm z-20 transition-colors group-hover:bg-brand-primary text-slate-500 group-hover:text-white">
                    <LineChart className="h-4 w-4" />
                  </div>
                  <div className="md:w-1/2 md:pl-12 lg:pl-16 flex justify-start w-full pl-16 md:pl-0 mt-8 md:mt-0">
                    <FadeInView className="w-full">
                      <div className="relative rounded-xl border border-separator bg-surface shadow-md p-8 overflow-hidden transition-all hover:shadow-lg">
                        <span className="absolute bottom-0 right-4 text-[100px] font-bold leading-[0.8] text-primary/5 select-none font-display">
                          04
                        </span>
                        <div className="relative z-10">
                          <h3 className="text-xl font-bold font-display  mb-3">Profit</h3>
                          <p className="">See true landed-cost margins and business intelligence in real-time.</p>
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
        <section id="features" className="bg-surface-elevated px-4 py-24 sm:px-6 lg:px-8 border-b border-separator">
          <div className="mx-auto max-w-7xl">
            <FadeInView>
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold tracking-tight font-display sm:text-4xl">Beyond a basic bot.</h2>
                <p className="mt-4 text-lg  max-w-2xl mx-auto">
                  Most tools just send automatic replies. Merchander connects your entire supply chain to your customer
                  conversations.
                </p>
              </div>
            </FadeInView>

            <StaggerContainer className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1: Conversational Commerce */}
              <StaggerItem>
                <div className="group h-full rounded-2xl border border-separator bg-surface p-8 transition-colors hover:border-brand-secondary/50">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-secondary/10 text-brand-secondary transition-transform group-hover:scale-110">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold font-display">Conversational Commerce</h3>
                  <p className="leading-relaxed">
                    Convert customer conversations into structured commerce. The AI handles pricing, availability, and
                    simple orders, escalating complex negotiations directly to you.
                  </p>
                </div>
              </StaggerItem>

              {/* Feature 2: Supplier & Procurement */}
              <StaggerItem>
                <div className="group h-full rounded-2xl border border-separator bg-surface p-8 transition-colors hover:border-brand-primary/50">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary transition-transform group-hover:scale-110">
                    <Briefcase className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold font-display">Supplier Management</h3>
                  <p className="leading-relaxed">
                    Record supplier purchases, track invoices, and monitor exactly how much you&apos;ve paid versus your
                    outstanding balances.
                  </p>
                </div>
              </StaggerItem>

              {/* Feature 3: Shipment & Import */}
              <StaggerItem>
                <div className="group h-full rounded-2xl border border-separator bg-surface p-8 transition-colors hover:border-blue-500/50">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 transition-transform group-hover:scale-110">
                    <Ship className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold font-display">Shipments & Pre-orders</h3>
                  <p className="leading-relaxed">
                    Sell products before they arrive. Track sea-freight shipments, manage import costs, and
                    automatically fulfill customer reservations when goods land.
                  </p>
                </div>
              </StaggerItem>

              {/* Feature 4: Inventory Management */}
              <StaggerItem>
                <div className="group h-full rounded-2xl border border-separator bg-surface p-8 transition-colors hover:border-emerald-500/50">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 transition-transform group-hover:scale-110">
                    <Box className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold font-display">Connected Inventory</h3>
                  <p className="leading-relaxed">
                    Inventory isn&apos;t just a number. Merchander understands when stock is purchased, in-transit,
                    received, available, reserved, or sold.
                  </p>
                </div>
              </StaggerItem>

              {/* Feature 5: Orders & Payments */}
              <StaggerItem>
                <div className="group h-full rounded-2xl border border-separator bg-surface p-8 transition-colors hover:border-brand-primary/50">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary transition-transform group-hover:scale-110">
                    <Wallet className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold font-display">Orders & Payments</h3>
                  <p className="leading-relaxed">
                    Connect every order to a payment status and fulfillment stage. Always know who has paid, who owes
                    you, and what needs to be delivered.
                  </p>
                </div>
              </StaggerItem>

              {/* Feature 6: Business Intelligence */}
              <StaggerItem>
                <div className="group h-full rounded-2xl border border-separator bg-surface p-8 transition-colors hover:border-purple-500/50">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500 transition-transform group-hover:scale-110">
                    <LineChart className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold font-display">Business Intelligence</h3>
                  <p className="leading-relaxed">
                    Turn operational data into decisions. See your true landed-cost profitability, sales performance,
                    and demand trends instantly.
                  </p>
                </div>
              </StaggerItem>

              {/* Feature 7: Commerce Core (spans full width on tablet/desktop if odd number) */}
              <StaggerItem className="md:col-span-2 lg:col-span-3">
                <div className="group flex flex-col md:flex-row items-center gap-8 rounded-2xl border border-separator bg-surface p-8 sm:p-12 transition-colors hover:border-brand-secondary/50">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-brand-secondary/10 text-brand-secondary transition-transform group-hover:scale-110">
                    <Store className="h-10 w-10" />
                  </div>
                  <div>
                    <h3 className="mb-3 text-2xl font-bold font-display">The Commerce Core</h3>
                    <p className="leading-relaxed  text-lg">
                      Beneath the conversational interface is a robust e-commerce engine managing your entire catalog,
                      product variants, dynamic pricing, and staff permissions. It&apos;s the central nervous system for
                      your growing business.
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
