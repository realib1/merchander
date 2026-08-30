import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getNotificationSettings } from '@/app/actions/settings-business';
import { NotificationsForm } from './components/NotificationsForm';

export const metadata: Metadata = {
  title: 'Notifications Settings | Merchander',
  description: 'Configure automated store notifications and alert channels.',
};

export default async function NotificationsSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const settings = await getNotificationSettings();

  return (
    <div className="max-w-3xl space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">Notifications</h1>
        <p className="text-sm text-muted mt-1">Configure high-priority alerts and dispatch channels.</p>
      </div>

      <NotificationsForm initialSettings={settings} userEmail={user.email || ''} />
    </div>
  );
}
