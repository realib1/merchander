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
    <div className="max-w-4xl space-y-6 sm:space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-display">Business Hours</h1>
        <p className="text-xs sm:text-sm text-muted mt-1">
          Configure when your store is open for business, taking orders, and answering customer chats.
        </p>
      </div>

      <HoursForm initialSettings={settings} />
    </div>
  );
}
