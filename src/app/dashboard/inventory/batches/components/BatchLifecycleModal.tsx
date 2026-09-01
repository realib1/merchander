'use client';

import React, { useState } from 'react';
import { PreorderBatch, PreorderBatchStatus } from '@/types/preorder';
import { updateBatchLifecycleStatus } from '@/app/actions/preorder-batches';
import { getBatchStatusLabel } from '@/utils/preorder-batch';
import { X, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BatchLifecycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: PreorderBatch;
}

const statusOptions: Array<{ id: PreorderBatchStatus; label: string; desc: string }> = [
  { id: 'OPEN', label: 'Pre-Orders Open', desc: 'Accepting new customer orders' },
  { id: 'CLOSED', label: 'Batch Closed', desc: 'Cutoff reached, preparing supplier order' },
  { id: 'ORDER_SUBMITTED', label: 'Supplier PO Submitted', desc: 'Order placed with factory overseas' },
  { id: 'IN_TRANSIT', label: 'In Transit / Cargo Shipped', desc: 'Goods en route to Ghana via sea/air' },
  { id: 'ARRIVED', label: 'Arrived at Hub', desc: 'Landed, customs cleared, ready for sorting' },
  { id: 'FULFILLING', label: 'Dispatching & Fulfilling', desc: 'Packing orders and handing to couriers' },
  { id: 'COMPLETED', label: 'Completed', desc: 'All customer pre-orders fulfilled' },
];

export function BatchLifecycleModal({ isOpen, onClose, batch }: BatchLifecycleModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<PreorderBatchStatus>(batch.status);
  const [actualArrivalDate, setActualArrivalDate] = useState(
    batch.actual_arrival_date || new Date().toISOString().slice(0, 10)
  );
  const [isPending, setIsPending] = useState(false);

  if (!isOpen) return null;

  const handleUpdate = async () => {
    setIsPending(true);
    const res = await updateBatchLifecycleStatus(
      batch.id,
      selectedStatus,
      selectedStatus === 'ARRIVED' ? actualArrivalDate : undefined
    );
    setIsPending(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(`Batch status updated to ${getBatchStatusLabel(selectedStatus)}`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-surface border border-separator rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
        <div className="flex items-center justify-between border-b border-separator/80 pb-3">
          <div>
            <h2 className="text-base font-bold text-foreground">Update Batch Lifecycle</h2>
            <p className="text-xs text-muted">
              {batch.name} ({batch.code})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted hover:text-foreground cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-foreground mb-1">Select Active Milestone</label>
          <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
            {statusOptions.map((opt) => {
              const isSelected = selectedStatus === opt.id;
              const isCurrent = batch.status === opt.id;

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedStatus(opt.id)}
                  className={`w-full text-left p-2.5 rounded-xl border transition cursor-pointer flex items-start gap-2.5 ${
                    isSelected
                      ? 'border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary/30'
                      : 'border-separator bg-surface-elevated/60 hover:bg-surface-elevated'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected ? 'border-brand-primary bg-brand-primary text-white' : 'border-separator'
                    }`}
                  >
                    {isSelected && <CheckCircle2 size={12} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">{opt.label}</span>
                      {isCurrent && (
                        <span className="text-[10px] font-semibold text-muted bg-surface px-1.5 py-0.5 rounded border border-separator">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted mt-0.5">{opt.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {selectedStatus === 'ARRIVED' && (
          <div className="p-3 rounded-2xl bg-surface-elevated border border-separator space-y-1">
            <label className="block text-xs font-bold text-foreground">Actual Arrival Date</label>
            <input
              type="date"
              value={actualArrivalDate}
              onChange={(e) => setActualArrivalDate(e.target.value)}
              className="w-full text-xs rounded-lg bg-surface border border-separator px-2.5 py-1.5 text-foreground"
            />
          </div>
        )}

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
            onClick={handleUpdate}
            disabled={isPending || selectedStatus === batch.status}
            className="px-5 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary/90 flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            <span>Update Status</span>
          </button>
        </div>
      </div>
    </div>
  );
}
