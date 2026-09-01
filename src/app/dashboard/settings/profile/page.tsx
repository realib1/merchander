import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProfileForm } from './components/ProfileForm';
import { Card } from '@/components/ui/Card';

export const metadata = {
  title: 'Profile Settings | Merchander',
  description: 'Manage your personal profile and account credentials.',
};

export default async function ProfileSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let firstName = user.user_metadata?.first_name || '';
  let lastName = user.user_metadata?.last_name || '';
  const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
  if ((!firstName || !lastName) && fullName) {
    const parts = fullName.split(' ');
    firstName = firstName || parts[0] || '';
    lastName = lastName || parts.slice(1).join(' ') || '';
  }
  const phone = user.user_metadata?.phone || '';

  // Guard against any legacy base64 data URLs in avatar_url to prevent HTTP 431
  let avatarUrl = user.user_metadata?.avatar_url || null;
  if (avatarUrl && avatarUrl.startsWith('data:')) {
    avatarUrl = null;
  }

  // Use first initial of first and last name for avatar fallback, or email initial
  const initials =
    firstName && lastName
      ? `${firstName[0]}${lastName[0]}`.toUpperCase()
      : firstName
        ? firstName[0].toUpperCase()
        : user.email?.[0]?.toUpperCase() || 'U';

  const language = user.user_metadata?.language || 'en';
  const timezone = user.user_metadata?.timezone || 'Africa/Accra';

  return (
    <div className="max-w-4xl space-y-6 sm:space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-display">Profile Settings</h1>
        <p className="text-xs sm:text-sm text-muted mt-1">
          Manage your personal information, language preferences, and contact details.
        </p>
      </div>

      {/* Profile Form Card */}
      <Card className="shadow-xs">
        <ProfileForm
          initials={initials}
          firstName={firstName}
          lastName={lastName}
          email={user.email || ''}
          phone={phone}
          avatarUrl={avatarUrl}
          language={language}
          timezone={timezone}
        />
      </Card>
    </div>
  );
}
