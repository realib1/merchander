import React from 'react';
import { getSuperadminSupportInbox } from '@/app/actions/support';
import { SuperadminSupportInbox } from './components/SuperadminSupportInbox';
import { LifeBuoy } from 'lucide-react';

export const metadata = {
  title: 'Merchant Support Inbox | Superadmin',
  description: 'Manage merchant tickets, system diagnostics, escalations, and incident broadcasts.',
};

export default async function SuperadminSupportPage() {
  const { tickets = [] } = await getSuperadminSupportInbox();

  const openCount = tickets.filter((t) => t.status === 'open').length;
  const inProgressCount = tickets.filter((t) => t.status === 'in_progress').length;
  const urgentCount = tickets.filter((t) => t.priority === 'urgent' || t.is_escalated).length;

  return (
    <div className="space-y-6 animate-fadeIn max-w-7xl mx-auto w-full pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-separator pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-brand-primary/10 text-brand-primary">
              <LifeBuoy size={18} />
            </div>
            <h1 className="text-xl font-bold font-display text-foreground tracking-tight">
              Merchant Support & Diagnostics Desk
            </h1>
          </div>
          <p className="text-xs text-muted">
            Receive, investigate, and resolve merchant inquiries with automated system context and internal notes.
          </p>
        </div>

        {/* Quick KPI badges */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-surface border border-separator text-center min-w-20">
            <span className="text-[10px] font-semibold text-muted uppercase block">Open</span>
            <span className="text-xs font-bold font-mono text-brand-primary">{openCount}</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-surface border border-separator text-center min-w-20">
            <span className="text-[10px] font-semibold text-muted uppercase block">In Progress</span>
            <span className="text-xs font-bold font-mono text-amber-500">{inProgressCount}</span>
          </div>

          {urgentCount > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-surface border border-destructive/30 text-center min-w-20">
              <span className="text-[10px] font-semibold text-destructive uppercase block">Urgent</span>
              <span className="text-xs font-bold font-mono text-destructive">{urgentCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Support Desk */}
      <SuperadminSupportInbox initialTickets={tickets} />
    </div>
  );
}
