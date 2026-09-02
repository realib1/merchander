'use client';

import React, { useState, useMemo, useTransition } from 'react';
import { SupportTicket, TicketStatus, TicketPriority } from '@/types/support';
import { updatePlatformTicket } from '@/app/actions/support';
import { Button } from '@/components/ui/Button';
import { Search, LifeBuoy, Send, Loader2, FileText, ShieldCheck, Building } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface PlatformSupportInboxProps {
  initialTickets: SupportTicket[];
}

export function PlatformSupportInbox({ initialTickets }: PlatformSupportInboxProps) {
  const [filterStatus, setFilterStatus] = useState<TicketStatus | 'all' | 'escalated'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(initialTickets[0]?.id || null);
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filteredTickets = useMemo(() => {
    return initialTickets.filter((tkt) => {
      const matchesStatus =
        filterStatus === 'all' ? true : filterStatus === 'escalated' ? tkt.is_escalated : tkt.status === filterStatus;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        tkt.reference_code.toLowerCase().includes(q) ||
        tkt.subject.toLowerCase().includes(q) ||
        tkt.store_name.toLowerCase().includes(q) ||
        tkt.user_email.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [initialTickets, filterStatus, searchQuery]);

  const selectedTicket = initialTickets.find((t) => t.id === selectedTicketId) || filteredTickets[0] || null;

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    startTransition(async () => {
      const res = await updatePlatformTicket(selectedTicket.tenant_id, selectedTicket.id, {
        replyMessage: replyText.trim(),
        isInternalNote,
        status: isInternalNote ? selectedTicket.status : 'waiting_for_merchant',
      });

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(isInternalNote ? 'Internal note added' : 'Reply sent to merchant');
        setReplyText('');
      }
    });
  };

  const handleStatusChange = (newStatus: TicketStatus) => {
    if (!selectedTicket) return;
    startTransition(async () => {
      const res = await updatePlatformTicket(selectedTicket.tenant_id, selectedTicket.id, {
        status: newStatus,
      });
      if (res.error) toast.error(res.error);
      else toast.success(`Status updated to ${newStatus}`);
    });
  };

  const handleEscalateToggle = () => {
    if (!selectedTicket) return;
    startTransition(async () => {
      const res = await updatePlatformTicket(selectedTicket.tenant_id, selectedTicket.id, {
        is_escalated: !selectedTicket.is_escalated,
      });
      if (res.error) toast.error(res.error);
      else toast.success(selectedTicket.is_escalated ? 'Escalation cleared' : 'Case escalated');
    });
  };

  const getPriorityBadge = (priority: TicketPriority) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-destructive/10 text-destructive border border-destructive/20">
            Urgent
          </span>
        );
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            High
          </span>
        );
      case 'normal':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-surface-elevated text-muted border border-separator">
            Normal
          </span>
        );
      case 'low':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-surface-elevated text-muted border border-separator">
            Low
          </span>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left List: Support Inbox */}
      <div className="lg:col-span-5 space-y-4">
        {/* Search & Tabs */}
        <div className="space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by #ticket, merchant, subject, or email..."
              className="w-full bg-surface border border-separator rounded-xl pl-9 pr-3 py-2 text-xs placeholder:text-muted outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 shadow-xs"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar text-xs">
            {(['all', 'open', 'in_progress', 'waiting_for_merchant', 'escalated', 'resolved'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition cursor-pointer capitalize ${
                  filterStatus === st
                    ? 'bg-brand-primary text-white shadow-xs'
                    : 'bg-surface border border-separator text-muted hover:text-foreground'
                }`}
              >
                {st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Tickets Feed */}
        <div className="space-y-2 max-h-160 overflow-y-auto custom-scrollbar pr-1">
          {filteredTickets.map((tkt) => {
            const isSelected = selectedTicket?.id === tkt.id;
            return (
              <button
                key={tkt.id}
                type="button"
                onClick={() => setSelectedTicketId(tkt.id)}
                className={`w-full p-3.5 rounded-xl border text-left transition cursor-pointer space-y-1.5 shadow-2xs ${
                  isSelected
                    ? 'bg-surface-elevated border-brand-primary ring-1 ring-brand-primary/50'
                    : 'bg-surface border-separator hover:border-separator/80'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-xs text-brand-primary">{tkt.reference_code}</span>
                    <span className="font-semibold text-foreground text-xs truncate max-w-32">{tkt.store_name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {tkt.is_escalated && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-destructive/10 text-destructive border border-destructive/20">
                        Escalated
                      </span>
                    )}
                    {getPriorityBadge(tkt.priority)}
                  </div>
                </div>

                <h4 className="text-xs font-bold text-foreground truncate">{tkt.subject}</h4>
                <p className="text-[11px] text-muted line-clamp-1">{tkt.messages[tkt.messages.length - 1]?.message}</p>
                <div className="flex items-center justify-between text-[10px] text-muted pt-1 border-t border-separator/40">
                  <span className="uppercase font-semibold tracking-wider">{tkt.category}</span>
                  <span>{format(new Date(tkt.updated_at), 'MMM d, h:mm a')}</span>
                </div>
              </button>
            );
          })}

          {filteredTickets.length === 0 && (
            <div className="p-8 rounded-xl border border-dashed border-separator bg-surface text-center space-y-1 text-muted">
              <LifeBuoy size={20} className="mx-auto opacity-50" />
              <p className="text-xs">No tickets match active filters.</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Ticket Inspection & Action Desk */}
      <div className="lg:col-span-7">
        {selectedTicket ? (
          <div className="rounded-2xl border border-separator bg-surface p-5 space-y-5 shadow-xs">
            {/* Ticket Header & Status Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-separator pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-sm text-foreground">{selectedTicket.reference_code}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-brand-primary/10 text-brand-primary">
                    {selectedTicket.category}
                  </span>
                  {getPriorityBadge(selectedTicket.priority)}
                  {selectedTicket.is_escalated && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-destructive/10 text-destructive border border-destructive/20">
                      Escalated
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold font-display text-foreground">{selectedTicket.subject}</h3>
                <div className="flex items-center gap-3 text-xs text-muted">
                  <span className="flex items-center gap-1 font-semibold text-foreground">
                    <Building size={12} />
                    <span>{selectedTicket.store_name}</span>
                  </span>
                  <span>•</span>
                  <span>{selectedTicket.user_email}</span>
                </div>
              </div>

              {/* Status Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={selectedTicket.status}
                  onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                  disabled={isPending}
                  className="rounded-xl border border-separator bg-surface px-3 py-1.5 text-xs font-semibold outline-none cursor-pointer"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="waiting_for_merchant">Waiting on Merchant</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>

                <Button
                  type="button"
                  variant={selectedTicket.is_escalated ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={handleEscalateToggle}
                  disabled={isPending}
                  className="text-xs cursor-pointer"
                >
                  {selectedTicket.is_escalated ? 'De-escalate' : 'Escalate'}
                </Button>
              </div>
            </div>

            {/* System Context Diagnostics Box */}
            {selectedTicket.system_context && (
              <div className="p-3.5 rounded-xl bg-surface-elevated border border-separator space-y-2 text-xs">
                <span className="font-bold text-foreground flex items-center gap-1">
                  <ShieldCheck size={13} className="text-brand-primary" />
                  <span>Captured System Context</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-muted">
                  <div>
                    <span className="block font-semibold text-foreground/80">Tenant ID:</span>
                    <span className="font-mono truncate block">{selectedTicket.tenant_id}</span>
                  </div>
                  <div>
                    <span className="block font-semibold text-foreground/80">Area / Module:</span>
                    <span>{selectedTicket.system_context.area || selectedTicket.category}</span>
                  </div>
                  <div>
                    <span className="block font-semibold text-foreground/80">Page URL:</span>
                    <span className="truncate block">{selectedTicket.system_context.page_url || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Message Thread */}
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-1">
              {selectedTicket.messages.map((msg) => {
                const isInternal = msg.is_internal_note;
                const isSupport = msg.sender_type === 'support';

                return (
                  <div
                    key={msg.id}
                    className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                      isInternal
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : isSupport
                          ? 'bg-brand-primary/5 border-brand-primary/20 mr-4'
                          : 'bg-surface-elevated border-separator/80 ml-4'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-foreground">
                        {isInternal ? 'Internal Support Note' : msg.sender_name}
                      </span>
                      <span className="text-[10px] text-muted">
                        {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                  </div>
                );
              })}
            </div>

            {/* Reply / Internal Note Form */}
            <form onSubmit={handleSendReply} className="space-y-3 pt-3 border-t border-separator">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setIsInternalNote(false)}
                    className={`cursor-pointer ${!isInternalNote ? 'text-brand-primary font-bold underline' : 'text-muted'}`}
                  >
                    Reply to Merchant
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsInternalNote(true)}
                    className={`cursor-pointer ${isInternalNote ? 'text-amber-600 font-bold underline' : 'text-muted'}`}
                  >
                    Add Internal Note
                  </button>
                </div>

                <span className="text-[11px] text-muted">
                  {isInternalNote ? 'Visible only to support team' : 'Sent to merchant dashboard'}
                </span>
              </div>

              <textarea
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={isInternalNote ? 'Add internal troubleshooting note...' : 'Reply to merchant customer...'}
                disabled={isPending}
                className={`w-full rounded-xl border px-3.5 py-2 text-xs outline-none focus-visible:ring-2 resize-none transition ${
                  isInternalNote
                    ? 'bg-amber-500/5 border-amber-500/30 focus-visible:ring-amber-500/50'
                    : 'bg-surface-elevated border-separator focus-visible:ring-brand-primary/50'
                }`}
              />

              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isPending || !replyText.trim()}
                  className="gap-1.5 cursor-pointer"
                >
                  {isPending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  <span>{isPending ? 'Sending...' : isInternalNote ? 'Add Note' : 'Send Reply'}</span>
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div className="p-12 rounded-2xl border border-dashed border-separator bg-surface text-center space-y-2 text-muted">
            <FileText size={24} className="mx-auto opacity-50" />
            <h4 className="text-xs font-bold text-foreground">Select a Support Ticket</h4>
            <p className="text-[11px]">
              Choose a ticket from the left inbox to view diagnostics and conversation history.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
