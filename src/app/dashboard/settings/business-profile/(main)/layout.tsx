import { PageTabs, Tab } from '@/components/layout/PageTabs';
import { ReactNode } from 'react';

const tabs: Tab[] = [
  { name: 'Business Profile', href: '/dashboard/settings/business-profile' },
  { name: 'Business Hours', href: '/dashboard/settings/business-profile/hours' },
];

export default function BusinessProfileMainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col animate-fadeIn max-w-7xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-display mb-2">Business Profile</h1>
        <PageTabs tabs={tabs} />
      </div>
      {children}
    </div>
  );
}
