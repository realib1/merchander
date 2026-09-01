'use client';

import React, { useState, useTransition } from 'react';
import { CreateTicketPayload, TicketCategory, TicketPriority, SystemContext } from '@/types/support';
import { createSupportTicket } from '@/app/actions/support';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Send, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';

interface ContactSupportFormProps {
  initialSubject?: string;
  initialCategory?: TicketCategory;
  initialContext?: SystemContext;
  onTicketCreated: (ticketId: string) => void;
}

export function ContactSupportForm({
  initialSubject = '',
  initialCategory = 'other',
  initialContext,
  onTicketCreated,
}: ContactSupportFormProps) {
  const [isPending, startTransition] = useTransition();
  const [subject, setSubject] = useState(initialSubject);
  const [category, setCategory] = useState<TicketCategory>(initialCategory);
  const [priority, setPriority] = useState<TicketPriority>('normal');
  const [message, setMessage] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error('Please enter both a subject and details for your request');
      return;
    }

    startTransition(async () => {
      const payload: CreateTicketPayload = {
        category,
        subject: subject.trim(),
        message: message.trim(),
        priority: isUrgent ? 'urgent' : priority,
        system_context: {
          ...initialContext,
          page_url: typeof window !== 'undefined' ? window.location.href : '',
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        },
      };

      const res = await createSupportTicket(payload);
      if (res.error) {
        toast.error(res.error);
      } else if (res.ticket) {
        toast.success(`Support case ${res.ticket.reference_code} submitted!`);
        onTicketCreated(res.ticket.id);
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-lg font-bold font-display text-foreground">Contact Merchander Support</h2>
        <p className="text-xs text-muted">
          Our technical engineering team reviews and responds directly through your dashboard ticket thread.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-separator bg-surface space-y-5 shadow-xs">
        {/* Category & Priority Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="supportCategorySelect" className="text-xs font-semibold text-foreground">
              What area do you need help with?
            </label>
            <select
              id="supportCategorySelect"
              value={category}
              onChange={(e) => setCategory(e.target.value as TicketCategory)}
              disabled={isPending}
              className="w-full rounded-xl border border-separator bg-surface px-3 py-2 text-xs transition outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 cursor-pointer"
            >
              <option value="channels">Channels & WhatsApp API</option>
              <option value="orders">Orders & Pre-order Batches</option>
              <option value="payments">Mobile Money & Payments</option>
              <option value="domain">Custom Domain & DNS</option>
              <option value="storefront">Storefront & Catalog</option>
              <option value="intelligence">Goals & Intelligence</option>
              <option value="billing">Billing & Subscriptions</option>
              <option value="account">Account & Security</option>
              <option value="other">Other Inquiries</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="prioritySelect" className="text-xs font-semibold text-foreground">
              Priority Level
            </label>
            <select
              id="prioritySelect"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TicketPriority)}
              disabled={isPending || isUrgent}
              className="w-full rounded-xl border border-separator bg-surface px-3 py-2 text-xs transition outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 cursor-pointer"
            >
              <option value="normal">Normal Priority</option>
              <option value="high">High Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>
        </div>

        {/* Subject */}
        <FormField
          name="subject"
          label="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Brief summary of the issue (e.g. WhatsApp stopped receiving messages after reconnection)"
          required
          disabled={isPending}
        />

        {/* Message Description */}
        <div className="space-y-1.5">
          <label htmlFor="ticketMessage" className="text-xs font-semibold text-foreground">
            Detailed Description
          </label>
          <textarea
            id="ticketMessage"
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Please describe what happened, what you were doing when it occurred, and any error message you saw..."
            required
            disabled={isPending}
            className="w-full rounded-xl border border-separator bg-surface-elevated px-3.5 py-2.5 text-xs placeholder:text-muted outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 resize-none transition"
          />
        </div>

        {/* Auto-Captured Context Telemetry Box */}
        <div className="p-3.5 rounded-xl bg-surface-elevated/80 border border-separator/60 flex items-start gap-2.5 text-xs">
          <Info size={15} className="text-brand-primary shrink-0 mt-0.5" />
          <div className="space-y-1 text-muted">
            <span className="font-semibold text-foreground block">Automatic Context Capture</span>
            <p className="text-[11px] leading-relaxed">
              Merchander automatically bundles your current store metadata, active error codes, and technical
              diagnostics with this ticket so support can resolve it faster without redundant questions.
            </p>
          </div>
        </div>

        {/* Urgent Checkbox & Submit */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-separator">
          <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
            <input
              type="checkbox"
              checked={isUrgent}
              onChange={(e) => setIsUrgent(e.target.checked)}
              disabled={isPending}
              className="rounded border-separator text-destructive focus:ring-destructive/50"
            />
            <span className={isUrgent ? 'font-bold text-destructive' : ''}>
              Critical Outage (Entire storefront or checkout inaccessible)
            </span>
          </label>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isPending}
            className="gap-1.5 min-w-32 cursor-pointer shrink-0"
          >
            {isPending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            <span>{isPending ? 'Submitting...' : 'Submit Request'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
