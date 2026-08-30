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
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Conversations</h1>
        <p className="text-sm text-secondary mt-1">Manage how incoming customer chats are assigned and handled.</p>
      </div>

      <ConversationsSettingsForm initialSettings={settings} />
    </div>
  );
}
