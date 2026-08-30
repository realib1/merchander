import { Metadata } from 'next';
import { getOrderSettings } from '@/app/actions/settings-commerce';
import { OrdersSettingsForm } from './components/OrdersSettingsForm';

export const metadata: Metadata = {
  title: 'Order Settings | Merchander',
  description: 'Manage order prefixing, confirmation notifications, and checkout recovery.',
};

export default async function OrdersSettingsPage() {
  const settings = await getOrderSettings();

  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Order Settings</h1>
        <p className="text-sm text-secondary mt-1">
          Manage how orders are formatted, receipts delivered, and abandoned carts recovered.
        </p>
      </div>

      <OrdersSettingsForm initialSettings={settings} />
    </div>
  );
}
