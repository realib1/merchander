import { Metadata } from 'next';
import { getConversationSettings } from '@/app/actions/settings-social';
import { ConversationsSettingsForm } from './components/ConversationsSettingsForm';

export const metadata: Metadata = {
  title: 'Conversations Settings | Merchander',
  description: 'Manage chat assignment, sticky agent routing, and SLA targets.',
};

export default async function ConversationsSettingsPage() {
  const settings = await getConversationSettings();

  return (
    <div className="max-w-4xl space-y-6 sm:space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-display">
          Conversations Settings
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1">
          Manage how incoming customer chats are assigned, routed, and handled by your staff.
        </p>
      </div>

      <ConversationsSettingsForm initialSettings={settings} />
    </div>
  );
}
