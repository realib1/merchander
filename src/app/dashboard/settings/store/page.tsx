import { createClient } from '@/lib/supabase/server';
import { getTenantInfo, getTenantSettings } from '@/lib/supabase/queries';
import { redirect } from 'next/navigation';
import { StoreForm } from './components/StoreForm';
import { Card } from '@/components/ui/Card';

export default async function StoreSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let tenantSettings = null;

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);
    tenantSettings = await getTenantSettings(supabase, tenantId, 'store_email, store_currency');
  } catch (error) {
    console.error('Error fetching store settings:', error);
  }

  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Store Settings</h1>
        <p className="text-sm text-secondary mt-1">Customize how your store appears to customers on the storefront.</p>
      </div>

      <Card>
        <StoreForm
          initialEmail={tenantSettings?.store_email ?? null}
          initialCurrency={tenantSettings?.store_currency || 'GHS'}
        />
      </Card>
    </div>
  );
}
