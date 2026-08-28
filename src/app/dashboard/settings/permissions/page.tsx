import { Metadata } from 'next';
import { getTenantRoles } from '@/app/actions/roles';
import { ShieldCheck, Plus, Pencil } from 'lucide-react';
import { CreateRoleModal } from './components/CreateRoleModal';
import { EditRoleModal } from './components/EditRoleModal';
import { DeleteRoleButton } from './components/DeleteRoleButton';

export const metadata: Metadata = {
  title: 'Roles & Permissions | Merchander',
  description: 'Manage custom roles and permissions for your team.',
};

export default async function PermissionsPage() {
  const { data: roles, error } = await getTenantRoles();

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Roles & Permissions</h1>
          <p className="text-sm text-muted mt-1">
            Create custom roles to granularly control what your staff can see and do.
          </p>
        </div>
        <CreateRoleModal>
          <button className="inline-flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-primary/90 transition-colors shadow-sm cursor-pointer">
            <Plus size={16} />
            Create Role
          </button>
        </CreateRoleModal>
      </div>

      {error ? (
        <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-sm">
          Failed to load roles: {error}
        </div>
      ) : (
        <div className="bg-surface border border-separator rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap min-w-150">
              <thead>
                <tr className="text-xs font-semibold bg-surface-elevated/30 border-b border-separator">
                  <th className="px-6 py-4">Role Name</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Permissions</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-separator">
                {roles && roles.length > 0 ? (
                  roles.map((role) => (
                    <tr key={role.id} className="hover:bg-surface-elevated/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
                          <ShieldCheck size={16} className="text-brand-primary" />
                          {role.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted whitespace-normal min-w-50">
                        {role.description || 'No description provided.'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5 max-w-75">
                          {((role.permissions as string[]) || []).map((p) => (
                            <span
                              key={p}
                              className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-elevated border border-separator text-foreground"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <EditRoleModal role={role}>
                            <button
                              className="p-2 hover:text-foreground hover:bg-surface-elevated rounded-lg transition-colors"
                              title="Edit Role"
                              aria-label={`Edit ${role.name} role`}
                            >
                              <Pencil size={16} />
                            </button>
                          </EditRoleModal>
                          <DeleteRoleButton roleId={role.id} roleName={role.name} />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center">
                      <p className="text-muted text-sm">No custom roles created yet.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
