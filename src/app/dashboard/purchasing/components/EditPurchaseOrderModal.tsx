'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Edit, X } from 'lucide-react';
import { updatePurchaseOrder } from '@/app/actions/purchasing';
import { toast } from 'sonner';

interface PurchaseOrder {
  id: string;
  po_number: string;
  tracking_number: string | null;
  status: string;
  eta: string | null;
  supplier_cost: number;
  shipping_cost: number;
  import_cost: number;
}

export function EditPurchaseOrderModal({ po }: { po: PurchaseOrder }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const { error } = await updatePurchaseOrder(po.id, formData);
    
    setIsSubmitting(false);
    
    if (error) {
      toast.error(error);
    } else {
      toast.success('Purchase order updated successfully');
      setIsOpen(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="p-1.5 rounded-md text-muted hover:bg-surface-elevated hover:text-brand-primary transition-colors"
        title="Edit Purchase Order"
      >
        <Edit size={16} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm text-left whitespace-normal">
          <div className="bg-surface border border-separator rounded-2xl w-full max-w-lg overflow-hidden shadow-xl animate-scaleIn">
            <div className="flex items-center justify-between p-4 border-b border-separator">
              <h2 className="text-lg font-bold">Edit {po.po_number}</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full text-muted hover:bg-surface-elevated hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="status" className="text-sm font-semibold">Status</label>
                <select 
                  id="status" 
                  name="status" 
                  defaultValue={po.status}
                  className="w-full px-3 py-2 bg-surface-elevated border border-separator rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all"
                >
                  <option value="draft">Draft</option>
                  <option value="ordered">Ordered</option>
                  <option value="partially_received">Partially Received</option>
                  <option value="received">Received</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="tracking_number" className="text-sm font-semibold">Tracking Number</label>
                <input 
                  type="text" 
                  id="tracking_number" 
                  name="tracking_number" 
                  defaultValue={po.tracking_number || ''}
                  className="w-full px-3 py-2 bg-surface-elevated border border-separator rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all"
                  placeholder="e.g. TRK123456789"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="eta" className="text-sm font-semibold">Estimated Time of Arrival (ETA)</label>
                <input 
                  type="date" 
                  id="eta" 
                  name="eta"
                  defaultValue={po.eta ? new Date(po.eta).toISOString().split('T')[0] : ''} 
                  className="w-full px-3 py-2 bg-surface-elevated border border-separator rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all text-muted"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label htmlFor="supplier_cost" className="text-sm font-semibold">Supplier Cost</label>
                  <input 
                    type="number" 
                    id="supplier_cost" 
                    name="supplier_cost" 
                    step="0.01"
                    min="0"
                    defaultValue={po.supplier_cost}
                    className="w-full px-3 py-2 bg-surface-elevated border border-separator rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="shipping_cost" className="text-sm font-semibold">Shipping Cost</label>
                  <input 
                    type="number" 
                    id="shipping_cost" 
                    name="shipping_cost" 
                    step="0.01"
                    min="0"
                    defaultValue={po.shipping_cost}
                    className="w-full px-3 py-2 bg-surface-elevated border border-separator rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="import_cost" className="text-sm font-semibold">Clearance & Duties</label>
                  <input 
                    type="number" 
                    id="import_cost" 
                    name="import_cost" 
                    step="0.01"
                    min="0"
                    defaultValue={po.import_cost}
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
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
