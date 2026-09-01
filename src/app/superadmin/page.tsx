import { createClient } from '@/lib/supabase/server';
import { Building2, Store, Calendar, Activity, DollarSign, Zap, Crown } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Platform Admin | Merchander',
};

export default async function SuperadminPage() {
  const supabase = await createClient();

  // Fetch all tenants with stores and settings
  const [{ data: tenants, error: tenantErr }, { data: settings }] = await Promise.all([
    supabase.from('tenants').select('*, stores(id, name)').order('created_at', { ascending: false }),
    supabase.from('tenant_settings').select('tenant_id, settings_data'),
  ]);

  if (tenantErr) {
    console.error('Error fetching tenants for superadmin:', tenantErr);
  }

  // Create a fast map of tenant subscription data
  const subscriptionMap = new Map<string, { tier: string; cycle: string; status: string; price: number }>();
  let totalMrr = 0;
  let starterCount = 0;
  let proCount = 0;
  let enterpriseCount = 0;

  settings?.forEach((s) => {
    const sub = (s.settings_data as Record<string, unknown> | null)?.subscription as
      Record<string, unknown> | undefined;
    const tier = (sub?.tier as string) || 'starter';
    const cycle = (sub?.billingCycle as string) || 'monthly';
    const status = (sub?.status as string) || 'active';

    const price = tier === 'enterprise' ? 750 : tier === 'pro' ? 250 : 0;
    if (status === 'active') {
      totalMrr += price;
    }

    if (tier === 'enterprise') enterpriseCount++;
    else if (tier === 'pro') proCount++;
    else starterCount++;

    subscriptionMap.set(s.tenant_id, { tier, cycle, status, price });
  });

  return (
    <div className="h-full flex flex-col space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-slate-800 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Platform Tenants & Overview</h1>
          <p className="text-slate-400 mt-1">Global merchant accounts and recurring SaaS subscriptions.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3.5 flex items-center gap-3">
            <div className="bg-emerald-500/20 text-emerald-400 p-2 rounded-lg">
              <DollarSign size={20} />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-semibold tracking-wider">PLATFORM MRR</div>
              <div className="text-xl font-bold text-white">GH₵ {totalMrr.toLocaleString()}</div>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3.5 flex items-center gap-3">
            <div className="bg-blue-500/20 text-blue-400 p-2 rounded-lg">
              <Building2 size={20} />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-semibold tracking-wider">TOTAL TENANTS</div>
              <div className="text-xl font-bold text-white">{tenants?.length || 0}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Plan Distribution Metric Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Starter (Free)</p>
            <p className="text-lg font-bold text-slate-200 mt-0.5">{starterCount} merchants</p>
          </div>
          <span className="text-xs text-slate-500 font-mono">GH₵ 0/mo</span>
        </div>

        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-blue-400 text-xs font-semibold">
              <Zap size={14} />
              <span>Pro Plan</span>
            </div>
            <p className="text-lg font-bold text-white mt-0.5">{proCount} merchants</p>
          </div>
          <span className="text-xs text-blue-300 font-mono">GH₵ 250/mo</span>
        </div>

        <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-purple-400 text-xs font-semibold">
              <Crown size={14} />
              <span>Enterprise</span>
            </div>
            <p className="text-lg font-bold text-white mt-0.5">{enterpriseCount} merchants</p>
          </div>
          <span className="text-xs text-purple-300 font-mono">GH₵ 750/mo</span>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm">
        <div className="grid grid-cols-12 gap-4 p-4 font-semibold text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700/50 bg-slate-900/50">
          <div className="col-span-4">Tenant Name</div>
          <div className="col-span-2">Active Plan</div>
          <div className="col-span-2">Branches</div>
          <div className="col-span-2">Created</div>
          <div className="col-span-2 text-right">Actions / Status</div>
        </div>

        <div className="divide-y divide-slate-700/50">
          {tenants?.map((tenant) => {
            const storeCount = tenant.stores?.length || 0;
            const sub = subscriptionMap.get(tenant.id) || {
              tier: 'starter',
              cycle: 'monthly',
              status: 'active',
              price: 0,
            };
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
                <div className="col-span-4 flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-300 group-hover:border-blue-500 group-hover:text-blue-400 transition-colors shrink-0 shadow-inner">
                    <Building2 size={20} />
                  </div>
                  <div className="min-w-0 truncate">
                    <div className="font-semibold text-slate-100 truncate">{tenant.name}</div>
                    <div className="text-xs text-slate-500 font-mono truncate">{tenant.id}</div>
                  </div>
                </div>

                <div className="col-span-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold capitalize ${
                      sub.tier === 'enterprise'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : sub.tier === 'pro'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-slate-700/50 text-slate-300 border border-slate-600/50'
                    }`}
                  >
                    {sub.tier}
                  </span>
                </div>

                <div className="col-span-2 flex items-center gap-2 text-xs text-slate-300">
                  <Store size={14} className="text-slate-500" />
                  {storeCount} {storeCount === 1 ? 'branch' : 'branches'}
                </div>

                <div className="col-span-2 flex items-center gap-1.5 text-xs text-slate-400">
                  <Calendar size={13} />
                  {date}
                </div>

                <div className="col-span-2 flex items-center justify-end gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Activity size={11} />
                    Active
                  </span>
                  <Link
                    href="/superadmin/billing"
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium ml-2"
                  >
                    Billing
                  </Link>
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
