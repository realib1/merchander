'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { recordSupplierPayment } from '@/app/actions/suppliers';
import { toast } from 'sonner';

import { Modal } from '@/components/ui/Modal';

interface RecordPaymentModalProps {
  supplierId: string;
  supplierName: string;
}

export function RecordPaymentModal({ supplierId, supplierName }: RecordPaymentModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      formData.append('supplier_id', supplierId);

      const { error } = await recordSupplierPayment(formData);

      if (error) {
        toast.error(error);
      } else {
        toast.success('Payment recorded successfully');
        setIsOpen(false);
        router.refresh();
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        <CreditCard size={14} className="mr-2" />
        Pay
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Record Supplier Payment"
        description={`Recording a payment to ${supplierName}.`}
        size="md"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" form="supplier-payment-form" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Record Payment'
              )}
            </Button>
          </>
        }
      >
        <form id="supplier-payment-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium mb-1">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">GHS</span>
              <input
                type="number"
                id="amount"
                name="amount"
                step="0.01"
                min="0.01"
                required
                className="w-full pl-12 pr-4 py-2 bg-surface border border-separator rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label htmlFor="payment_date" className="block text-sm font-medium mb-1">
              Payment Date
            </label>
            <input
              type="date"
              id="payment_date"
              name="payment_date"
              required
              defaultValue={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 bg-surface border border-separator rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          <div>
            <label htmlFor="payment_method" className="block text-sm font-medium mb-1">
              Payment Method
            </label>
            <select
              id="payment_method"
              name="payment_method"
              required
              className="w-full px-4 py-2 bg-surface border border-separator rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary"
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="cash">Cash</option>
              <option value="crypto">Cryptocurrency</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="reference_number" className="block text-sm font-medium mb-1">
              Reference / Transaction ID
            </label>
            <input
              type="text"
              id="reference_number"
              name="reference_number"
              className="w-full px-4 py-2 bg-surface border border-separator rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary"
              placeholder="e.g. TXN-123456"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium mb-1">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={2}
              className="w-full px-4 py-2 bg-surface border border-separator rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>
        </form>
      </Modal>
    </>
  );
}
