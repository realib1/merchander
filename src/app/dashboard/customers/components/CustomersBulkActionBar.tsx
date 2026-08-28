'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Loader2 } from 'lucide-react';

interface CustomersBulkActionBarProps {
  selectedCount: number;
  isUpdating: boolean;
  isBulkDeleting: boolean;
  onDeselectAll: () => void;
  onRequestBulkDelete: () => void;
}

export function CustomersBulkActionBar({
  selectedCount,
  isUpdating,
  isBulkDeleting,
  onDeselectAll,
  onRequestBulkDelete,
}: CustomersBulkActionBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 sm:gap-4 bg-surface-elevated/90 backdrop-blur-xl border border-separator/80 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.3)] rounded-full px-3 sm:px-4 py-2 w-max max-w-[calc(100vw-2rem)] overflow-x-auto hide-scrollbar"
        >
          <div className="flex items-center gap-2 pr-2 sm:pr-4 border-r border-separator shrink-0">
            <div className="flex items-center justify-center bg-brand-primary text-white text-xs font-bold w-6 h-6 rounded-full tabular-nums">
              {selectedCount}
            </div>
            <span className="hidden sm:inline text-sm font-semibold">Selected</span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={onDeselectAll}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-semibold hover:text-primary hover:bg-surface/50 rounded-full transition-colors"
              title="Deselect"
            >
              <X size={14} />
              <span className="hidden sm:inline">Deselect</span>
            </button>
            <button
              onClick={onRequestBulkDelete}
              disabled={isUpdating}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-semibold text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete"
            >
              {isUpdating && isBulkDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
