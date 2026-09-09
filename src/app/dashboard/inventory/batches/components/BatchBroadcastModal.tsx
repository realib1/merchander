'use client';

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import { PreorderBatch, PreorderBatchStatus, BatchBroadcastRecipient } from '@/types/preorder';
import {
  getBatchBroadcastRecipientsAction,
  dispatchBatchMilestoneBroadcastAction,
} from '@/app/actions/batch-notifications';
import { formatBatchMilestoneMessage } from '@/utils/preorder-batch';
import { Modal } from '@/components/ui/Modal';
import {
  Send,
  MessageSquare,
  Smartphone,
  CheckCircle2,
  Loader2,
  Users,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

interface BatchBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: PreorderBatch;
}

const BROADCAST_MILESTONES: Array<{
  status: PreorderBatchStatus;
  label: string;
  desc: string;
}> = [
  { status: 'ORDER_SUBMITTED', label: 'Supplier PO Submitted', desc: 'Notify that overseas factory order is placed' },
  { status: 'IN_TRANSIT', label: 'Cargo In Transit', desc: 'Notify that sea/air cargo transit has started' },
  { status: 'ARRIVED', label: 'Landed at Hub', desc: 'Notify that stock has cleared customs in Ghana' },
  { status: 'FULFILLING', label: 'Ready / Dispatching', desc: 'Notify customers that deliveries are rolling out' },
];

export function BatchBroadcastModal({ isOpen, onClose, batch }: BatchBroadcastModalProps) {
  const initialMilestone: PreorderBatchStatus =
    batch.status === 'IN_TRANSIT' ||
    batch.status === 'ARRIVED' ||
    batch.status === 'FULFILLING' ||
    batch.status === 'ORDER_SUBMITTED'
      ? batch.status
      : 'IN_TRANSIT';

  const [selectedMilestone, setSelectedMilestone] = useState<PreorderBatchStatus>(initialMilestone);
  const [channel, setChannel] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [recipients, setRecipients] = useState<
    Array<BatchBroadcastRecipient & { rawPhone: string; whatsappUrl: string }>
  >([]);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(true);
  const [userEditedMessage, setUserEditedMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Compute default template dynamically for selected milestone
  const defaultMessage = useMemo(() => {
    const dummyRecipient: BatchBroadcastRecipient = {
      orderId: 'ORD-1234',
      orderShortId: 'ORD-1234',
      customerName: '{{customer_name}}',
      customerPhone: '{{phone}}',
      itemsSummary: `Pre-Order #${batch.code}`,
      trackingUrl: `https://store.merchander.app/orders/TRACKING_ID`,
    };
    return formatBatchMilestoneMessage(batch, dummyRecipient, selectedMilestone);
  }, [batch, selectedMilestone]);

  const activeMessage = userEditedMessage !== null ? userEditedMessage : defaultMessage;

  useEffect(() => {
    if (!isOpen) return;
    let isCancelled = false;

    getBatchBroadcastRecipientsAction(batch.id).then((res) => {
      if (!isCancelled) {
        setRecipients(res.recipients || []);
        setIsLoadingRecipients(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [batch.id, isOpen]);

  if (!isOpen) return null;

  const handleMilestoneChange = (status: PreorderBatchStatus) => {
    setSelectedMilestone(status);
    setUserEditedMessage(null); // Reset user edits to new milestone's template
  };

  const handleDispatch = () => {
    if (recipients.length === 0) {
      toast.error('No customer recipients with phone numbers found for this batch');
      return;
    }

    startTransition(async () => {
      const res = await dispatchBatchMilestoneBroadcastAction({
        batchId: batch.id,
        milestone: selectedMilestone,
        channel,
        customMessageTemplate: activeMessage,
      });

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(
          `Milestone broadcast dispatched to ${res.recipientCount} customer(s) on ${channel.toUpperCase()}!`
        );
        onClose();
      }
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <MessageSquare size={18} />
          </div>
          <div>
            <div className="text-[10px] font-mono font-bold text-emerald-500 uppercase">
              Customer Communications
            </div>
            <div className="text-base font-bold text-foreground font-display mt-0.5">
              Batch Milestone Broadcast
            </div>
          </div>
        </div>
      }
      description={`${batch.name} (${batch.code})`}
    >
      <div className="space-y-4">
        {/* Milestone Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-foreground">Select Milestone Trigger</label>
          <div className="grid grid-cols-2 gap-2">
            {BROADCAST_MILESTONES.map((m) => (
              <button
                key={m.status}
                type="button"
                onClick={() => handleMilestoneChange(m.status)}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  selectedMilestone === m.status
                    ? 'border-emerald-500 bg-emerald-500/10 font-bold text-foreground ring-1 ring-emerald-500/30'
                    : 'border-separator bg-surface-elevated text-muted hover:text-foreground'
                }`}
              >
                <div className="text-xs flex items-center gap-1.5">
                  <CheckCircle2
                    size={12}
                    className={selectedMilestone === m.status ? 'text-emerald-500' : 'text-muted'}
                  />
                  <span>{m.label}</span>
                </div>
                <div className="text-[10px] text-muted font-normal mt-0.5">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Channel Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-foreground">Delivery Channel</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setChannel('whatsapp')}
              className={`flex-1 p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                channel === 'whatsapp'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30'
                  : 'border-separator bg-surface-elevated text-muted'
              }`}
            >
              <MessageSquare size={14} />
              <span>WhatsApp Cloud / Direct Link</span>
            </button>
            <button
              type="button"
              onClick={() => setChannel('sms')}
              className={`flex-1 p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                channel === 'sms'
                  ? 'border-brand-primary bg-brand-primary/10 text-brand-primary ring-1 ring-brand-primary/30'
                  : 'border-separator bg-surface-elevated text-muted'
              }`}
            >
              <Smartphone size={14} />
              <span>Hubtel Ghana SMS</span>
            </button>
          </div>
        </div>

        {/* Template Preview */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground flex items-center justify-between">
            <span>Message Content Preview</span>
            <span className="text-[10px] text-muted font-normal font-mono">Dynamic Tags Supported</span>
          </label>
          <textarea
            rows={5}
            value={activeMessage}
            onChange={(e) => setUserEditedMessage(e.target.value)}
            className="w-full text-xs font-mono rounded-xl bg-surface-elevated border border-separator p-3 text-foreground focus:outline-hidden focus:border-emerald-500 leading-relaxed"
          />
        </div>

        {/* Recipient Roster */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-foreground">
            <span className="flex items-center gap-1.5">
              <Users size={13} className="text-brand-primary" />
              <span>Pre-Order Customers ({recipients.length})</span>
            </span>
          </div>

          <div className="rounded-2xl border border-separator bg-surface-elevated max-h-36 overflow-y-auto custom-scrollbar divide-y divide-separator/40 text-xs">
            {isLoadingRecipients ? (
              <div className="p-4 text-center text-muted flex items-center justify-center gap-2">
                <Loader2 size={13} className="animate-spin" />
                <span>Loading pre-order customer orders...</span>
              </div>
            ) : recipients.length === 0 ? (
              <div className="p-4 text-center text-muted">
                No orders linked to this batch yet. Once customers place pre-orders, they will appear here.
              </div>
            ) : (
              recipients.map((r) => (
                <div key={r.orderId} className="p-2.5 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-foreground">{r.customerName}</div>
                    <div className="text-[10px] text-muted font-mono">
                      Order #{r.orderShortId} • {r.customerPhone}
                    </div>
                  </div>

                  <a
                    href={r.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1 hover:bg-emerald-500/20 transition cursor-pointer shrink-0"
                    title="Open WhatsApp chat with prefilled message"
                  >
                    <span>Chat</span>
                    <ExternalLink size={10} />
                  </a>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-separator/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-separator text-foreground text-xs font-semibold hover:bg-surface-elevated cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDispatch}
            disabled={isPending || recipients.length === 0}
            className="px-5 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Dispatching...</span>
              </>
            ) : (
              <>
                <Send size={13} />
                <span>Broadcast Update ({recipients.length})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
