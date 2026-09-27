import { PageTabs } from '@/components/layout/PageTabs';

const TABS = [
  { name: 'Suppliers & POs', href: '/dashboard/suppliers' },
  { name: 'Settings', href: '/dashboard/suppliers/preferences' },
];

export default function SuppliersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Suppliers</h1>
      </div>
      <PageTabs tabs={TABS} />
      <div>{children}</div>
    </div>
  );
}
