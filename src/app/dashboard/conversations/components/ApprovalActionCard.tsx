'use client';

import React, { useState, useTransition } from 'react';
import { AIActionRecord } from '@/types/actions';
import { approveAction, rejectAction } from '@/app/actions/approvals';
import { formatActionTypeLabel } from '@/utils/actionsMath';
import {
  MessageCircle,
  Clock,
  CheckCircle,
  XCircle,
  Edit3,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  AlertCircle,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

interface ProposedOrderItem {
  sku?: string;
  productName?: string;
  variantName?: string;
  displayName?: string;
  quantity?: number;
  unitPrice?: number;
  lineTotal?: number;
  hasStockWarning?: boolean;
}

interface ApprovalActionCardProps {
  action: AIActionRecord;
  onMutated?: () => void;
}

export function ApprovalActionCard({ action, onMutated }: ApprovalActionCardProps) {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [showFacts, setShowFacts] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  
  const proposed = (action.proposed_payload as Record<string, unknown>) || {};
  const initialText = (proposed.reply_text as string) || '';
  const [editText, setEditText] = useState(initialText);

  const customerName = action.customer?.name || action.channel_identity?.profile_name || 'Customer';
  const customerPhone = action.customer?.phone || action.channel_identity?.channel_handle || 'Unknown';
  const confidencePct = Math.round((Number(action.confidence) || 0) * 100);

  const handleApprove = () => {
    startTransition(async () => {
      const payload = isEditing && editText !== initialText ? { reply_text: editText } : undefined;
      const res = await approveAction(action.id, payload);
      if (res.success) {
        toast.success('Action approved and sent via WhatsApp');
        setIsEditing(false);
        onMutated?.();
      } else {
        toast.error(res.error || 'Failed to approve action');
      }
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      const res = await rejectAction(action.id, rejectReason || undefined);
      if (res.success) {
        toast.success('Action rejected');
        setShowRejectInput(false);
        onMutated?.();
      } else {
        toast.error(res.error || 'Failed to reject action');
      }
    });
  };

  return (
    <div className="bg-surface border border-separator rounded-2xl p-5 shadow-xs transition hover:border-separator/80 flex flex-col gap-4">
      {/* 1. Header: Customer & Channel Info */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <MessageCircle size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground text-sm">{customerName}</span>
              <span className="text-xs text-muted font-mono">{customerPhone}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted">WhatsApp</span>
              <span className="text-muted text-[10px]">•</span>
              <span className="text-xs text-muted flex items-center gap-1">
                <Clock size={12} />
                {new Date(action.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        {/* Action Type & Confidence Badges */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
            {formatActionTypeLabel(action.action_type)}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md bg-surface-muted text-muted border border-separator">
            <ShieldCheck size={12} className="text-brand-primary" />
            {confidencePct}% Grounded
          </span>
        </div>
      </div>

      {/* 2. Escalation reason / Attention note */}
      {action.escalation_reason && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-3.5 py-2.5 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2">
          <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-500" />
          <span>
            <strong className="font-semibold">Review trigger:</strong> {action.escalation_reason}
          </span>
        </div>
      )}

      {/* 3. Customer Assurance Notice Info */}
      {action.customer_notice_sent && (
        <div className="bg-surface-muted/60 border border-separator/60 rounded-xl px-3.5 py-2 text-xs text-muted flex items-start gap-2">
          <span className="font-medium text-foreground shrink-0">Customer assurance sent:</span>
          <span className="italic truncate">&quot;{action.customer_notice_sent}&quot;</span>
        </div>
      )}

      {/* 3b. Draft Order Items & Inventory Preview (when action_type === 'draft_order') */}
      {action.action_type === 'draft_order' && Boolean(proposed.order_number) && (
        <div className="bg-surface-muted/40 border border-brand-primary/20 rounded-xl p-3.5 flex flex-col gap-2.5 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package size={14} className="text-brand-primary" />
              <span className="font-semibold text-foreground">Draft Order #{String(proposed.order_number)}</span>
            </div>
            <span className="font-bold text-foreground font-mono">
              Total: {String(proposed.currency || 'GHS')} {Number(proposed.total_amount || 0).toFixed(2)}
            </span>
          </div>

          {/* Stock Deficit Warning Banner */}
          {Boolean(proposed.has_stock_deficit) && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-2 text-rose-600 dark:text-rose-400 flex items-start gap-1.5 text-[11px]">
              <AlertTriangle size={13} className="shrink-0 mt-0.5 text-rose-500" />
              <div>
                <span className="font-semibold">Inventory Alert: </span>
                {Array.isArray(proposed.warnings) && proposed.warnings.length > 0
                  ? proposed.warnings.join(' • ')
                  : 'One or more items exceed currently available store stock.'}
              </div>
            </div>
          )}

          {/* Line items list */}
          {Array.isArray(proposed.items) && proposed.items.length > 0 && (
            <div className="flex flex-col divide-y divide-separator/60 border-t border-separator/60 pt-2">
              {(proposed.items as ProposedOrderItem[]).map((item, idx) => {
                const name = item.displayName || item.productName || item.sku || `Item ${idx + 1}`;
                const unitPrice = typeof item.unitPrice === 'number' ? item.unitPrice : 0;
                const lineTotal =
                  typeof item.lineTotal === 'number' ? item.lineTotal : unitPrice * (item.quantity || 1);
                return (
                  <div key={idx} className="py-1.5 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-foreground">{item.quantity}x</span>
                      <span className="text-foreground">{name}</span>
                      {item.sku && <span className="text-muted font-mono text-[10px]">({item.sku})</span>}
                      {item.hasStockWarning && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-rose-500/10 text-rose-500 rounded font-medium">
                          Low Stock
                        </span>
                      )}
                    </div>
                    <span className="text-muted font-mono">
                      {String(proposed.currency || 'GHS')} {lineTotal.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {Number(proposed.delivery_fee || 0) > 0 && (
            <div className="flex justify-between text-[11px] text-muted border-t border-separator/40 pt-1">
              <span>Delivery Fee:</span>
              <span className="font-mono">
                {String(proposed.currency || 'GHS')} {Number(proposed.delivery_fee).toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* 4. Grounded Facts Accordion */}
      {action.grounded_facts && action.grounded_facts.length > 0 && (
        <div className="border border-separator/60 rounded-xl overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => setShowFacts(!showFacts)}
            className="w-full bg-surface-muted/30 px-3.5 py-2 flex items-center justify-between text-muted hover:text-foreground transition"
          >
            <span className="font-medium">Grounded Knowledge Facts ({action.grounded_facts.length})</span>
            {showFacts ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showFacts && (
            <div className="p-3 bg-surface flex flex-col gap-1.5 border-t border-separator/60">
              {action.grounded_facts.map((fact, idx) => (
                <div key={idx} className="flex items-start gap-2 text-foreground">
                  <span className="text-brand-primary font-bold">•</span>
                  <span>{fact}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. Proposed Outbound Message Box */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-foreground">Proposed Outbound Reply</span>
          {action.status === 'pending' && !isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-brand-primary hover:underline flex items-center gap-1 font-medium"
            >
              <Edit3 size={12} />
              Edit text
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={3}
              className="w-full text-xs p-3 rounded-xl border border-brand-primary/40 bg-surface focus:outline-none focus:ring-1 focus:ring-brand-primary text-foreground resize-none"
              placeholder="Type edited message..."
            />
            <div className="flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setEditText(initialText);
                  setIsEditing(false);
                }}
                className="px-3 py-1 text-muted hover:text-foreground transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 bg-surface-muted border border-separator rounded-md text-foreground font-medium hover:bg-surface-muted/80 transition"
              >
                Keep Edits
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-surface-muted/40 border border-separator/80 text-xs text-foreground leading-relaxed">
            {editText || <span className="text-muted italic">No reply text generated</span>}
          </div>
        )}
      </div>

      {/* 6. Card Status & Actions */}
      {action.status === 'pending' ? (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-separator">
          {showRejectInput ? (
            <div className="flex items-center gap-2 w-full">
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection (optional)..."
                className="text-xs px-3 py-1.5 rounded-lg border border-separator bg-surface text-foreground w-full focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
              <button
                type="button"
                disabled={isPending}
                onClick={handleReject}
                className="px-3 py-1.5 bg-rose-500 text-white rounded-lg text-xs font-semibold hover:bg-rose-600 shrink-0 transition flex items-center gap-1"
              >
                {isPending && <Loader2 size={12} className="animate-spin" />}
                Confirm Reject
              </button>
              <button
                type="button"
                onClick={() => setShowRejectInput(false)}
                className="text-xs text-muted hover:text-foreground px-2 py-1"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                disabled={isPending}
                onClick={() => setShowRejectInput(true)}
                className="w-full sm:w-auto px-4 py-2 border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 rounded-xl text-xs font-medium transition flex items-center justify-center gap-1.5"
              >
                <XCircle size={14} />
                Reject
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={handleApprove}
                className="w-full sm:w-auto px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-xs"
              >
                {isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                {isEditing || editText !== initialText ? 'Approve & Send Edited' : 'Approve & Send Outbound'}
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between text-xs text-muted pt-2 border-t border-separator">
          <span className="flex items-center gap-1.5">
            {action.status === 'executed' ? (
              <span className="inline-flex items-center gap-1 text-emerald-500 font-medium">
                <CheckCircle size={14} /> Executed & Dispatched
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-rose-500 font-medium">
                <XCircle size={14} /> Rejected {action.rejection_reason && `(${action.rejection_reason})`}
              </span>
            )}
          </span>
          {action.reviewed_at && (
            <span>{new Date(action.reviewed_at).toLocaleDateString()}</span>
          )}
        </div>
      )}
    </div>
  );
}
