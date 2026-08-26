'use client';

import { Trash2 } from 'lucide-react';
import { deleteTenantRole } from '@/app/actions/roles';
import { toast } from 'sonner';

interface DeleteRoleButtonProps {
  roleId: string;
  roleName: string;
}

export function DeleteRoleButton({ roleId, roleName }: DeleteRoleButtonProps) {
  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete the ${roleName} role? Users assigned to this role will lose their custom permissions.`)) {
      return;
    }

    try {
      const res = await deleteTenantRole(roleId);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`${roleName} role deleted successfully.`);
    } catch {
      toast.error('An unexpected error occurred while deleting the role.');
    }
  };

  return (
    <button
      onClick={handleDelete}
      className="p-2 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
      title="Delete Role"
      aria-label="Delete Role"
    >
      <Trash2 size={16} />
    </button>
  );
}
