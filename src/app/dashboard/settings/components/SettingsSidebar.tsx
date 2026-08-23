'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  User, Shield, Bell, Building2, Store, Clock, 
  ShoppingCart, Package, CreditCard, Users, Truck, Box,
  Share2, MessageSquare, Zap, UsersRound, Lock, FileText, Download, Gem
} from 'lucide-react';

const settingsGroups = [
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
      { name: 'Store', href: '/dashboard/settings/store', icon: Store },
      { name: 'Business Hours', href: '/dashboard/settings/business-hours', icon: Clock },
    ],
  },
  {
    title: 'Commerce',
    items: [
      { name: 'Orders', href: '/dashboard/settings/orders', icon: ShoppingCart },
      { name: 'Products & Inventory', href: '/dashboard/settings/inventory', icon: Package },
      { name: 'Payments', href: '/dashboard/settings/payments', icon: CreditCard },
    ],
  },
  {
    title: 'Operations',
    items: [
      { name: 'Suppliers', href: '/dashboard/settings/suppliers', icon: Users },
      { name: 'Shipments', href: '/dashboard/settings/shipments', icon: Truck },
      { name: 'Fulfillment', href: '/dashboard/settings/fulfillment', icon: Box },
    ],
  },
  {
    title: 'Social Commerce',
    items: [
      { name: 'Connected Channels', href: '/dashboard/settings/channels', icon: Share2 },
      { name: 'Conversations', href: '/dashboard/settings/conversations', icon: MessageSquare },
      { name: 'Automation', href: '/dashboard/settings/automation', icon: Zap },
    ],
  },
  {
    title: 'Team',
    items: [
      { name: 'Staff & Permissions', href: '/dashboard/settings/staff', icon: UsersRound },
    ],
  },
  {
    title: 'Data & Security',
    items: [
      { name: 'Privacy', href: '/dashboard/settings/privacy', icon: Lock },
      { name: 'Audit Log', href: '/dashboard/settings/audit-log', icon: FileText },
      { name: 'Export Data', href: '/dashboard/settings/export', icon: Download },
    ],
  },
  {
    title: 'System',
    items: [
      { name: 'Subscription', href: '/dashboard/settings/subscription', icon: Gem },
    ],
  },
];

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <nav className="space-y-8 pb-10 h-full overflow-y-auto pr-4 custom-scrollbar">
      {settingsGroups.map((group) => (
        <div key={group.title} className="space-y-1">
          <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted mb-3">
            {group.title}
          </h2>
          <ul className="space-y-1">
            {group.items.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-brand-primary/10 text-brand-primary'
                        : 'text-secondary hover:bg-surface-elevated hover:text-brand-primary'
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        isActive ? 'text-brand-primary' : 'text-muted group-hover:text-brand-primary'
                      }`}
                    />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
