'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Plus, X } from 'lucide-react';
import { createSupplier } from '@/app/actions/suppliers';
import { toast } from 'sonner';

export function NewSupplierModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const { error } = await createSupplier(formData);

    setIsSubmitting(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success('Supplier added successfully');
      setIsOpen(false);
    }
  };

  return (
    <>
      <Button variant="primary" onClick={() => setIsOpen(true)}>
        <Plus className="w-4 h-4 mr-2" />
        Add Supplier
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface border border-separator rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-scaleIn">
            <div className="flex items-center justify-between p-4 border-b border-separator">
              <h2 className="text-lg font-bold">Add Supplier</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full text-muted hover:bg-surface-elevated hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-sm font-semibold">
                  Supplier Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full px-3 py-2 bg-surface-elevated border border-separator rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all"
                  placeholder="e.g. Acme Corp"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="contact_name" className="text-sm font-semibold">
                  Contact Person
                </label>
                <input
                  type="text"
                  id="contact_name"
                  name="contact_name"
                  className="w-full px-3 py-2 bg-surface-elevated border border-separator rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-semibold">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="w-full px-3 py-2 bg-surface-elevated border border-separator rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all"
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="phone" className="text-sm font-semibold">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className="w-full px-3 py-2 bg-surface-elevated border border-separator rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all"
                    placeholder="+233..."
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="country" className="text-sm font-semibold">
                  Country
                </label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  defaultValue="Ghana"
                  className="w-full px-3 py-2 bg-surface-elevated border border-separator rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Supplier'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
