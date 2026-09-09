'use client';

import React, { useState } from 'react';
import { PreorderBatch, PreorderBatchStatus } from '@/types/preorder';
import { updateBatchLifecycleStatus } from '@/app/actions/preorder-batches';
import { getBatchStatusLabel } from '@/utils/preorder-batch';
import { BatchLifecycleStepper } from './BatchLifecycleStepper';
import { CheckCircle2, Loader2, Plane, Ship, Package, Clock, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';

interface BatchLifecycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: PreorderBatch;
}

const statusOptions: Array<{
  id: PreorderBatchStatus;
  label: string;
  desc: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}> = [
  { id: 'OPEN', label: '1. Pre-Orders Open', desc: 'Accepting new customer pre-order reservations', icon: ShoppingBag },
  { id: 'CLOSING_SOON', label: '2. Closing Soon', desc: 'Urgency trigger / final 48 hours before cutoff', icon: Clock },
  { id: 'CLOSED', label: '3. Batch Closed (PO Prep)', desc: 'Cutoff reached, calculating supplier volumes', icon: Package },
  { id: 'ORDER_SUBMITTED', label: '4. Supplier PO Placed', desc: 'Purchase order placed with overseas factory', icon: Package },
  { id: 'IN_TRANSIT', label: '5. Cargo In Transit', desc: 'Goods on sea/air freight en route to Ghana', icon: Ship },
  { id: 'ARRIVED', label: '6. Landed at Local Hub', desc: 'Cargo landed in Ghana, customs cleared', icon: CheckCircle2 },
  { id: 'FULFILLING', label: '7. Sorting & Dispatching', desc: 'Inspecting, packing, and courier handoff', icon: Package },
  { id: 'COMPLETED', label: '8. Completed & Delivered', desc: 'All customer pre-orders fulfilled and delivered', icon: CheckCircle2 },
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
      toast.success(`Batch milestone updated to ${getBatchStatusLabel(selectedStatus)}`);
      onClose();
    }
  };

  const isAir = batch.freight_mode === 'air' || batch.freight_mode === 'express';

  if (!isOpen || !batch) return null;

  return (
    <Modal
      isOpen={isOpen && !!batch}
      onClose={onClose}
      size="md"
      title={
        <div>
          <div className="text-[10px] font-mono font-bold text-brand-primary uppercase">
            Procurement State Machine
          </div>
          <h2 className="text-base font-bold text-foreground font-display mt-0.5">
            Update Batch Lifecycle
          </h2>
          <p className="text-xs text-muted">
            {batch.name} ({batch.code})
          </p>
        </div>
      }
    >
      <div className="space-y-4">

        {/* Visual Stepper */}
        <BatchLifecycleStepper
          currentStatus={selectedStatus}
          freightMode={batch.freight_mode}
          compact={false}
        />

        <div className="space-y-2 pt-2">
          <label className="block text-xs font-bold text-foreground mb-1">Select Milestone</label>
          <div className="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
            {statusOptions.map((opt) => {
              const isSelected = selectedStatus === opt.id;
              const isCurrent = batch.status === opt.id;
              const OptIcon = opt.id === 'IN_TRANSIT' && isAir ? Plane : opt.icon;

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
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected
                        ? 'border-brand-primary bg-brand-primary text-white'
                        : 'border-separator bg-surface text-muted'
                    }`}
                  >
                    <OptIcon size={12} />
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
            <label className="block text-xs font-bold text-foreground">Actual Arrival Date at Ghana Hub</label>
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
            <span>Apply Milestone Transition</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
