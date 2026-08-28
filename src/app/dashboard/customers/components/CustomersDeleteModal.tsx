'use client';

import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';

interface CustomersDeleteModalProps {
  customerToDelete: string | 'bulk' | null;
  selectedCount: number;
  isUpdating: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function CustomersDeleteModal({
  customerToDelete,
  selectedCount,
  isUpdating,
  onCancel,
  onConfirm,
}: CustomersDeleteModalProps) {
  return (
    <AnimatePresence>
      {customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-surface rounded-2xl border border-separator shadow-xl w-full max-w-sm overflow-hidden"
          >
            <div className="p-5 border-b border-separator">
              <h3 className="text-lg font-bold">Confirm Deletion</h3>
              <p className="text-sm mt-1">
                {customerToDelete === 'bulk'
                  ? `Are you sure you want to permanently delete ${selectedCount} customers?`
                  : 'Are you sure you want to permanently delete this customer?'}{' '}
                This action cannot be undone.
              </p>
            </div>

            <div className="p-5 flex justify-end gap-3 bg-surface-elevated/30">
              <button
                type="button"
                onClick={onCancel}
                disabled={isUpdating}
                className="px-4 py-2 text-sm font-medium hover:text-primary transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={isUpdating}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm shadow-red-500/20"
              >
                {isUpdating && <Loader2 size={16} className="animate-spin" />}
                {isUpdating ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
