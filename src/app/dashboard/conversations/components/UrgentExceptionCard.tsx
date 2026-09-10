'use client';

import React, { useTransition, useState } from 'react';
import { AIActionRecord } from '@/types/actions';
import { resolveRedException } from '@/app/actions/approvals';
import { buildWhatsAppTakeoverUrl } from '@/utils/actionsMath';
import { formatChannelName } from '@/utils/channelFormat';
import {
  AlertTriangle,
  MessageCircle,
  ExternalLink,
  CheckCircle2,
  Clock,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';

interface UrgentExceptionCardProps {
  action: AIActionRecord;
  onMutated?: () => void;
}

export function UrgentExceptionCard({ action, onMutated }: UrgentExceptionCardProps) {
  const [isPending, startTransition] = useTransition();
  const [showResolveInput, setShowResolveInput] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');

  const customerName = action.customer?.name || action.channel_identity?.profile_name || 'Customer';
  const customerPhone = action.customer?.phone || action.channel_identity?.channel_handle || '';
  const channelName = formatChannelName(action.channel_identity?.channel);
  const takeoverUrl = buildWhatsAppTakeoverUrl(customerPhone, customerName, action.escalation_reason);

  const handleResolve = () => {
    startTransition(async () => {
      const res = await resolveRedException(action.id, resolutionNote || undefined);
      if (res.success) {
        toast.success('Exception marked as resolved');
        setShowResolveInput(false);
        onMutated?.();
      } else {
        toast.error(res.error || 'Failed to resolve exception');
      }
    });
  };

  return (
    <div className="bg-rose-500/5 border border-rose-500/30 rounded-2xl p-5 shadow-xs transition hover:border-rose-500/50 flex flex-col gap-4">
      {/* 1. Header: Customer & Urgent Alert */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 border border-rose-500/20">
            <ShieldAlert size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground text-sm">{customerName}</span>
              <span className="text-xs text-muted font-mono">{customerPhone}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-rose-500 font-medium">{channelName} Takeover Needed</span>
              <span className="text-muted text-[10px]">•</span>
              <span className="text-xs text-muted flex items-center gap-1">
                <Clock size={12} />
                {new Date(action.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        {/* Reason Badge */}
        <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
          <AlertTriangle size={13} />
          {action.escalation_reason || 'Human Intervention Required'}
        </span>
      </div>

      {/* 2. Customer Notice Confirmation */}
      {action.customer_notice_sent && (
        <div className="bg-surface border border-separator/80 rounded-xl px-3.5 py-2.5 text-xs text-muted flex items-start gap-2">
          <span className="font-semibold text-foreground shrink-0">Automated notice sent:</span>
          <span className="italic truncate">&quot;{action.customer_notice_sent}&quot;</span>
        </div>
      )}

      {/* 3. Operational Takeover Notice */}
      <div className="text-xs text-muted leading-relaxed">
        Automation was halted to protect customer experience. Click below to open {channelName} directly and resolve the matter with the customer.
      </div>

      {/* 4. Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-rose-500/20">
        {showResolveInput ? (
          <div className="flex items-center gap-2 w-full">
            <input
              type="text"
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder={`Resolution note (e.g. Spoke to customer via ${channelName})...`}
              className="text-xs px-3 py-1.5 rounded-lg border border-separator bg-surface text-foreground w-full focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="button"
              disabled={isPending}
              onClick={handleResolve}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 shrink-0 transition flex items-center gap-1"
            >
              {isPending && <Loader2 size={12} className="animate-spin" />}
              Mark Handled
            </button>
            <button
              type="button"
              onClick={() => setShowResolveInput(false)}
              className="text-xs text-muted hover:text-foreground px-2 py-1"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            {action.status === 'pending' ? (
              <button
                type="button"
                onClick={() => setShowResolveInput(true)}
                className="w-full sm:w-auto px-4 py-2 border border-separator bg-surface hover:bg-surface-muted text-foreground rounded-xl text-xs font-medium transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 size={14} className="text-emerald-500" />
                Mark Resolved
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-500 font-medium">
                <CheckCircle2 size={14} /> Resolved via Takeover
              </span>
            )}

            {/* Direct Channel Takeover Link */}
            <a
              href={takeoverUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 shadow-xs"
            >
              <MessageCircle size={15} />
              Open {channelName} Takeover
              <ExternalLink size={13} className="opacity-80" />
            </a>
          </>
        )}
      </div>
    </div>
  );
}
