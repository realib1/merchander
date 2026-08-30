import { Metadata } from 'next';
import { getAutomationSettings } from '@/app/actions/settings-social';
import { AutomationSettingsForm } from './components/AutomationSettingsForm';

export const metadata: Metadata = {
  title: 'Automation & Bots | Merchander',
  description: 'Configure automated WhatsApp greetings, keyword auto-responders, and anti-ban safeguards.',
};

export default async function AutomationSettingsPage() {
  const settings = await getAutomationSettings();

  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Automation & Bots</h1>
        <p className="text-sm text-secondary mt-1">Configure automated replies, greeting messages, and AI responses.</p>
      </div>

      <AutomationSettingsForm initialSettings={settings} />
    </div>
  );
}
