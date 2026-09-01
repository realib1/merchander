import { Metadata } from 'next';
import { getSubscriptionSettings } from '@/app/actions/settings-subscription';
import { SubscriptionView } from './components/SubscriptionView';

export const metadata: Metadata = {
  title: 'Plan & Billing | Merchander',
  description: 'Manage your active subscription tier, billing cycle, usage quotas, and payment receipts.',
};

interface SubscriptionSettingsPageProps {
  searchParams: Promise<{
    status?: string;
    ref?: string;
    reference?: string;
    type?: string;
  }>;
}

export default async function SubscriptionSettingsPage({ searchParams }: SubscriptionSettingsPageProps) {
  const params = await searchParams;
  const settings = await getSubscriptionSettings();

  return (
    <div className="max-w-4xl space-y-6 sm:space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-display">Plan & Billing</h1>
        <p className="text-xs sm:text-sm text-muted mt-1">
          Manage your active subscription tier, billing cycle, usage quotas, and payment receipts.
        </p>
      </div>

      <SubscriptionView
        initialSettings={settings}
        callbackStatus={params.status}
        callbackRef={params.ref || params.reference}
        callbackType={params.type}
      />
    </div>
  );
}
