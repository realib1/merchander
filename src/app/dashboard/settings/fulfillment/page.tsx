import { Metadata } from 'next';
import { getFulfillmentSettings } from '@/app/actions/settings-operations';
import { FulfillmentSettingsForm } from './components/FulfillmentSettingsForm';

export const metadata: Metadata = {
  title: 'Fulfillment Settings | Merchander',
  description: 'Configure order packing workflows, barcode verification, and packing slips.',
};

export default async function FulfillmentSettingsPage() {
  const settings = await getFulfillmentSettings();

  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Fulfillment</h1>
        <p className="text-sm text-secondary mt-1">Configure how orders are packed and processed by your team.</p>
      </div>

      <FulfillmentSettingsForm initialSettings={settings} />
    </div>
  );
}
