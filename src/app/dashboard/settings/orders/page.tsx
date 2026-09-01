import { Metadata } from 'next';
import { getOrderSettings } from '@/app/actions/settings-commerce';
import { OrdersSettingsForm } from './components/OrdersSettingsForm';

export const metadata: Metadata = {
  title: 'Orders Preferences | Merchander',
  description:
    'Configure operational rules for order numbering, creation, confirmation, inventory reservation, and lifecycle tracking.',
};

export default async function OrdersSettingsPage() {
  const settings = await getOrderSettings();

  return (
    <div className="max-w-4xl space-y-6 sm:space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-display">
          Orders Preferences
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1">
          Configure how orders are numbered, confirmed, fulfilled, and tracked across channels.
        </p>
      </div>

      <OrdersSettingsForm initialSettings={settings} />
    </div>
  );
}
