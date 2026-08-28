'use client';

import { FileText, CircleX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OrdersBulkActionBarProps {
  selectedCount: number;
  onDeselect: () => void;
  onBulkExport: () => void;
}

export function OrdersBulkActionBar({ selectedCount, onDeselect, onBulkExport }: OrdersBulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <AnimatePresence>
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
            onClick={onDeselect}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-semibold hover:text-foreground hover:bg-surface/50 rounded-full transition-colors cursor-pointer"
            title="Deselect"
          >
            <CircleX size={14} />
            <span className="hidden sm:inline">Deselect</span>
          </button>
          <button
            onClick={onBulkExport}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-semibold hover:text-foreground hover:bg-surface/50 rounded-full transition-colors cursor-pointer"
            title="Export"
          >
            <FileText size={14} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
