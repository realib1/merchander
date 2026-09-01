import { createClient } from '@/lib/supabase/server';
import { CreditCard, DollarSign, TrendingUp, Receipt, Building2, BadgeCheck } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Platform Billing & MRR | Superadmin',
};

interface GlobalInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  amount: number;
  currency: string;
  status: string;
  planName: string;
  tenantId: string;
  tenantName: string;
}

export default async function SuperadminBillingPage() {
  const supabase = await createClient();

  const [{ data: tenants }, { data: settings }] = await Promise.all([
    supabase.from('tenants').select('id, name, created_at').order('created_at', { ascending: false }),
    supabase.from('tenant_settings').select('tenant_id, store_email, settings_data'),
  ]);

  const tenantMap = new Map((tenants || []).map((t) => [t.id, t.name]));
  const allInvoices: GlobalInvoice[] = [];

  const tenantBillingList = (settings || []).map((s) => {
    const tenantName = tenantMap.get(s.tenant_id) || 'Unknown Store';
    const sub = (s.settings_data as Record<string, unknown> | null)?.subscription as
      Record<string, unknown> | undefined;
    const tier = (sub?.tier as string) || 'starter';
    const cycle = (sub?.billingCycle as string) || 'monthly';
    const status = (sub?.status as string) || 'active';
    const renewalDate = (sub?.renewalDate as string) || 'Continuous Free Access';
    const paymentMethod = sub?.paymentMethod as
      { type?: string; identifier?: string; isVerified?: boolean } | undefined;
    const monthlyAmount = tier === 'enterprise' ? 750 : tier === 'pro' ? 250 : 0;

    if (Array.isArray(sub?.invoices)) {
      sub.invoices.forEach((inv: Record<string, unknown>) => {
        allInvoices.push({
          id: String(inv.id || Math.random()),
          invoiceNumber: String(inv.invoiceNumber || 'INV-DRAFT'),
          date: String(inv.date || new Date().toISOString().split('T')[0]),
          amount: Number(inv.amount || 0),
          currency: String(inv.currency || 'GHS'),
          status: String(inv.status || 'paid'),
          planName: String(inv.planName || `${tier} (${cycle})`),
          tenantId: s.tenant_id,
          tenantName,
        });
      });
    }

    return {
      tenantId: s.tenant_id,
      tenantName,
      email: s.store_email || 'No email',
      tier,
      cycle,
      status,
      renewalDate,
      monthlyAmount,
      paymentMethod,
    };
  });

  const totalMrr = tenantBillingList.reduce((acc, curr) => {
    return curr.status === 'active' ? acc + curr.monthlyAmount : acc;
  }, 0);

  const activePaidSubs = tenantBillingList.filter((t) => t.status === 'active' && t.monthlyAmount > 0).length;

  const arr = totalMrr * 12;

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-slate-800 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 mb-1">
            <Link href="/superadmin" className="hover:underline">
              Superadmin
            </Link>
            <span>/</span>
            <span>Platform Billing</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Platform Subscriptions & MRR</h1>
          <p className="text-slate-400 mt-1">Live recurring revenue and SaaS subscription management.</p>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Platform MRR</p>
            <p className="text-2xl font-bold text-white mt-0.5">GH₵ {totalMrr.toLocaleString()}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Across {activePaidSubs} active paid merchants</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Projected ARR</p>
            <p className="text-2xl font-bold text-white mt-0.5">GH₵ {arr.toLocaleString()}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Annualized recurring run rate</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400">
            <Receipt size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Total Invoices</p>
            <p className="text-2xl font-bold text-white mt-0.5">{allInvoices.length}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Processed via Paystack & MoMo</p>
          </div>
        </div>
      </div>

      {/* Tenant Subscriptions Matrix */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm">
        <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-blue-400" />
            <h2 className="text-sm font-bold text-white font-display">Tenant Subscription Ledger</h2>
          </div>
          <span className="text-xs text-slate-400">{tenantBillingList.length} total stores</span>
        </div>

        <div className="grid grid-cols-12 gap-4 p-3.5 font-semibold text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700/50 bg-slate-900/50">
          <div className="col-span-4">Merchant Store</div>
          <div className="col-span-2">Current Tier</div>
          <div className="col-span-2">Monthly Dues</div>
          <div className="col-span-2">Billing Method</div>
          <div className="col-span-2 text-right">Renewal Date</div>
        </div>

        <div className="divide-y divide-slate-700/50">
          {tenantBillingList.map((t) => (
            <div
              key={t.tenantId}
              className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-800/80 transition-colors"
            >
              <div className="col-span-4 flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-300 shrink-0">
                  <Building2 size={16} />
                </div>
                <div className="min-w-0 truncate">
                  <div className="font-semibold text-slate-100 truncate text-xs">{t.tenantName}</div>
                  <div className="text-[11px] text-slate-500 font-mono truncate">{t.email}</div>
                </div>
              </div>

              <div className="col-span-2">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold capitalize ${
                    t.tier === 'enterprise'
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      : t.tier === 'pro'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'bg-slate-700/50 text-slate-300 border border-slate-600/50'
                  }`}
                >
                  {t.tier} ({t.cycle})
                </span>
              </div>

              <div className="col-span-2 text-xs font-mono font-bold text-slate-200">
                {t.monthlyAmount > 0 ? `GH₵ ${t.monthlyAmount}/mo` : 'Free'}
              </div>

              <div className="col-span-2 flex items-center gap-1.5 text-xs text-slate-300">
                {t.paymentMethod ? (
                  <>
                    <span className="capitalize">{t.paymentMethod.type?.replace('_', ' ')}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{t.paymentMethod.identifier}</span>
                    {t.paymentMethod.isVerified && <BadgeCheck size={13} className="text-emerald-400" />}
                  </>
                ) : (
                  <span className="text-slate-500 text-[11px]">No method attached</span>
                )}
              </div>

              <div className="col-span-2 text-right text-xs text-slate-400 font-mono">{t.renewalDate}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
