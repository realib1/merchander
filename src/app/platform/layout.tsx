import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { PlatformNav } from './components/PlatformNav';
import { PlatformTopbar } from './components/PlatformTopbar';
import { MobileNavProvider } from '@/app/dashboard/components/MobileNavContext';
import { PlatformRole } from '@/types/platform';
import { getPlatformStaffRecord } from '@/lib/auth/platform-staff';

export const dynamic = 'force-dynamic';



export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  const adminSupabase = createAdminClient();

  const staff = await getPlatformStaffRecord(adminSupabase, user.id);

  if (!staff || !staff.is_active) {
    redirect('/dashboard');
  }

  const userRole: PlatformRole = staff.role;

  let openTicketsCount = 0;
  let activeIncidentsCount = 0;

  try {
    const { data: settings } = await adminSupabase
      .from('tenant_settings')
      .select('settings_data')
      .limit(50);

    const seenIncidents = new Set<string>();

    (settings || []).forEach((s) => {
      const customData = (s.settings_data as Record<string, unknown>) || {};
      const tickets = (customData.support_tickets as Array<{ status: string }>) || [];
      tickets.forEach((t) => {
        if (t.status === 'open' || t.status === 'in_progress' || t.status === 'waiting_for_merchant') {
          openTicketsCount++;
        }
      });

      const incidents = (customData.system_incidents as Array<{ id: string; is_active: boolean }>) || [];
      incidents.forEach((inc) => {
        if (inc.is_active && !seenIncidents.has(inc.id)) {
          seenIncidents.add(inc.id);
          activeIncidentsCount++;
        }
      });
    });
  } catch (err) {
    console.error('Error loading admin badge counts:', err);
  }

  return (
    <MobileNavProvider>
      <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans antialiased">
        <PlatformNav
          userEmail={user.email}
          userRole={userRole}
          openTicketsCount={openTicketsCount}
          activeIncidentsCount={activeIncidentsCount}
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <PlatformTopbar userEmail={user.email} userRole={userRole} />

          <main className="flex-1 overflow-y-auto bg-background relative flex flex-col min-w-0">
            <div className="p-4 md:p-8 max-w-7xl mx-auto w-full flex-1 animate-fadeIn">
              {children}
            </div>
          </main>
        </div>
      </div>
    </MobileNavProvider>
  );
}
