import { PageTabs } from '@/components/layout/PageTabs';

const TABS = [
  { name: 'Shipments', href: '/dashboard/shipments' },
  { name: 'Zones & Rates', href: '/dashboard/shipments/preferences' },
];

export default function ShipmentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Shipments</h1>
      </div>
      <PageTabs tabs={TABS} />
      <div>{children}</div>
    </div>
  );
}
