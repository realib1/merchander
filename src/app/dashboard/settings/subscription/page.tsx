import { Metadata } from 'next';
import { SubscriptionView } from './components/SubscriptionView';

export const metadata: Metadata = {
  title: 'Subscription & Billing | Merchander',
  description: 'Manage your Merchander subscription tier, billing cycle, and payment method.',
};

export default function SubscriptionSettingsPage() {
  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">Subscription</h1>
        <p className="text-sm text-muted mt-1">Manage your Merchander billing plan and payment methods.</p>
      </div>

      <SubscriptionView />
    </div>
  );
}
