'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  User,
  Shield,
  Bell,
  Building2,
  CreditCard,
  Share2,
  UsersRound,
  Gem,
  Clock,
  Sliders,
  ChevronDown,
  Settings,
  LifeBuoy,
} from 'lucide-react';
import { MobileSettingsSheet } from './MobileSettingsSheet';
import { HelpSupportModal } from '@/components/help/HelpSupportModal';

export const settingsGroups = [
  {
    title: 'Account',
    items: [
      { name: 'Profile', href: '/dashboard/settings/profile', icon: User },
      { name: 'Security', href: '/dashboard/settings/security', icon: Shield },
      { name: 'Notifications', href: '/dashboard/settings/notifications', icon: Bell },
    ],
  },
  {
    title: 'Business & Store',
    items: [
      { name: 'Business Profile', href: '/dashboard/settings/business-profile', icon: Building2 },
      { name: 'Business Hours', href: '/dashboard/settings/hours', icon: Clock },
    ],
  },
  {
    title: 'Commerce & Channels',
    items: [
      { name: 'Payments & MoMo', href: '/dashboard/settings/payments', icon: CreditCard },
      { name: 'Connected Channels', href: '/dashboard/settings/channels', icon: Share2 },
      { name: 'Order Preferences', href: '/dashboard/settings/orders', icon: Sliders },
    ],
  },
  {
    title: 'Organization',
    items: [
      { name: 'Staff Management', href: '/dashboard/staff', icon: UsersRound },
      { name: 'Plan & Billing', href: '/dashboard/settings/subscription', icon: Gem },
    ],
  },
];

export function SettingsSidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Find active item
  const allItems = settingsGroups.flatMap((group) => group.items);
  const activeItem = allItems.find((item) => item.href === pathname) || {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  };
  const ActiveIcon = activeItem.icon;

  return (
    <>
      {/* 1. Mobile Top Section Selector Trigger (< md) */}
      <div className="md:hidden w-full mb-4">
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-surface border border-separator/90 shadow-2xs text-left cursor-pointer hover:bg-surface-elevated transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
              <ActiveIcon size={16} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted tracking-wider block">Settings Area</span>
              <span className="text-xs font-bold text-foreground font-display">{activeItem.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted font-medium bg-surface-elevated px-2.5 py-1 rounded-lg border border-separator/60">
            <span>Switch</span>
            <ChevronDown size={14} />
          </div>
        </button>
      </div>

      {/* Mobile Drawer */}
      <MobileSettingsSheet
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        onOpenHelp={() => setIsHelpOpen(true)}
        pathname={pathname}
        groups={settingsGroups}
      />

      {/* 2. Desktop Sticky Nav Rail (>= md) */}
      <nav
        aria-label="Settings navigation"
        className="hidden md:block bg-surface border border-separator/80 rounded-2xl p-4 shadow-xs space-y-6"
      >
        {settingsGroups.map((group) => {
          const groupId = `group-${group.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
          return (
            <div key={group.title} className="space-y-1.5">
              <h2
                id={groupId}
                className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-muted/70 select-none"
              >
                {group.title}
              </h2>
              <ul aria-labelledby={groupId} className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        aria-current={isActive ? 'page' : undefined}
                        className={`group flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-brand-primary/10 text-brand-primary font-semibold'
                            : 'text-foreground/80 hover:bg-surface-elevated hover:text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon
                            size={15}
                            className={`shrink-0 transition-colors ${
                              isActive ? 'text-brand-primary' : 'text-muted group-hover:text-foreground'
                            }`}
                            aria-hidden="true"
                          />
                          <span>{item.name}</span>
                        </div>
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}

        {/* Desktop Help & Support Trigger */}
        <div className="pt-2 border-t border-separator/80">
          <button
            type="button"
            onClick={() => setIsHelpOpen(true)}
            className="w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold text-muted hover:bg-surface-elevated hover:text-foreground transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <LifeBuoy size={15} className="text-brand-primary" />
              <span>Help & Support</span>
            </div>
          </button>
        </div>
      </nav>

      {/* Help & Support Modal */}
      <HelpSupportModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </>
  );
}
