import { Metadata } from 'next';
import { getShipmentSettings } from '@/app/actions/settings-operations';
import { ShipmentsSettingsForm } from './components/ShipmentsSettingsForm';

export const metadata: Metadata = {
  title: 'Shipments & Delivery Settings | Merchander',
  description: 'Manage shipping zones, regional rates across Ghana, and rider dispatch tracking.',
};

export default async function ShipmentsSettingsPage() {
  const settings = await getShipmentSettings();

  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Shipments & Delivery</h1>
        <p className="text-sm text-secondary mt-1">
          Set up local delivery zones, dispatch riders, and shipping rates across Ghana.
        </p>
      </div>

      <ShipmentsSettingsForm initialSettings={settings} />
    </div>
  );
}
