import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { MobileNavProvider } from './components/MobileNavContext';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect the dashboard - redirect to login if not authenticated
  if (!user) {
    redirect('/login');
  }

  // Fetch tenant name for sidebar display
  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('tenants(name)')
    .eq('user_id', user.id)
    .single();

  const tenantData = tenantUser?.tenants as unknown as { name: string } | null;
  const businessName = tenantData?.name || 'My Business';

  return (
    <MobileNavProvider>
      <div className="flex h-screen bg-background  overflow-hidden">
        <Sidebar userEmail={user.email || ''} businessName={businessName} />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-background relative z-10 transition-all overflow-hidden">
          <Topbar />

          <div className="flex-1 overflow-auto p-4 md:p-8 pb-20 md:pb-24 max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </MobileNavProvider>
  );
}
