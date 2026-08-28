'use client';

import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CancelOrderModalProps {
  orderToCancel: string | 'bulk' | null;
  selectedCount: number;
  isUpdating: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function CancelOrderModal({
  orderToCancel,
  selectedCount,
  isUpdating,
  onClose,
  onConfirm,
}: CancelOrderModalProps) {
  if (!orderToCancel) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-surface rounded-2xl border border-separator shadow-xl w-full max-w-sm overflow-hidden"
        >
          <div className="p-5 border-b border-separator">
            <h3 className="text-lg font-bold">Confirm Cancellation</h3>
            <p className="text-sm text-muted mt-1">
              {orderToCancel === 'bulk'
                ? `Are you sure you want to cancel ${selectedCount} orders?`
                : 'Are you sure you want to cancel this order?'}{' '}
              This action cannot be undone.
            </p>
          </div>

          <div className="p-5 flex justify-end gap-3 bg-surface-elevated/30">
            <button
              type="button"
              onClick={onClose}
              disabled={isUpdating}
              className="px-4 py-2 text-sm font-medium hover:text-foreground transition-colors disabled:opacity-50 cursor-pointer"
            >
              Keep Order
            </button>
            <button
              onClick={onConfirm}
              disabled={isUpdating}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm cursor-pointer"
            >
              {isUpdating && <Loader2 size={16} className="animate-spin" />}
              {isUpdating ? 'Cancelling...' : 'Confirm Cancel'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
