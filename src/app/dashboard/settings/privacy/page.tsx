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
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Privacy & Data</h1>
        <p className="text-sm text-secondary mt-1">Manage how customer data is handled on your storefront.</p>
      </div>

      <PrivacySettingsForm initialSettings={settings} />
    </div>
  );
}
