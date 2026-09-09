'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteTenantRole } from '@/app/actions/roles';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface DeleteRoleButtonProps {
  roleId: string;
  roleName: string;
}

export function DeleteRoleButton({ roleId, roleName }: DeleteRoleButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteTenantRole(roleId);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`${roleName} role deleted successfully.`);
      setIsOpen(false);
    } catch {
      toast.error('An unexpected error occurred while deleting the role.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
        title="Delete Role"
        aria-label="Delete Role"
      >
        <Trash2 size={16} />
      </button>

      <ConfirmDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Role"
        description={`Are you sure you want to delete the ${roleName} role? Users assigned to this role will lose their custom permissions.`}
        confirmText="Delete Role"
        isDestructive
        isLoading={isDeleting}
      />
    </>
  );
}
