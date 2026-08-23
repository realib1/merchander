import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { MobileNavProvider } from './components/MobileNavContext';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Protect the dashboard - redirect to login if not authenticated
  if (!user) {
    redirect('/login'); 
  }

  return (
    <MobileNavProvider>
      <div className="flex h-screen bg-background text-text-primary overflow-hidden pb-12">
        <Sidebar userEmail={user.email || ''} />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-background relative z-10 transition-all overflow-hidden">
          <Topbar />
          
          <div className="flex-1 overflow-auto p-4 md:p-8 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </MobileNavProvider>
  );
}
