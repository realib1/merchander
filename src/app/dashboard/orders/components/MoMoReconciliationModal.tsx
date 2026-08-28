'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency } from '@/utils/format';
import type { OrderStatus } from '@/app/actions/orders';

interface Order {
  id: string;
  short_id?: string;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
}

interface MoMoReconciliationModalProps {
  order: Order | null;
  isOpen: boolean;
  isUpdating: boolean;
  onClose: () => void;
  onReconcile: (smsText: string) => Promise<void>;
}

export function MoMoReconciliationModal({
  order,
  isOpen,
  isUpdating,
  onClose,
  onReconcile,
}: MoMoReconciliationModalProps) {
  const [smsText, setSmsText] = useState('');

  if (!isOpen || !order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsText.trim()) return;
    await onReconcile(smsText);
    setSmsText('');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-surface rounded-2xl border border-separator shadow-xl w-full max-w-md overflow-hidden"
        >
          <div className="p-5 border-b border-separator">
            <h3 className="text-lg font-bold">Verify Mobile Money Payment</h3>
            <p className="text-sm text-muted mt-1">
              Order #{order.short_id ? order.short_id : order.id.substring(0, 6).toUpperCase()} •{' '}
              {formatCurrency(order.total_amount)}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label htmlFor="smsText" className="block text-sm font-medium mb-1.5">
                Paste Payment SMS
              </label>
              <textarea
                id="smsText"
                rows={4}
                value={smsText}
                onChange={(e) => setSmsText(e.target.value)}
                placeholder="e.g. Payment received for GHS 450.00 from Kwame Mensah. Ref: 18273918239"
                className="w-full rounded-xl border-separator bg-surface-elevated text-sm px-4 py-3 focus:ring-brand-primary placeholder:text-muted resize-none"
                required
              />
              <p className="text-xs text-muted mt-2">
                The system will securely extract the transaction reference and prevent duplicate entries.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSmsText('');
                  onClose();
                }}
                className="px-4 py-2 text-sm font-medium hover:text-brand-primary transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating || !smsText}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-brand-primary hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm"
              >
                {isUpdating && <Loader2 size={16} className="animate-spin" />}
                {isUpdating ? 'Verifying...' : 'Confirm Payment'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
