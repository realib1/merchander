import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Building2, MapPin } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { BusinessForm } from './components/BusinessForm';
import { redirect } from 'next/navigation';

export default async function BusinessProfileSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Fetch tenant info
  const { data: tenantUsers } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  let tenantName = '';
  if (tenantUsers?.tenant_id) {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', tenantUsers.tenant_id)
      .single();
    if (tenant) {
      tenantName = tenant.name;
    }
  }

  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Business Profile</h1>
        <p className="text-sm text-secondary mt-1">
          Manage your company&apos;s legal information and contact details.
        </p>
      </div>

      <Card>
        <BusinessForm initialTenantName={tenantName} />
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Business Address</CardTitle>
              <CardDescription>Your primary operating location.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <FormField label="Street Address" defaultValue="14 Independence Avenue" />
          <FormField label="Apartment, suite, etc." hint="Optional" />
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <FormField label="City" defaultValue="Accra" />
            <FormField label="State / Region" defaultValue="Greater Accra" />
            <FormField label="ZIP / Postal Code" defaultValue="00233" />
          </div>
          
          <div className="space-y-1.5">
            <label htmlFor="country" className="text-sm font-medium text-primary">Country</label>
            <select id="country" className="w-full rounded-md border border-separator bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary">
              <option>Ghana</option>
              <option>Nigeria</option>
              <option>Kenya</option>
              <option>South Africa</option>
            </select>
          </div>
        </CardBody>
        <CardFooter className="justify-end border-t border-separator/50 mt-4 pt-6">
          <Button variant="primary">Save Address</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
