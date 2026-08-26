import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { HeroSection } from './components/landing/HeroSection';
import { ProblemSection } from './components/landing/ProblemSection';
import { ConnectionFlowSection } from './components/landing/ConnectionFlowSection';
import { MerchantJourneySection } from './components/landing/MerchantJourneySection';
import { PillarsSection } from './components/landing/PillarsSection';
import { AfricanRootsSection } from './components/landing/AfricanRootsSection';
import { TrustSection } from './components/landing/TrustSection';
import { CtaSection } from './components/landing/CtaSection';

export default function LandingPage() {
  const navItems = [
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Areas', href: '#areas' },
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
      title: 'Platform',
      items: [
        { label: 'How it works', href: '#how-it-works' },
        { label: 'Get Early Access', href: '#waitlist' },
      ],
    },
    {
      title: 'Company',
      items: [
        { label: 'About SHERO', href: 'https://sherohq.com', external: true },
        { label: 'Contact Us', href: 'mailto:hello@sherohq.com' },
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

        {/* 4. The Real Journey: Pre-order to Landed Cost */}
        <MerchantJourneySection />

        {/* 5. Six Pillars: Sell, Stock, Customers, Suppliers, Money, Business */}
        <PillarsSection />

        {/* 7. African Roots, Global Quality */}
        <AfricanRootsSection />

        {/* 8. Trust, Privacy & Data Isolation */}
        <TrustSection />

        {/* 9. Final Call to Action */}
        <CtaSection />
      </main>

      <Footer
        brandName="Merchander"
        tagline="Open Path. More Possibilities. For the ambitious merchant."
        linkGroups={footerLinkGroups}
      />
    </div>
  );
}
