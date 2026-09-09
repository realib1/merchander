'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
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
    <Modal
      isOpen={Boolean(customerToDelete)}
      onClose={onCancel}
      size="sm"
      title="Confirm Deletion"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isUpdating}
          >
            Cancel
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
            {isUpdating ? 'Deleting...' : 'Delete Permanently'}
          </Button>
        </div>
      }
    >
      <p className="text-sm text-muted">
        {customerToDelete === 'bulk'
          ? `Are you sure you want to permanently delete ${selectedCount} customers?`
          : 'Are you sure you want to permanently delete this customer?'}{' '}
        This action cannot be undone.
      </p>
    </Modal>
  );
}
