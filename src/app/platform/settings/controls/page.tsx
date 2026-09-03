import { Metadata } from 'next';
import { getPlatformSettingsAction } from '@/app/actions/platform-settings';
import { ControlsSettingsForm } from '../components/ControlsSettingsForm';

export const metadata: Metadata = {
  title: 'Master Controls | Platform Console',
  description: 'Manage critical platform-wide toggles.',
};

export default async function PlatformControlsSettingsPage() {
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
      <ControlsSettingsForm initialData={settings} />
    </div>
  );
}
