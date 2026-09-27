'use client';

import React, { useState, useEffect } from 'react';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { createTenantRole, updateTenantRole } from '@/app/actions/roles';
import { getTenantModuleSettingsAction } from '@/app/actions/tenant-modules';
import { filterPermissionsByModules } from '@/utils/business-modules';
import { BusinessModuleKey } from '@/types/business-modules';
import { toast } from 'sonner';
import { ShieldCheck, Check, CheckSquare, Square } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface TenantRole {
  id: string;
  name: string;
  description: string | null;
  permissions: string[] | null;
}

export interface RoleFormDrawerProps {
  children?: React.ReactNode;
  role?: TenantRole | null;
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

interface PermissionItem {
  id: string;
  label: string;
  description: string;
}

interface PermissionGroup {
  category: string;
  permissions: PermissionItem[];
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    category: 'Orders & Fulfilment',
    permissions: [
      { id: 'orders.view', label: 'View Orders', description: 'Browse order lists, invoices, and customer receipts' },
      { id: 'orders.manage', label: 'Manage Orders', description: 'Dispatch orders, assign riders, and update delivery statuses' },
    ],
  },
  {
    category: 'Customers & CRM',
    permissions: [
      { id: 'customers.view', label: 'View Customers', description: 'View customer directories, phone numbers, and history' },
      { id: 'customers.manage', label: 'Manage Customers', description: 'Add, edit, or adjust customer credit profiles' },
    ],
  },
  {
    category: 'Inventory & Logistics',
    permissions: [
      { id: 'inventory.view', label: 'View Inventory', description: 'View stock levels, batches, and product catalogs' },
      { id: 'inventory.manage', label: 'Manage Inventory', description: 'Create products, adjust stock, and transfer between branches' },
      { id: 'shipments.view', label: 'View Shipments', description: 'Track sea freight, air cargo, and customs clearances' },
      { id: 'shipments.manage', label: 'Manage Shipments', description: 'Log shipments, track containers, and update landed costs' },
    ],
  },
  {
    category: 'Point of Sale & Finance',
    permissions: [
      { id: 'pos.sell', label: 'POS Terminal (Sell)', description: 'Create walk-in orders and record point-of-sale transactions' },
      { id: 'expenses.view', label: 'View Expenses', description: 'View operating costs and petty cash logs' },
      { id: 'expenses.manage', label: 'Manage Expenses', description: 'Record store expenses and approval vouchers' },
      { id: 'reports.view', label: 'View Analytics & Profit', description: 'Access revenue metrics, gross margins, and profit reports' },
    ],
  },
  {
    category: 'Settings & Administration',
    permissions: [
      { id: 'settings.manage', label: 'Manage Settings', description: 'Configure store preferences, payments, and staff' },
      { id: 'stores.switch', label: 'Switch Branches', description: 'Switch active branch store context' },
    ],
  },
];

function RoleFormContent({
  role,
  onClose,
  onSuccess,
}: {
  role?: TenantRole | null;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const isEditing = Boolean(role);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState(role?.name || '');
  const [description, setDescription] = useState(role?.description || '');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(role?.permissions || []);
  const [activeModules, setActiveModules] = useState<BusinessModuleKey[] | null>(null);

  useEffect(() => {
    async function loadModules() {
      try {
        const res = await getTenantModuleSettingsAction();
        if (res.success && res.enabledModules) {
          setActiveModules(res.enabledModules);
        }
      } catch (err) {
        console.error('Failed to load tenant modules in role drawer:', err);
      }
    }
    loadModules();
  }, []);

  const displayedGroups = activeModules
    ? filterPermissionsByModules(activeModules, PERMISSION_GROUPS)
    : PERMISSION_GROUPS;

  const togglePermission = (id: string) => {
    if (selectedPermissions.includes(id)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== id));
    } else {
      setSelectedPermissions([...selectedPermissions, id]);
    }
  };

  const toggleGroup = (group: PermissionGroup) => {
    const groupIds = group.permissions.map((p) => p.id);
    const allSelected = groupIds.every((id) => selectedPermissions.includes(id));
    if (allSelected) {
      setSelectedPermissions(selectedPermissions.filter((id) => !groupIds.includes(id)));
    } else {
      const union = Array.from(new Set([...selectedPermissions, ...groupIds]));
      setSelectedPermissions(union);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please provide a role name');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set('name', name.trim());
      formData.set('description', description.trim());
      selectedPermissions.forEach((p) => formData.append('permissions', p));

      if (isEditing && role) {
        const res = await updateTenantRole(role.id, formData);
        if (res?.error) {
          toast.error(res.error);
          return;
        }
        toast.success('Role updated successfully!');
      } else {
        const res = await createTenantRole(formData);
        if (res?.error) {
          toast.error(res.error);
          return;
        }
        toast.success('Role created successfully!');
      }

      onClose();
      onSuccess?.();
      router.refresh();
    } catch {
      toast.error('An unexpected error occurred while saving the role.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form id="role-drawer-form" onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="role-name-input" className="block text-xs font-semibold text-foreground mb-1">
            Role Name *
          </label>
          <input
            type="text"
            id="role-name-input"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Store Cashier, Inventory Lead, Dispatch Officer"
            className="w-full bg-surface border border-separator rounded-xl px-3.5 py-2 text-xs placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary transition"
          />
        </div>

        <div>
          <label htmlFor="role-desc-input" className="block text-xs font-semibold text-foreground mb-1">
            Description (Optional)
          </label>
          <textarea
            id="role-desc-input"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief summary of duties and authorizations for this role."
            className="w-full bg-surface border border-separator rounded-xl px-3.5 py-2 text-xs placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary resize-none transition"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-separator pb-2">
          <span className="text-xs font-bold text-foreground uppercase tracking-wider">
            Permission Matrix
          </span>
          <span className="text-[11px] text-muted">
            Grouped by administrative domain
          </span>
        </div>

        <div className="space-y-5">
          {displayedGroups.map((group) => {
            const groupIds = group.permissions.map((p) => p.id);
            const allSelected = groupIds.every((id) => selectedPermissions.includes(id));

            return (
              <div key={group.category} className="bg-surface/50 border border-separator/70 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground">{group.category}</h4>
                  <button
                    type="button"
                    onClick={() => toggleGroup(group)}
                    className="text-[11px] font-medium text-brand-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {allSelected ? (
                      <>
                        <CheckSquare size={12} /> Deselect Group
                      </>
                    ) : (
                      <>
                        <Square size={12} /> Select Group
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {group.permissions.map((perm) => {
                    const isChecked = selectedPermissions.includes(perm.id);
                    return (
                      <label
                        key={perm.id}
                        className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-brand-primary/10 border-brand-primary/40 text-foreground'
                            : 'bg-surface border-separator hover:bg-surface-elevated text-muted hover:text-foreground'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePermission(perm.id)}
                          className="mt-0.5 rounded text-brand-primary focus:ring-brand-primary/50 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="font-semibold block text-foreground leading-tight">
                            {perm.label}
                          </span>
                          <span className="text-[10px] text-muted leading-normal mt-0.5 block">
                            {perm.description}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-4 border-t border-separator">
        <span className="text-xs text-muted">
          <strong>{selectedPermissions.length}</strong> permissions assigned
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isSubmitting || !name.trim()}
            isLoading={isSubmitting}
            leftIcon={!isSubmitting ? <Check size={14} /> : undefined}
          >
            {isEditing ? 'Save Changes' : 'Create Role'}
          </Button>
        </div>
      </div>
    </form>
  );
}

export function RoleFormDrawer({
  children,
  role,
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  onSuccess,
}: RoleFormDrawerProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = typeof controlledIsOpen === 'boolean';
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const isEditing = Boolean(role);

  const handleClose = () => {
    if (isControlled) {
      controlledOnClose?.();
    } else {
      setInternalIsOpen(false);
    }
  };

  return (
    <>
      {children && (
        <div onClick={() => setInternalIsOpen(true)} className="inline-block cursor-pointer">
          {children}
        </div>
      )}

      <Drawer
        isOpen={isOpen}
        onClose={handleClose}
        title={isEditing ? `Edit Role: ${role?.name}` : 'Create Custom Role'}
        icon={<ShieldCheck size={20} className="text-brand-primary" />}
        description="Define role details and granularly control staff capabilities."
        size="lg"
      >
        {isOpen && (
          <RoleFormContent
            key={role?.id || 'new-role'}
            role={role}
            onClose={handleClose}
            onSuccess={onSuccess}
          />
        )}
      </Drawer>
    </>
  );
}
