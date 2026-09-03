import React from 'react';
import { getPlatformAuditLogsAction } from '@/app/actions/platform-audit';
import Link from 'next/link';
import { Search, Filter, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams;
  const page = typeof resolvedParams.page === 'string' ? parseInt(resolvedParams.page, 10) : 1;
  const limit = 50;
  const offset = (page - 1) * limit;
  const targetType = typeof resolvedParams.targetType === 'string' && resolvedParams.targetType !== 'all' ? resolvedParams.targetType : undefined;
  const actorEmail = typeof resolvedParams.actorEmail === 'string' ? resolvedParams.actorEmail : undefined;

  const { logs, error, count } = await getPlatformAuditLogsAction({ limit, offset, targetType, actorEmail });

  const totalPages = count ? Math.ceil(count / limit) : 1;
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const buildQueryString = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    if (actorEmail) params.set('actorEmail', actorEmail);
    if (targetType) params.set('targetType', targetType);
    params.set('page', page.toString());
    
    Object.entries(overrides).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    
    return params.toString();
  };

  return (
    <div className="flex flex-col animate-fadeIn max-w-7xl mx-auto w-full space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
          <p className="text-sm text-muted">Immutable record of platform administration actions.</p>
        </div>
      </div>

      {/* Filters Form */}
      <div className="bg-surface rounded-2xl border border-separator p-4 shadow-xs">
        <form className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 min-w-[200px] space-y-1">
            <label htmlFor="actorEmail" className="text-xs font-semibold text-muted">Staff Email</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input 
                id="actorEmail"
                name="actorEmail"
                type="text" 
                defaultValue={actorEmail || ''}
                placeholder="Search by email..."
                className="w-full pl-9 pr-3 py-2 bg-background border border-separator rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
              />
            </div>
          </div>
          
          <div className="flex-1 min-w-[200px] space-y-1">
            <label htmlFor="targetType" className="text-xs font-semibold text-muted">Target Area</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <select 
                id="targetType"
                name="targetType"
                defaultValue={targetType || 'all'}
                className="w-full pl-9 pr-3 py-2 bg-background border border-separator rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all appearance-none"
              >
                <option value="all">All Targets</option>
                <option value="tenant">Merchant (Tenant)</option>
                <option value="subscription">Subscription</option>
                <option value="plan">Platform Plan</option>
                <option value="support_ticket">Support Ticket</option>
                <option value="security_event">Security Event</option>
                <option value="system_config">System Config</option>
              </select>
            </div>
          </div>

          <button type="submit" className="px-4 py-2 bg-brand-primary text-brand-primary-foreground text-sm font-semibold rounded-lg hover:bg-brand-primary/90 transition-colors shadow-sm">
            Apply Filters
          </button>
          
          {(actorEmail || targetType) && (
            <Link 
              href="/platform/audit-logs"
              className="px-4 py-2 bg-surface text-foreground text-sm font-semibold border border-separator rounded-lg hover:bg-surface-elevated transition-colors"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-destructive">Failed to load audit logs</h3>
            <p className="text-sm text-destructive/80 mt-1">{error}</p>
          </div>
        </div>
      )}

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
              {(logs || []).length === 0 && !error ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted font-sans">
                    No audit logs match your filters.
                  </td>
                </tr>
              ) : (
                logs?.map((log) => (
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
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-separator flex items-center justify-between bg-surface">
            <div className="text-xs text-muted font-sans">
              Showing <span className="font-semibold text-foreground">{offset + 1}</span> to <span className="font-semibold text-foreground">{Math.min(offset + limit, count || 0)}</span> of <span className="font-semibold text-foreground">{count}</span> logs
            </div>
            <div className="flex gap-2">
              <Link
                href={hasPrevPage ? `?${buildQueryString({ page: (page - 1).toString() })}` : '#'}
                className={`p-1.5 rounded-md border ${hasPrevPage ? 'border-separator bg-background text-foreground hover:bg-surface-elevated' : 'border-transparent text-muted cursor-not-allowed'} transition-colors`}
                aria-disabled={!hasPrevPage}
              >
                <ChevronLeft className="w-4 h-4" />
              </Link>
              <Link
                href={hasNextPage ? `?${buildQueryString({ page: (page + 1).toString() })}` : '#'}
                className={`p-1.5 rounded-md border ${hasNextPage ? 'border-separator bg-background text-foreground hover:bg-surface-elevated' : 'border-transparent text-muted cursor-not-allowed'} transition-colors`}
                aria-disabled={!hasNextPage}
              >
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
