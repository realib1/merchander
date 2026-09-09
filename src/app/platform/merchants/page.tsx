import React from 'react';
import { getPlatformOverviewData, getPlatformPlansAction } from '@/app/actions/platform';
import { MerchantsClient } from './components/MerchantsClient';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPlatformStaffRecord } from '@/lib/auth/platform-staff';
import { PlatformRole } from '@/types/platform';

export const dynamic = 'force-dynamic';

export default async function MerchantsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let currentRole: PlatformRole = 'operations';
  if (user) {
    const staff = await getPlatformStaffRecord(createAdminClient(), user.id);
    if (staff) {
      currentRole = staff.role;
    }
  }

  const [{ tenants, error }, { plans }] = await Promise.all([
    getPlatformOverviewData(),
    getPlatformPlansAction(),
  ]);

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive">
        Failed to load merchants: {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col animate-fadeIn max-w-7xl mx-auto w-full space-y-6">
      <MerchantsClient initialTenants={tenants} plans={plans} currentRole={currentRole} />
    </div>
  );
}
