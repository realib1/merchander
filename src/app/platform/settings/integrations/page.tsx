import { Metadata } from 'next';
import { getPlatformSettingsAction } from '@/app/actions/platform-settings';
import { IntegrationsSettingsForm } from '../components/IntegrationsSettingsForm';

export const metadata: Metadata = {
  title: 'Platform Integrations | Platform Console',
  description: 'Manage API keys and global platform integrations.',
};

export default async function PlatformIntegrationsSettingsPage() {
  const { data: settings, error } = await getPlatformSettingsAction();

  if (error || !settings) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
        Failed to load platform settings: {error || 'Unknown error'}
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <IntegrationsSettingsForm initialData={settings} />
    </div>
  );
}
