import { Metadata } from 'next';
import { getPlatformSettingsAction } from '@/app/actions/platform-settings';
import { GeneralSettingsForm } from './components/GeneralSettingsForm';

export const metadata: Metadata = {
  title: 'Platform General Settings | Platform Console',
  description: 'Manage global platform information and defaults.',
};

export default async function PlatformGeneralSettingsPage() {
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
      <GeneralSettingsForm initialData={settings} />
    </div>
  );
}
