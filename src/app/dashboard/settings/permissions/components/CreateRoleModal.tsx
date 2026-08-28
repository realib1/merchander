'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { createTenantRole } from '@/app/actions/roles';
import { toast } from 'sonner';

interface CreateRoleModalProps {
  children: React.ReactNode;
}

const AVAILABLE_PERMISSIONS = [
  { id: 'orders.view', label: 'View Orders' },
  { id: 'orders.manage', label: 'Manage Orders' },
  { id: 'customers.view', label: 'View Customers' },
  { id: 'customers.manage', label: 'Manage Customers' },
  { id: 'inventory.view', label: 'View Inventory' },
  { id: 'inventory.manage', label: 'Manage Inventory' },
  { id: 'pos.sell', label: 'Point of Sale (Sell)' },
  { id: 'reports.view', label: 'View Reports/Profit' },
  { id: 'settings.manage', label: 'Manage Settings' },
  { id: 'stores.switch', label: 'Switch Branches/Stores' },
];

export function CreateRoleModal({ children }: CreateRoleModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const res = await createTenantRole(formData);

      if (res?.error) {
        toast.error(res.error);
        return;
      }

      toast.success('Role created successfully!');
      setIsOpen(false);
    } catch {
      toast.error('An unexpected error occurred while creating the role.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div onClick={() => setIsOpen(true)} className="inline-block cursor-pointer">
        {children}
      </div>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Create Custom Role"
        description="Define a new role and select its specific permissions."
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-sm font-medium text-foreground">
              Role Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              required
              className="px-3 py-2 bg-surface border border-separator rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
              placeholder="e.g., Cashier, Inventory Manager"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-sm font-medium text-foreground">
              Description (Optional)
            </label>
            <textarea
              name="description"
              id="description"
              rows={2}
              className="px-3 py-2 bg-surface border border-separator rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50 resize-none"
              placeholder="Brief description of what this role does."
            />
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <label className="text-sm font-medium text-foreground">Permissions</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-62.5 overflow-y-auto custom-scrollbar p-1">
              {AVAILABLE_PERMISSIONS.map((perm) => (
                <label
                  key={perm.id}
                  className="flex items-start gap-2.5 p-2.5 border border-separator rounded-lg cursor-pointer hover:bg-surface-elevated/50 transition-colors"
                >
                  <input
                    type="checkbox"
                    name="permissions"
                    value={perm.id}
                    className="mt-0.5 rounded border-separator text-brand-primary focus:ring-brand-primary/50"
                  />
                  <span className="text-sm text-foreground select-none leading-snug">{perm.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-separator">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? 'Creating...' : 'Create Role'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
