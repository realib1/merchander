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

  if (staff.mfa_enabled) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel !== 'aal2') {
      return (
        <div className="flex h-screen items-center justify-center bg-background text-foreground">
          <div className="max-w-md w-full p-8 bg-surface border border-separator rounded-3xl shadow-xl text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center mx-auto mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <h1 className="text-2xl font-bold font-display text-foreground">Authentication Incomplete</h1>
            <p className="text-sm text-muted mb-6">
              Platform administration requires Multi-Factor Authentication. Please complete your secondary verification to continue.
            </p>
          </div>
        </div>
      );
    }
  }

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
