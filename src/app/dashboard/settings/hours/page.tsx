import { Metadata } from 'next';
import { getBusinessHours } from '@/app/actions/settings-business';
import { HoursForm } from './components/HoursForm';

export const metadata: Metadata = {
  title: 'Business Hours | Merchander',
  description: 'Configure your operating hours and storefront availability schedule.',
};

export default async function BusinessHoursSettingsPage() {
  const settings = await getBusinessHours();

  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Business Hours</h1>
        <p className="text-sm text-secondary mt-1">
          Configure when your store is open for business, taking orders, and answering customer chats.
        </p>
      </div>

      <HoursForm initialSettings={settings} />
    </div>
  );
}
