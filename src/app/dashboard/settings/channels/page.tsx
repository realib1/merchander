import { Metadata } from 'next';
import { getChannelSettings } from '@/app/actions/settings-social';
import { getChannelConnections } from '@/app/actions/channels';
import { ChannelsSettingsForm } from './components/ChannelsSettingsForm';

export const metadata: Metadata = {
  title: 'Connected Channels | Merchander',
  description: 'Connect WhatsApp, Instagram Direct, Facebook Messenger, and Telegram.',
};

export default async function ChannelsSettingsPage() {
  const [settings, connections] = await Promise.all([getChannelSettings(), getChannelConnections()]);

  return (
    <div className="max-w-4xl space-y-6 sm:space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-display">
          Connected Channels
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1">
          Configure channel preferences and review the live runtime connections used for customer chats, automated
          replies, storefront widgets, and order alerts.
        </p>
      </div>

      <ChannelsSettingsForm initialSettings={settings} connections={connections} />
    </div>
  );
}
