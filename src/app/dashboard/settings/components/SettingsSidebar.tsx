'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  User,
  Shield,
  Bell,
  Building2,
  Store,
  CreditCard,
  Share2,
  UsersRound,
  Gem,
  Clock,
  Sliders,
  ChevronDown,
  Settings,
  LifeBuoy,
  Package,
  Truck,
  PackageCheck,
  ShieldCheck,
  FileSpreadsheet,
  Activity,
  Cookie,
  Bot,
} from 'lucide-react';
import { MobileSettingsSheet } from './MobileSettingsSheet';

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
    title: 'Business',
    items: [
      { name: 'Business Profile', href: '/dashboard/settings/business-profile', icon: Building2 },
      { name: 'Branches & Locations', href: '/dashboard/settings/branches', icon: Store },
      { name: 'Business Hours', href: '/dashboard/settings/hours', icon: Clock },
    ],
  },
  {
    title: 'Commerce',
    items: [
      { name: 'Order Preferences', href: '/dashboard/settings/orders', icon: Sliders },
      { name: 'Products & Inventory', href: '/dashboard/settings/inventory', icon: Package },
      { name: 'Payments & Cashflow', href: '/dashboard/settings/payments', icon: CreditCard },
    ],
  },
  {
    title: 'Operations & Channels',
    items: [
      { name: 'Connected Channels', href: '/dashboard/settings/channels', icon: Share2 },
      { name: 'Automation & Bots', href: '/dashboard/settings/automation', icon: Bot },
      { name: 'Suppliers & POs', href: '/dashboard/settings/suppliers', icon: Truck },
      { name: 'Shipments & Zones', href: '/dashboard/settings/shipments', icon: Truck },
      { name: 'Fulfillment & Slips', href: '/dashboard/settings/fulfillment', icon: PackageCheck },
    ],
  },
  {
    title: 'Data & Access',
    items: [
      { name: 'Staff Management', href: '/dashboard/staff', icon: UsersRound },
      { name: 'Roles & Permissions', href: '/dashboard/settings/permissions', icon: ShieldCheck },
      { name: 'Privacy & Retention', href: '/dashboard/settings/privacy', icon: Cookie },
      { name: 'Audit Log', href: '/dashboard/settings/audit-log', icon: Activity },
      { name: 'Export Data', href: '/dashboard/settings/export', icon: FileSpreadsheet },
    ],
  },
  {
    title: 'System',
    items: [{ name: 'Plan & Billing', href: '/dashboard/settings/subscription', icon: Gem }],
  },
];

export function SettingsSidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Find active item
  const allItems = settingsGroups.flatMap((group) => group.items);
  const activeItem = allItems.find((item) => item.href === pathname) || {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  };

  return (
    <>
      {/* 1. Mobile Drawer Trigger (< md) */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-surface border border-separator/80 shadow-xs active:scale-[0.99] transition-all cursor-pointer"
          aria-label="Open settings menu"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary">
              <activeItem.icon size={18} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted tracking-wider block">Settings Area</span>
              <span className="text-xs font-bold text-foreground font-display">{activeItem.name}</span>
            </div>
          </div>
          <ChevronDown size={16} className="text-muted" />
        </button>
      </div>

      {/* Mobile Drawer */}
      <MobileSettingsSheet
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
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

        {/* Desktop Help & Support Page Link */}
        <div className="pt-2 border-t border-separator/80">
          <Link
            href="/dashboard/help"
            className="w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold text-muted hover:bg-surface-elevated hover:text-foreground transition-all"
          >
            <div className="flex items-center gap-2.5">
              <LifeBuoy size={15} className="text-brand-primary" />
              <span>Help & Support</span>
            </div>
          </Link>
        </div>
      </nav>
    </>
  );
}
