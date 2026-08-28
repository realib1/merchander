'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { updateTenantRole } from '@/app/actions/roles';
import { toast } from 'sonner';

interface TenantRole {
  id: string;
  name: string;
  description: string | null;
  permissions: string[] | null;
}

interface EditRoleModalProps {
  children: React.ReactNode;
  role: TenantRole;
}

const AVAILABLE_PERMISSIONS = [
  { id: 'orders.view', label: 'View Orders' },
  { id: 'orders.manage', label: 'Manage Orders' },
  { id: 'customers.view', label: 'View Customers' },
  { id: 'customers.manage', label: 'Manage Customers' },
  { id: 'inventory.view', label: 'View Inventory' },
  { id: 'inventory.manage', label: 'Manage Inventory' },
  { id: 'shipments.view', label: 'View Shipments & Freight' },
  { id: 'shipments.manage', label: 'Manage Shipments & Freight' },
  { id: 'expenses.view', label: 'View Expenses' },
  { id: 'expenses.manage', label: 'Manage Expenses' },
  { id: 'pos.sell', label: 'Point of Sale (Sell)' },
  { id: 'reports.view', label: 'View Reports / Profit' },
  { id: 'settings.manage', label: 'Manage Settings' },
  { id: 'stores.switch', label: 'Switch Branches / Stores' },
];

export function EditRoleModal({ children, role }: EditRoleModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState(role.name);
  const [description, setDescription] = useState(role.description || '');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(role.permissions || []);

  const togglePermission = (id: string) => {
    if (selectedPermissions.includes(id)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== id));
    } else {
      setSelectedPermissions([...selectedPermissions, id]);
    }
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.set('name', name);
      formData.set('description', description);
      selectedPermissions.forEach((p) => formData.append('permissions', p));

      const res = await updateTenantRole(role.id, formData);

      if (res?.error) {
        toast.error(res.error);
        return;
      }

      toast.success('Role updated successfully!');
      setIsOpen(false);
    } catch {
      toast.error('An unexpected error occurred while updating the role.');
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
        title={`Edit Role: ${role.name}`}
        description="Update role name, description, and assigned permissions."
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`role-name-${role.id}`} className="text-sm font-medium text-foreground">
              Role Name
            </label>
            <input
              type="text"
              id={`role-name-${role.id}`}
              name="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3 py-2 bg-surface border border-separator rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
              placeholder="e.g., Cashier, Inventory Lead"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor={`role-desc-${role.id}`} className="text-sm font-medium text-foreground">
              Description (Optional)
            </label>
            <textarea
              id={`role-desc-${role.id}`}
              name="description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="px-3 py-2 bg-surface border border-separator rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50 resize-none"
              placeholder="Brief description of what this role does."
            />
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <label className="text-sm font-medium text-foreground">Permissions</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto custom-scrollbar p-1">
              {AVAILABLE_PERMISSIONS.map((perm) => {
                const isChecked = selectedPermissions.includes(perm.id);
                return (
                  <label
                    key={perm.id}
                    className={`flex items-start gap-2.5 p-2.5 border rounded-lg cursor-pointer transition-all ${
                      isChecked
                        ? 'border-brand-primary/40 bg-brand-primary/5'
                        : 'border-separator hover:bg-surface-elevated/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => togglePermission(perm.id)}
                      className="mt-0.5 rounded border-separator text-brand-primary focus:ring-brand-primary/50"
                    />
                    <span className="text-sm text-foreground select-none leading-snug">{perm.label}</span>
                  </label>
                );
              })}
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
              className="px-4 py-2 text-sm font-medium bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
