import React from 'react';
import { getDomainInfrastructureAction } from '@/app/actions/platform';
import { Info } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DomainsPage() {
  const { domains, error } = await getDomainInfrastructureAction();

  return (
    <div className="flex flex-col animate-fadeIn max-w-7xl mx-auto w-full space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-xs">
          Failed to load domain records: {error}
        </div>
      )}

      <div className="p-4 rounded-xl bg-surface-elevated border border-separator text-xs text-muted leading-relaxed flex gap-3">
        <Info size={15} className="shrink-0 mt-0.5" />
        <span>
          This lists the hostnames merchants have configured. DNS resolution and TLS certificate
          state are <span className="font-semibold text-foreground">not yet monitored</span> — no
          probe runs against these domains, so nothing here reflects whether they currently serve
          traffic.
        </span>
      </div>

      <div className="bg-surface rounded-2xl border border-separator overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-elevated text-muted font-mono uppercase text-[10px] border-b border-separator">
              <tr>
                <th className="py-3 px-4">Merchant Store</th>
                <th className="py-3 px-4">Configured Hostname</th>
                <th className="py-3 px-4 text-right">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-separator/60 font-mono">
              {(domains || []).length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-muted font-sans">
                    No domains configured yet.
                  </td>
                </tr>
              ) : (
                domains.map((d) => (
                  <tr key={d.id} className="hover:bg-surface-elevated/50 transition-colors">
                    <td className="py-3 px-4 font-sans font-bold text-foreground">{d.tenantName}</td>
                    <td className="py-3 px-4 text-foreground font-semibold">{d.domain}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2 py-0.5 rounded bg-surface-elevated border border-separator text-[10px] uppercase">
                        {d.type}
                      </span>
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
