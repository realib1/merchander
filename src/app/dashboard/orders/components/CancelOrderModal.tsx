'use client';

import { Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

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
    <Modal
      isOpen={!!orderToCancel}
      onClose={onClose}
      size="sm"
      title="Confirm Cancellation"
      description={
        orderToCancel === 'bulk'
          ? `Are you sure you want to cancel ${selectedCount} orders? This action cannot be undone.`
          : 'Are you sure you want to cancel this order? This action cannot be undone.'
      }
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isUpdating}
          >
            Keep Order
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            disabled={isUpdating}
            className="flex items-center gap-2"
          >
            {isUpdating && <Loader2 size={16} className="animate-spin" />}
            {isUpdating ? 'Cancelling...' : 'Confirm Cancel'}
          </Button>
        </div>
      }
    >
      <div />
    </Modal>
  );
}
