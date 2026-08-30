import { redirect } from 'next/navigation';

export default function CheckoutSettingsPage() {
  redirect('/dashboard/settings/orders');
}
