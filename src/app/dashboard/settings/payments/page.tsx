import { Metadata } from 'next';
import { getPaymentSettings } from '@/app/actions/settings-commerce';
import { PaymentsSettingsForm } from './components/PaymentsSettingsForm';

export const metadata: Metadata = {
  title: 'Payments Settings | Merchander',
  description:
    'Configure accepted payment methods, external provider integrations, operating currency, and ledger recording policies.',
};

export default async function PaymentsSettingsPage() {
  const settings = await getPaymentSettings();

  return (
    <div className="max-w-4xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">Payments</h1>
        <p className="text-sm text-muted mt-1">
          Configure accepted payment methods, external provider integrations, operating currency, and ledger recording
          policies.
        </p>
      </div>

      <PaymentsSettingsForm initialSettings={settings} />
    </div>
  );
}
