'use client';

import React, { useState } from 'react';
import {
  X,
  CheckCircle,
  Star,
  Calendar,
  AlertTriangle,
  Store as StoreIcon,
  FileCheck2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { recordPODeliveryAction } from '@/app/actions/intelligence-demand';
import { receivePurchaseOrder } from '@/app/actions/purchasing';
import { Button } from '@/components/ui/Button';

interface Store {
  id: string;
  name: string;
}

interface RecordPODeliveryModalProps {
  purchaseOrderId: string;
  poNumber: string;
  supplierName?: string;
  stores: Store[];
}

export function RecordPODeliveryModal({
  purchaseOrderId,
  poNumber,
  supplierName,
  stores,
}: RecordPODeliveryModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [selectedStoreId, setSelectedStoreId] = useState<string>(stores[0]?.id || '');
  const [actualDate, setActualDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [qualityRating, setQualityRating] = useState<number>(5);
  const [defectCount, setDefectCount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStoreId) {
      toast.error('Please select a destination store or warehouse.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Record delivery metrics for supplier scoring
      const deliveryRes = await recordPODeliveryAction({
        purchaseOrderId,
        actualDeliveryDate: new Date(actualDate).toISOString(),
        qualityRating,
        defectCount,
        notes: notes.trim() || undefined,
      });

      if (!deliveryRes.success) {
        toast.error(deliveryRes.error || 'Failed to record delivery inspection');
        setIsSubmitting(false);
        return;
      }

      // 2. Receive the purchase order into stock
      const receiveRes = await receivePurchaseOrder(purchaseOrderId, selectedStoreId);

      if (receiveRes.error) {
        toast.error(receiveRes.error);
        setIsSubmitting(false);
        return;
      }

      toast.success(
        `PO ${poNumber} received into inventory and supplier scorecard updated!`
      );
      setIsOpen(false);
      router.refresh();
    } catch (err: unknown) {
      console.error('Error receiving PO:', err);
      toast.error('An unexpected error occurred while processing delivery receipt');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-brand-primary text-white hover:bg-brand-primary/90 rounded-md transition-colors"
      >
        <CheckCircle size={14} />
        <span>Receive &amp; Inspect</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-surface border border-separator rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scaleIn text-left">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-separator bg-surface-elevated/30">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-brand-primary" />
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Inspect &amp; Receive PO
                  </h3>
                  <p className="text-[11px] text-muted">
                    {poNumber} {supplierName ? `• ${supplierName}` : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-muted hover:bg-surface-elevated hover:text-foreground transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Destination Store */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                  <StoreIcon className="w-3.5 h-3.5 text-muted" />
                  <span>Receive Into Store *</span>
                </label>
                <select
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-surface border border-separator rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-primary"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Delivery Arrival Date */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted" />
                  <span>Actual Delivery Date *</span>
                </label>
                <input
                  type="date"
                  value={actualDate}
                  onChange={(e) => setActualDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-surface border border-separator rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              {/* Quality Rating (1-5 Stars) */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Goods Condition &amp; Quality Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setQualityRating(star)}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        star <= qualityRating
                          ? 'border-amber-400 bg-amber-500/10 text-amber-500'
                          : 'border-separator text-muted hover:border-separator/80'
                      }`}
                    >
                      <Star
                        className="w-4 h-4"
                        fill={star <= qualityRating ? 'currentColor' : 'none'}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-semibold text-foreground ml-2">
                    {qualityRating} of 5 Stars
                  </span>
                </div>
              </div>

              {/* Defect Count */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Damaged / Defective Units</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={defectCount}
                  onChange={(e) => setDefectCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-3 py-2 bg-surface border border-separator rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  placeholder="0"
                />
                <p className="text-[10px] text-muted mt-1">
                  Defects are factored into the supplier reliability scorecard.
                </p>
              </div>

              {/* Optional Inspection Notes */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Inspection Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Packaging condition, seal integrity, batch numbers..."
                  className="w-full px-3 py-2 bg-surface border border-separator rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-separator">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting || !selectedStoreId}
                  className="font-bold"
                >
                  {isSubmitting ? 'Receiving...' : 'Confirm Delivery & Update Stock'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
