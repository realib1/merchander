import { Metadata } from 'next';
import { getChannelSettings } from '@/app/actions/settings-social';
import { ChannelsSettingsForm } from './components/ChannelsSettingsForm';

export const metadata: Metadata = {
  title: 'Connected Channels | Merchander',
  description: 'Connect WhatsApp, Instagram Direct, and Facebook Messenger.',
};

export default async function ChannelsSettingsPage() {
  const settings = await getChannelSettings();

  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">Connected Channels</h1>
        <p className="text-sm text-muted mt-1">
          Connect your social media and WhatsApp accounts to sync customer chats and orders into Merchander.
        </p>
      </div>

      <ChannelsSettingsForm initialSettings={settings} />
    </div>
  );
}
