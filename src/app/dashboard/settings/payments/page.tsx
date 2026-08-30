import { Metadata } from 'next';
import { getPaymentSettings } from '@/app/actions/settings-commerce';
import { PaymentsSettingsForm } from './components/PaymentsSettingsForm';

export const metadata: Metadata = {
  title: 'Payments Settings | Merchander',
  description: 'Manage Mobile Money networks, card gateways, and Cash on Delivery rules.',
};

export default async function PaymentsSettingsPage() {
  const settings = await getPaymentSettings();

  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">Payments</h1>
        <p className="text-sm text-muted mt-1">
          Manage how your store accepts Mobile Money (MTN, Telecel, AT), Cards, and Cash on Delivery.
        </p>
      </div>

      <PaymentsSettingsForm initialSettings={settings} />
    </div>
  );
}
