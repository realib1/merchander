import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getUnifiedBusinessProfile } from '@/app/actions/settings-business';
import { BusinessForm } from './components/BusinessForm';

export const metadata: Metadata = {
  title: 'Business Profile | Merchander',
  description: 'Manage your brand identity, contact details, and information used by Intelligence.',
};

export default async function BusinessProfileSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const profileData = await getUnifiedBusinessProfile();

  return (
    <div className="max-w-4xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">Business Profile</h1>
        <p className="text-sm text-muted mt-1">
          Manage your core brand identity, operating contact details, and information used by Intelligence.
        </p>
      </div>

      <BusinessForm initialData={profileData} />
    </div>
  );
}
