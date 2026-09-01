'use client';

import React, { useState, useTransition } from 'react';
import { SupportTicket, TicketStatus } from '@/types/support';
import { addTicketMessage } from '@/app/actions/support';
import { Button } from '@/components/ui/Button';
import { Clock, CheckCircle2, AlertTriangle, MessageSquare, Send, Loader2, ChevronRight, LifeBuoy } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface MyRequestsViewProps {
  tickets: SupportTicket[];
  initialSelectedId?: string | null;
  onRefresh: () => void;
  onOpenNewTicket: () => void;
}

export function MyRequestsView({ tickets, initialSelectedId, onRefresh, onOpenNewTicket }: MyRequestsViewProps) {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(initialSelectedId || null);
  const [replyText, setReplyText] = useState('');
  const [isPending, startTransition] = useTransition();

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || null;

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId || !replyText.trim()) return;

    startTransition(async () => {
      const res = await addTicketMessage(selectedTicketId, replyText.trim());
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Message sent to support team');
        setReplyText('');
        onRefresh();
      }
    });
  };

  const getStatusBadge = (status: TicketStatus, isEscalated: boolean) => {
    if (isEscalated) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-destructive/10 text-destructive border border-destructive/20 uppercase">
          <AlertTriangle size={10} />
          <span>Escalated</span>
        </span>
      );
    }

    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
            <span>Open</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock size={10} />
            <span>In Progress</span>
          </span>
        );
      case 'waiting_for_merchant':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <span>Waiting on You</span>
          </span>
        );
      case 'resolved':
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 size={10} />
            <span>Resolved</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {selectedTicket ? (
        /* Detailed Ticket Conversation Thread */
        <div className="rounded-2xl border border-separator bg-surface p-5 sm:p-6 space-y-6 animate-fadeIn">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-separator pb-4">
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setSelectedTicketId(null)}
                className="text-xs font-bold text-brand-primary hover:underline cursor-pointer flex items-center gap-1 mb-1"
              >
                ← Back to all requests
              </button>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-sm text-foreground">{selectedTicket.reference_code}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-surface-elevated border border-separator text-muted">
                  {selectedTicket.category}
                </span>
                {getStatusBadge(selectedTicket.status, selectedTicket.is_escalated)}
              </div>
              <h2 className="text-base sm:text-lg font-bold font-display text-foreground">{selectedTicket.subject}</h2>
            </div>

            <div className="text-right text-[11px] text-muted">
              <span>Opened {format(new Date(selectedTicket.created_at), 'MMM d, h:mm a')}</span>
            </div>
          </div>

          {/* Conversation Messages Thread */}
          <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar pr-1">
            {selectedTicket.messages.map((msg) => {
              const isSupport = msg.sender_type === 'support';
              return (
                <div
                  key={msg.id}
                  className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                    isSupport
                      ? 'bg-brand-primary/5 border-brand-primary/20 mr-4 sm:mr-8'
                      : 'bg-surface-elevated border-separator/80 ml-4 sm:ml-8'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-bold">
                      {isSupport ? (
                        <span className="text-brand-primary font-display flex items-center gap-1">
                          <LifeBuoy size={13} />
                          <span>Merchander Support</span>
                        </span>
                      ) : (
                        <span className="text-foreground">{msg.sender_name || 'You'}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted">{format(new Date(msg.created_at), 'MMM d, h:mm a')}</span>
                  </div>
                  <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                </div>
              );
            })}
          </div>

          {/* Reply Box (if not permanently closed) */}
          {selectedTicket.status !== 'closed' && (
            <form onSubmit={handleSendReply} className="space-y-2 pt-2 border-t border-separator">
              <label htmlFor="replyInput" className="text-xs font-semibold text-foreground">
                Reply to Support Specialist
              </label>
              <textarea
                id="replyInput"
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your response here..."
                disabled={isPending}
                className="w-full bg-surface-elevated border border-separator rounded-xl px-3.5 py-2 text-xs placeholder:text-muted outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 resize-none transition"
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
                  <span>{isPending ? 'Sending...' : 'Send Message'}</span>
                </Button>
              </div>
            </form>
          )}
        </div>
      ) : (
        /* Requests Inbox List */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-display text-foreground">Your Support Cases ({tickets.length})</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenNewTicket}
              className="gap-1.5 text-xs cursor-pointer"
            >
              <span>Contact Support</span>
            </Button>
          </div>

          {tickets.length > 0 ? (
            <div className="space-y-2.5">
              {tickets.map((tkt) => (
                <button
                  key={tkt.id}
                  type="button"
                  onClick={() => setSelectedTicketId(tkt.id)}
                  className="w-full p-4 rounded-2xl border border-separator bg-surface hover:bg-surface-elevated hover:border-brand-primary/50 transition-all text-left flex items-center justify-between gap-4 group cursor-pointer shadow-xs"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs text-brand-primary">{tkt.reference_code}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-surface-elevated border border-separator text-muted">
                        {tkt.category}
                      </span>
                      {getStatusBadge(tkt.status, tkt.is_escalated)}
                    </div>
                    <h4 className="text-xs font-bold text-foreground truncate group-hover:text-brand-primary transition-colors">
                      {tkt.subject}
                    </h4>
                    <p className="text-[11px] text-muted truncate">
                      Last update {format(new Date(tkt.updated_at), 'MMM d, h:mm a')} • {tkt.messages.length}{' '}
                      {tkt.messages.length === 1 ? 'message' : 'messages'}
                    </p>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-muted group-hover:text-brand-primary group-hover:translate-x-0.5 transition-transform shrink-0"
                  />
                </button>
              ))}
            </div>
          ) : (
            <div className="p-10 rounded-2xl border border-dashed border-separator bg-surface text-center space-y-3">
              <MessageSquare size={24} className="mx-auto text-muted" />
              <div className="space-y-1 max-w-sm mx-auto">
                <h4 className="text-xs font-bold text-foreground">No Support Requests Yet</h4>
                <p className="text-[11px] text-muted">
                  When you submit a support case or technical inquiry, it will appear here as a dedicated conversation.
                </p>
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={onOpenNewTicket}
                className="gap-1.5 text-xs cursor-pointer"
              >
                <span>Submit Your First Request</span>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
