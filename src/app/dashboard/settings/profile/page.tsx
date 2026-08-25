import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProfileForm } from './components/ProfileForm';

export default async function ProfileSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const firstName = user.user_metadata?.first_name || '';
  const lastName = user.user_metadata?.last_name || '';
  const phone = user.user_metadata?.phone || '';

  // Use first initial of first and last name for avatar fallback, or email initial
  const initials =
    firstName && lastName ? `${firstName[0]}${lastName[0]}`.toUpperCase() : user.email?.[0]?.toUpperCase() || 'U';

  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Profile Settings</h1>
        <p className="text-sm text-secondary mt-1">Manage your personal information and preferences.</p>
      </div>

      <Card>
        <ProfileForm
          initials={initials}
          firstName={firstName}
          lastName={lastName}
          email={user.email || ''}
          phone={phone}
        />
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Manage your regional and language settings.</CardDescription>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="language" className="text-xs font-semibold text-primary">
                Language
              </label>
              <select
                id="language"
                defaultValue="English (US)"
                className="w-full rounded-md border border-separator bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="English (US)">English (US)</option>
                <option value="French (FR)">French (FR)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="timezone" className="text-xs font-semibold text-primary">
                Timezone
              </label>
              <select
                id="timezone"
                defaultValue="GMT (Greenwich Mean Time)"
                className="w-full rounded-md border border-separator bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="GMT (Greenwich Mean Time)">GMT (Greenwich Mean Time)</option>
                <option value="EST (Eastern Standard Time)">EST (Eastern Standard Time)</option>
                <option value="PST (Pacific Standard Time)">PST (Pacific Standard Time)</option>
              </select>
            </div>
          </div>
        </CardBody>
        <CardFooter className="justify-end">
          <Button variant="outline" size="sm" disabled>
            Save Preferences
            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-surface-elevated text-muted">Coming Soon</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
