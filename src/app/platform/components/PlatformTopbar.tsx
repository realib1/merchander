'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Menu, Shield } from 'lucide-react';
import { ThemeToggle } from '@/app/dashboard/components/ThemeToggle';
import { useMobileNav } from '@/app/dashboard/components/MobileNavContext';
import { PlatformRole } from '@/types/platform';

interface PlatformTopbarProps {
  userEmail?: string;
  userRole?: PlatformRole | string;
}

const routeTitles: Record<string, { title: string; subtitle: string }> = {
  admin: {
    title: 'Overview',
    subtitle: 'Platform operations, subscription metrics, and system status.',
  },
  merchants: {
    title: 'Merchants',
    subtitle: 'Manage merchant workspaces, review owner profiles, and configure plan tiers.',
  },
  'plans-billing': {
    title: 'Plans & Billing',
    subtitle: 'Manage platform commercial tiers, entitlement limits, and pricing.',
  },
  revenue: {
    title: 'Platform Revenue',
    subtitle: 'MRR, ARR trajectory, ARPU, and subscription financial analytics.',
  },
  'payments-providers': {
    title: 'Payments & Providers',
    subtitle: 'Paystack, Hubtel, and Mobile Money gateway infrastructure.',
  },
  integrations: {
    title: 'Integrations',
    subtitle: 'WhatsApp Cloud API, Instagram Graph API, and SMS notification gateways.',
  },
  domains: {
    title: 'Domains',
    subtitle: 'Custom domains and subdomains routing and SSL status.',
  },
  intelligence: {
    title: 'Intelligence',
    subtitle: 'Multimodal AI telemetry, model performance, and compute costs.',
  },
  support: {
    title: 'Help & Support Desk',
    subtitle: 'Merchant support ticket triage, SLA resolution, and staff notes.',
  },
  communications: {
    title: 'Communications',
    subtitle: 'Targeted broadcast announcements and maintenance banners.',
  },
  security: {
    title: 'Security & Compliance',
    subtitle: 'Platform staff RBAC access control and security safeguards.',
  },
  'system-health': {
    title: 'System Health',
    subtitle: 'Database latency, connection pooling, and infrastructure health.',
  },
  'audit-logs': {
    title: 'Audit Logs',
    subtitle: 'Immutable, tamper-resistant administrative audit trail.',
  },
  settings: {
    title: 'Platform Settings',
    subtitle: 'Global platform configuration and security parameters.',
  },
};

export function PlatformTopbar({ userEmail, userRole = 'platform_admin' }: PlatformTopbarProps) {
  const pathname = usePathname();
  const { setIsOpen } = useMobileNav();

  const segments = pathname.split('/').filter(Boolean);
  const currentSegment = segments[segments.length - 1] || 'admin';
  const headerInfo = routeTitles[currentSegment] || {
    title: 'Platform Control Plane',
    subtitle: 'Merchander platform administration.',
  };

  return (
    <header className="h-18 border-b border-separator/50 bg-background/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-4 md:px-8">
      {/* Left: Hamburger & Header Title */}
      <div className="flex items-center gap-3 md:gap-4 min-w-0">
        <button
          className="xl:hidden p-2 -ml-2 hover:bg-surface-elevated rounded-lg transition-colors cursor-pointer text-muted hover:text-foreground"
          onClick={() => setIsOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-foreground truncate font-display">
            {headerInfo.title}
          </h1>
          <p className="text-xs text-muted truncate hidden sm:block">
            {headerInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Theme Toggle & Staff Profile */}
      <div className="flex items-center gap-3">
        <ThemeToggle />

        {userEmail && (
          <div className="flex items-center gap-2 pl-3 border-l border-separator/60">
            <div className="w-8 h-8 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary flex items-center justify-center font-bold text-xs font-mono shrink-0">
              <Shield size={14} />
            </div>

            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-foreground truncate max-w-40">
                {userEmail}
              </div>
              <div className="text-[10px] font-medium text-brand-primary uppercase font-mono tracking-wider">
                {userRole.replace('_', ' ')}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
