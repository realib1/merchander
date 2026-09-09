'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface Order {
  id: string;
  short_id?: string;
  total_amount: number;
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

  const handleClose = () => {
    setSmsText('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen && !!order}
      onClose={handleClose}
      size="md"
      title="Verify Mobile Money Payment"
      description={`Order #${order.short_id ? order.short_id : order.id.substring(0, 6).toUpperCase()} • ${formatCurrency(order.total_amount)}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
            className="w-full rounded-xl border border-separator bg-surface-elevated text-sm px-4 py-3 focus:ring-brand-primary placeholder:text-muted resize-none"
            required
          />
          <p className="text-xs text-muted mt-2">
            The system will securely extract the transaction reference and prevent duplicate entries.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isUpdating || !smsText.trim()}
            className="flex items-center gap-2"
          >
            {isUpdating && <Loader2 size={16} className="animate-spin" />}
            {isUpdating ? 'Verifying...' : 'Confirm Payment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
