import Link from 'next/link';
import { ShieldAlert, Users, CreditCard, Database } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  const isSuperadmin = user.app_metadata?.is_superadmin === true;

  if (!isSuperadmin) {
    redirect('/dashboard');
  }

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2 text-2xl font-bold text-red-500">
            <ShieldAlert size={24} />
            God Mode
          </div>
          <div className="text-xs text-slate-500 font-medium tracking-wider mt-1">PLATFORM ADMIN</div>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          <Link
            href="/superadmin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors font-medium"
          >
            <Users size={20} />
            Tenants
          </Link>
          <Link
            href="/superadmin/billing"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors font-medium mt-1"
          >
            <CreditCard size={20} />
            Billing & MRR
          </Link>
          <Link
            href="/superadmin/infrastructure"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors font-medium mt-1"
          >
            <Database size={20} />
            Infrastructure
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="px-3 py-2 text-sm text-slate-400 truncate">{user.email}</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-slate-900 relative">
        <div className="p-8 max-w-7xl mx-auto h-full">{children}</div>
      </main>
    </div>
  );
}
