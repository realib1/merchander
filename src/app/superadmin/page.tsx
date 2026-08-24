import { createClient } from '@/lib/supabase/server';
import { Building2, Store, Calendar, Activity } from 'lucide-react';

export const metadata = {
  title: 'Platform Admin | Merchander',
};

export default async function SuperadminPage() {
  const supabase = await createClient();

  // Fetch all tenants with their stores
  // RLS is bypassed because the auth user has is_superadmin claim
  const { data: tenants, error } = await supabase
    .from('tenants')
    .select(
      `
      *,
      stores(id, name)
    `
    )
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tenants for superadmin:', error);
  }

  return (
    <div className="h-full flex flex-col">
      <header className="mb-8 flex justify-between items-end border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Platform Tenants</h1>
          <p className="text-slate-400 mt-1">Manage all registered merchant accounts.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-slate-800 rounded-lg p-3 flex items-center gap-3">
            <div className="bg-blue-500/20 p-2 rounded-md">
              <Building2 className="text-blue-400" size={20} />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium tracking-wide">TOTAL TENANTS</div>
              <div className="text-xl font-bold text-white">{tenants?.length || 0}</div>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm">
        <div className="grid grid-cols-12 gap-4 p-4 font-semibold text-slate-400 text-sm border-b border-slate-700/50 bg-slate-900/50">
          <div className="col-span-4">Tenant Name</div>
          <div className="col-span-3">Stores</div>
          <div className="col-span-3">Created</div>
          <div className="col-span-2 text-right">Status</div>
        </div>

        <div className="divide-y divide-slate-700/50">
          {tenants?.map((tenant) => {
            const storeCount = tenant.stores?.length || 0;
            const date = new Date(tenant.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });

            return (
              <div
                key={tenant.id}
                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-800/80 transition-colors group"
              >
                <div className="col-span-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-300 group-hover:border-blue-500 group-hover:text-blue-400 transition-colors shadow-inner">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-100">{tenant.name}</div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">{tenant.id}</div>
                  </div>
                </div>

                <div className="col-span-3 flex items-center gap-2 text-sm text-slate-300">
                  <Store size={16} className="text-slate-500" />
                  {storeCount} {storeCount === 1 ? 'branch' : 'branches'}
                </div>

                <div className="col-span-3 flex items-center gap-2 text-sm text-slate-400">
                  <Calendar size={14} />
                  {date}
                </div>

                <div className="col-span-2 flex justify-end">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Activity size={12} />
                    Active
                  </span>
                </div>
              </div>
            );
          })}

          {(!tenants || tenants.length === 0) && (
            <div className="p-12 text-center text-slate-500">
              <Building2 size={48} className="mx-auto mb-4 text-slate-700" />
              <p className="font-medium text-slate-300">No tenants found</p>
              <p className="text-sm mt-1">The platform is currently empty.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
