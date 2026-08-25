import { redirect } from 'next/navigation';

export default function BusinessHoursRedirectPage() {
  redirect('/dashboard/settings/hours');
}
