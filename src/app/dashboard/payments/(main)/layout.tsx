import { PageTabs } from '@/components/layout/PageTabs';

const TABS = [
  { name: 'Payments & Cashflow', href: '/dashboard/payments' },
  { name: 'Payment Gateways', href: '/dashboard/payments/gateways' },
  { name: 'Checkout', href: '/dashboard/payments/checkout' },
];

export default function PaymentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Payments & Cashflow</h1>
      </div>
      <PageTabs tabs={TABS} />
      <div>{children}</div>
    </div>
  );
}
