import { redirect } from 'next/navigation';

export default function StoreSettingsRedirectPage() {
  redirect('/dashboard/settings/business-profile');
}
