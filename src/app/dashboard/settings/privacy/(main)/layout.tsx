import { PageTabs, Tab } from '@/components/layout/PageTabs';
import { ReactNode } from 'react';

const tabs: Tab[] = [
  { name: 'Privacy & Retention', href: '/dashboard/settings/privacy' },
  { name: 'Export Data', href: '/dashboard/settings/privacy/export' },
];

export default function PrivacyMainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col animate-fadeIn max-w-7xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-display mb-2">Privacy & Retention</h1>
        <PageTabs tabs={tabs} />
      </div>
      {children}
    </div>
  );
}
