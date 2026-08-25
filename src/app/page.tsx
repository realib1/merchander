import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { HeroSection } from './components/landing/HeroSection';
import { ProblemSection } from './components/landing/ProblemSection';
import { ConnectionFlowSection } from './components/landing/ConnectionFlowSection';
import { PillarsSection } from './components/landing/PillarsSection';
import { IntelligenceSection } from './components/landing/IntelligenceSection';
import { BusinessTypesSection } from './components/landing/BusinessTypesSection';
import { AfricanRootsSection } from './components/landing/AfricanRootsSection';
import { TrustSection } from './components/landing/TrustSection';
import { CtaSection } from './components/landing/CtaSection';

export default function LandingPage() {
  const navItems = [
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Areas', href: '#areas' },
    { label: 'Intelligence', href: '#intelligence' },
    { label: 'Businesses', href: '#businesses' },
  ];

  const headerActions = (
    <a href="#waitlist">
      <Button variant="primary" size="sm" className="font-medium w-full">
        Start with Merchander
      </Button>
    </a>
  );

  const footerLinkGroups = [
    {
      title: 'Operations',
      items: [
        { label: 'Sell & Checkout', href: '#areas' },
        { label: 'Connected Stock', href: '#areas' },
        { label: 'Customer Credit', href: '#areas' },
        { label: 'Suppliers', href: '#areas' },
        { label: 'Money & Reconciliations', href: '#areas' },
      ],
    },
    {
      title: 'Realities',
      items: [
        { label: 'Mobile Money Integration', href: '#businesses' },
        { label: 'WhatsApp Commerce', href: '#businesses' },
        { label: 'Retail & Wholesale', href: '#businesses' },
        { label: 'Boutique & Fashion', href: '#businesses' },
      ],
    },
    {
      title: 'Company',
      items: [
        { label: 'About Merchander', href: '#how-it-works' },
        { label: 'Early Access Waitlist', href: '#waitlist' },
        { label: 'SHERO HQ', href: 'https://sherohq.com', external: true },
      ],
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-primary">
      <Header navItems={navItems} actions={headerActions} sticky />

      <main className="flex-1">
        {/* 1. Hero: "Know your business." */}
        <HeroSection />

        {/* 2. Problem: "Your business is telling you things." */}
        <ProblemSection />

        {/* 3. Transaction Cascade Flow: "Merchander makes the picture clear." */}
        <ConnectionFlowSection />

        {/* 4. Six Pillars: Sell, Stock, Customers, Suppliers, Money, Business */}
        <PillarsSection />

        {/* 5. Business Intelligence / Aha Section: "Merchander understands your business." */}
        <IntelligenceSection />

        {/* 6. Real Businesses: "Built around the way businesses actually work." */}
        <BusinessTypesSection />

        {/* 7. African Roots, Global Quality */}
        <AfricanRootsSection />

        {/* 8. Trust, Privacy & Data Isolation */}
        <TrustSection />

        {/* 9. Final Call to Action */}
        <CtaSection />
      </main>

      <Footer
        brandName="Merchander"
        tagline="Open Path. More Possibilities. For Every Business."
        linkGroups={footerLinkGroups}
      />
    </div>
  );
}
