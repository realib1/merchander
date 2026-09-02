import React from 'react';
import { getDomainInfrastructureAction } from '@/app/actions/platform';
import { CheckCircle2, Lock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DomainsPage() {
  const { domains } = await getDomainInfrastructureAction();

  return (
    <div className="flex flex-col animate-fadeIn max-w-7xl mx-auto w-full space-y-6">
      <div className="bg-surface rounded-2xl border border-separator overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-elevated text-muted font-mono uppercase text-[10px] border-b border-separator">
              <tr>
                <th className="py-3 px-4">Merchant Store</th>
                <th className="py-3 px-4">Routing Hostname</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">DNS Status</th>
                <th className="py-3 px-4">SSL Cert</th>
                <th className="py-3 px-4 text-right">Last Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-separator/60 font-mono">
              {(domains || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted">
                    No domain records found.
                  </td>
                </tr>
              ) : (
                domains.map((d) => (
                  <tr key={d.id} className="hover:bg-surface-elevated/50 transition-colors">
                    <td className="py-3 px-4 font-sans font-bold text-foreground">
                      {d.tenantName}
                    </td>
                    <td className="py-3 px-4 text-foreground font-semibold">
                      {d.domain}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-surface-elevated border border-separator text-[10px] uppercase">
                        {d.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 font-semibold ${d.dnsStatus === 'verified' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {d.dnsStatus === 'verified' && <CheckCircle2 size={12} />}
                        {d.dnsStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 font-semibold ${d.sslStatus === 'active' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {d.sslStatus === 'active' && <Lock size={12} />}
                        {d.sslStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-muted text-[11px]">
                      {new Date(d.lastVerifiedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
