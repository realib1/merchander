import { PageTabs } from '@/components/layout/PageTabs';

const TABS = [
  { name: 'Approvals & Inquiries', href: '/dashboard/conversations' },
  { name: 'Routing & SLA', href: '/dashboard/conversations/routing' },
  { name: 'Automation & Bots', href: '/dashboard/conversations/automation' },
];

export default function ConversationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Approvals & Inquiries</h1>
      </div>
      <PageTabs tabs={TABS} />
      <div>{children}</div>
    </div>
  );
}
