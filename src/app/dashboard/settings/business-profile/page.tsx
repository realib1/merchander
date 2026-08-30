import { createClient } from '@/lib/supabase/server';
import { getTenantInfo, getTenantSettings } from '@/lib/supabase/queries';
import { redirect } from 'next/navigation';
import { BusinessForm } from './components/BusinessForm';

export default async function BusinessProfileSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let tenantName = '';
  let tenantSettings = null;

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);

    const { data: tenant } = await supabase.from('tenants').select('name').eq('id', tenantId).single();
    if (tenant) {
      tenantName = tenant.name;
    }

    tenantSettings = await getTenantSettings(
      supabase,
      tenantId,
      'trading_name, industry, tax_id, store_email, store_currency, brand_primary_color, brand_secondary_color, business_street, business_city, business_state, business_zip, business_country'
    );
  } catch (error) {
    console.error('Error fetching tenant business settings:', error);
  }

  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">Business Profile</h1>
        <p className="text-sm text-muted mt-1">
          Manage your company&apos;s legal information, brand identity, and contact details.
        </p>
      </div>

      <div className="space-y-8">
        <BusinessForm
          initialTenantName={tenantName}
          initialTradingName={tenantSettings?.trading_name ?? null}
          initialIndustry={tenantSettings?.industry ?? null}
          initialTaxId={tenantSettings?.tax_id ?? null}
          initialStoreEmail={tenantSettings?.store_email ?? null}
          initialStoreCurrency={tenantSettings?.store_currency || 'GHS'}
          initialBrandColor={tenantSettings?.brand_primary_color ?? null}
          initialBrandSecondaryColor={tenantSettings?.brand_secondary_color ?? null}
          initialStreet={tenantSettings?.business_street ?? null}
          initialCity={tenantSettings?.business_city ?? null}
          initialState={tenantSettings?.business_state ?? null}
          initialZip={tenantSettings?.business_zip ?? null}
          initialCountry={tenantSettings?.business_country ?? null}
        />
      </div>
    </div>
  );
}
