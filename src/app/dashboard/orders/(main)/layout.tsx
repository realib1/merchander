import { PageTabs, Tab } from '@/components/layout/PageTabs';
import { ReactNode } from 'react';

const tabs: Tab[] = [
  { name: 'Orders', href: '/dashboard/orders' },
  { name: 'Preferences', href: '/dashboard/orders/preferences' },
  { name: 'Fulfillment & Slips', href: '/dashboard/orders/fulfillment' },
];

export default function OrdersMainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col animate-fadeIn max-w-7xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-display mb-2">Orders</h1>
        <PageTabs tabs={tabs} />
      </div>
      {children}
    </div>
  );
}
