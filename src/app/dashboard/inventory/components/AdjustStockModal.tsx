import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { updateStock } from '@/app/actions/inventory';
import { toast } from 'sonner';

interface AdjustStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  variantId: string;
  storeId: string | null;
  productName: string;
  sku: string;
  currentQuantity: number;
}

export function AdjustStockModal({
  isOpen,
  onClose,
  variantId,
  storeId,
  productName,
  sku,
  currentQuantity,
}: AdjustStockModalProps) {
  const [quantity, setQuantity] = useState<number>(currentQuantity);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append('variantId', variantId);
    formData.append('storeId', storeId || '');
    formData.append('quantity', quantity.toString());

    try {
      await updateStock(formData);
      toast.success('Stock updated');
      onClose();
    } catch (error) {
      toast.error('Failed to update stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adjust Stock Level"
      description={`Update inventory for ${productName} (${sku})`}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-surface-elevated/50 border border-separator rounded-lg mb-4">
          <span className="text-sm font-medium text-secondary">Existing units</span>
          <span className="text-sm font-bold text-primary">{currentQuantity}</span>
        </div>
        <div className="space-y-2">
          <label htmlFor="quantity" className="text-body-sm font-semibold text-primary">
            New Quantity
          </label>
          <input
            id="quantity"
            type="number"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 bg-surface border border-separator rounded-lg text-sm text-primary focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all"
            autoFocus
          />
        </div>
      </form>
    </Modal>
  );
}
