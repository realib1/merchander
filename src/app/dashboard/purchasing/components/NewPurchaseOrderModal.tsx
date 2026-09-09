'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import { createPurchaseOrder } from '@/app/actions/purchasing';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';

interface Supplier {
  id: string;
  name: string;
}

export function NewPurchaseOrderModal({ suppliers }: { suppliers: Supplier[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const { error } = await createPurchaseOrder(formData);

    setIsSubmitting(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success('Purchase order created successfully');
      setIsOpen(false);
    }
  };

  return (
    <>
      <Button variant="primary" onClick={() => setIsOpen(true)}>
        <Plus className="w-4 h-4 mr-2" />
        New Purchase Order
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="New Purchase Order"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="supplier_id" className="text-sm font-semibold">
              Supplier *
            </label>
            <select
              id="supplier_id"
              name="supplier_id"
              required
              className="w-full px-3 py-2 bg-surface-elevated border border-separator rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all"
            >
              <option value="">Select Supplier...</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="tracking_number" className="text-sm font-semibold">
              Tracking Number
            </label>
            <input
              type="text"
              id="tracking_number"
              name="tracking_number"
              className="w-full px-3 py-2 bg-surface-elevated border border-separator rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all"
              placeholder="e.g. TRK123456789"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="eta" className="text-sm font-semibold">
              Estimated Time of Arrival (ETA)
            </label>
            <input
              type="date"
              id="eta"
              name="eta"
              className="w-full px-3 py-2 bg-surface-elevated border border-separator rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all text-muted"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="space-y-1.5">
              <label htmlFor="supplier_cost" className="text-sm font-semibold">
                Supplier Cost
              </label>
              <input
                type="number"
                id="supplier_cost"
                name="supplier_cost"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 bg-surface-elevated border border-separator rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="shipping_cost" className="text-sm font-semibold">
                Shipping Cost
              </label>
              <input
                type="number"
                id="shipping_cost"
                name="shipping_cost"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 bg-surface-elevated border border-separator rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="import_cost" className="text-sm font-semibold">
                Clearance & Duties
              </label>
              <input
                type="number"
                id="import_cost"
                name="import_cost"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 bg-surface-elevated border border-separator rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Purchase Order'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
