import { Metadata } from 'next';
import { getInventorySettings } from '@/app/actions/settings-commerce';
import { InventorySettingsForm } from './components/InventorySettingsForm';

export const metadata: Metadata = {
  title: 'Inventory Settings | Merchander',
  description: 'Manage stock tracking, alert thresholds, and SKU generation policies.',
};

export default async function InventorySettingsPage() {
  const settings = await getInventorySettings();

  return (
    <div className="max-w-4xl space-y-6 sm:space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-display">
          Products & Inventory
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1">
          Configure inventory tracking policies, low stock warning thresholds, and SKU auto-generation.
        </p>
      </div>

      <InventorySettingsForm initialSettings={settings} />
    </div>
  );
}
