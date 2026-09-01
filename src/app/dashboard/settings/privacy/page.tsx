import { Metadata } from 'next';
import { getPrivacySettings } from '@/app/actions/settings-data';
import { PrivacySettingsForm } from './components/PrivacySettingsForm';

export const metadata: Metadata = {
  title: 'Privacy & Data Settings | Merchander',
  description: 'Manage cookie banners, customer marketing consent, and data retention.',
};

export default async function PrivacySettingsPage() {
  const settings = await getPrivacySettings();

  return (
    <div className="max-w-4xl space-y-6 sm:space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-display">
          Privacy & Data Policies
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1">
          Manage customer consent, tracking cookies, and data retention schedules.
        </p>
      </div>

      <PrivacySettingsForm initialSettings={settings} />
    </div>
  );
}
