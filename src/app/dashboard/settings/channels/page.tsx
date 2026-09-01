import { Metadata } from 'next';
import { getChannelSettings } from '@/app/actions/settings-social';
import { ChannelsSettingsForm } from './components/ChannelsSettingsForm';

export const metadata: Metadata = {
  title: 'Connected Channels | Merchander',
  description: 'Connect WhatsApp, Instagram Direct, Facebook Messenger, and Telegram.',
};

export default async function ChannelsSettingsPage() {
  const settings = await getChannelSettings();

  return (
    <div className="max-w-4xl space-y-6 sm:space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-display">
          Connected Channels
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1">
          Connect your social messaging channels and automated bots to sync customer chats, floating storefront widgets,
          and order alerts into Merchander.
        </p>
      </div>

      <ChannelsSettingsForm initialSettings={settings} />
    </div>
  );
}
