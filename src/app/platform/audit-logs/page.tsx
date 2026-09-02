import React from 'react';
import { getPlatformAuditLogsAction } from '@/app/actions/platform-audit';

export const dynamic = 'force-dynamic';

export default async function AuditLogsPage() {
  const { logs } = await getPlatformAuditLogsAction({ limit: 100 });

  return (
    <div className="flex flex-col animate-fadeIn max-w-7xl mx-auto w-full space-y-6">
      {/* Logs Table */}
      <div className="bg-surface rounded-2xl border border-separator overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-surface-elevated text-muted uppercase text-[10px] border-b border-separator">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Staff Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target</th>
                <th className="py-3 px-4">Reason / Stated Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-separator/60">
              {(logs || []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted font-sans">
                    No audit logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-elevated/50 transition-colors">
                    <td className="py-3 px-4 text-muted text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-foreground font-semibold">
                      <div>{log.actor_email}</div>
                      <div className="text-[10px] text-brand-primary uppercase font-bold">
                        {log.actor_role}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-[10px] font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-foreground font-semibold">
                      <div>{log.target_name || log.target_id}</div>
                      <div className="text-[10px] text-muted uppercase">{log.target_type}</div>
                    </td>
                    <td className="py-3 px-4 text-secondary font-sans text-xs">
                      {log.reason || 'Routine operation'}
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
