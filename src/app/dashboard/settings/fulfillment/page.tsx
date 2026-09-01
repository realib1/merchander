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
    <div className="max-w-4xl space-y-6 sm:space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-display">
          Fulfillment Settings
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1">
          Configure order packing workflows, barcode verification, and packing slips.
        </p>
      </div>

      <FulfillmentSettingsForm initialSettings={settings} />
    </div>
  );
}
