'use client';

import React, { useState, useTransition } from 'react';
import {
  UserPlus,
  ShieldCheck,
  Trash2,
  Shield,
} from 'lucide-react';
import { PlatformStaffUser, PlatformRole } from '@/types/platform';
import {
  updatePlatformStaffRoleAction,
  togglePlatformStaffStatusAction,
  removePlatformStaffAction,
} from '@/app/actions/platform-staff';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { AddStaffModal } from './AddStaffModal';

interface StaffManagementClientProps {
  initialStaff: PlatformStaffUser[];
  currentStaffRole: PlatformRole;
}

const ROLE_INFO: Record<
  PlatformRole,
  { label: string; badgeColor: string; description: string }
> = {
  platform_owner: {
    label: 'Platform Owner',
    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    description: 'Highest platform authority. Full control, staff management, plan pricing overrides.',
  },
  platform_admin: {
    label: 'Platform Admin',
    badgeColor: 'bg-brand-primary/10 text-brand-primary border-brand-primary/20',
    description: 'General platform operations, tenant lifecycle, subscription management.',
  },
  operations: {
    label: 'Operations',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    description: 'Tenant monitoring, background jobs, connector throughput tracking.',
  },
  support: {
    label: 'Support',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    description: 'Ticket triage, merchant assistance, diagnostic context with stated reason.',
  },
  finance: {
    label: 'Finance',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    description: 'Platform MRR/ARR analytics, billing history, payment settlement health.',
  },
  tech_admin: {
    label: 'Technical Admin',
    badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    description: 'Platform infrastructure, webhooks, DNS/SSL monitoring, system health.',
  },
  compliance: {
    label: 'Compliance / Security',
    badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    description: 'Immutable audit logs review, security incidents, access governance.',
  },
};

export function StaffManagementClient({
  initialStaff,
  currentStaffRole,
}: StaffManagementClientProps) {
  const [staffList, setStaffList] = useState<PlatformStaffUser[]>(initialStaff);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [statusToggleTarget, setStatusToggleTarget] = useState<PlatformStaffUser | null>(null);
  const [removeTarget, setRemoveTarget] = useState<PlatformStaffUser | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  const handleRoleChange = (staffId: string, newRole: PlatformRole) => {
    startTransition(async () => {
      const res = await updatePlatformStaffRoleAction(staffId, newRole);
      if (res.success) {
        toast.success('Staff role updated');
        setStaffList((prev) =>
          prev.map((s) => (s.id === staffId ? { ...s, role: newRole } : s))
        );
      } else {
        toast.error(res.error || 'Failed to update role');
      }
    });
  };

  const handleToggleStatus = (staff: PlatformStaffUser) => {
    setStatusToggleTarget(staff);
  };

  const confirmToggleStatus = () => {
    if (!statusToggleTarget) return;
    const staff = statusToggleTarget;
    const nextStatus = !staff.is_active;

    startTransition(async () => {
      const res = await togglePlatformStaffStatusAction(staff.id, nextStatus);
      if (res.success) {
        toast.success(nextStatus ? 'Staff access reactivated' : 'Staff access deactivated');
        setStaffList((prev) =>
          prev.map((s) => (s.id === staff.id ? { ...s, is_active: nextStatus } : s))
        );
        setStatusToggleTarget(null);
      } else {
        toast.error(res.error || 'Failed to update staff status');
      }
    });
  };

  const handleRemoveStaff = (staff: PlatformStaffUser) => {
    setRemoveTarget(staff);
  };

  const confirmRemoveStaff = () => {
    if (!removeTarget) return;
    const staff = removeTarget;

    startTransition(async () => {
      const res = await removePlatformStaffAction(staff.id);
      if (res.success) {
        toast.success('Staff member removed successfully');
        setStaffList((prev) => prev.filter((s) => s.id !== staff.id));
        setRemoveTarget(null);
      } else {
        toast.error(res.error || 'Failed to remove staff member');
      }
    });
  };

  return (
    <div className="space-y-5">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-4 rounded-2xl border border-separator shadow-xs">
        <div>
          <div className="text-xs font-bold text-foreground flex items-center gap-2">
            <Shield size={14} className="text-brand-primary" />
            <span>Platform Staff Users & Role-Based Access Control (RBAC)</span>
          </div>
          <div className="text-xs text-muted mt-0.5">
            Manage internal staff members, enforce least-privilege role boundaries, and govern access states.
          </div>
        </div>

        {(currentStaffRole === 'platform_owner' || currentStaffRole === 'platform_admin') && (
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-brand-primary text-brand-primary-foreground hover:opacity-90 transition-opacity shadow-xs shrink-0 cursor-pointer"
          >
            <UserPlus size={14} />
            <span>Add Platform Staff</span>
          </button>
        )}
      </div>

      {/* Staff Roster Table */}
      <div className="bg-surface rounded-2xl border border-separator overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-elevated text-muted font-mono uppercase text-[10px] border-b border-separator">
              <tr>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Access Status</th>
                <th className="py-3 px-4">Security / MFA</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-separator/60">
              {staffList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-muted">
                    No platform staff users registered.
                  </td>
                </tr>
              ) : (
                staffList.map((staff) => {
                  const roleConfig = ROLE_INFO[staff.role] || ROLE_INFO.support;

                  return (
                    <tr
                      key={staff.id}
                      className={`hover:bg-surface-elevated/50 transition-colors ${
                        !staff.is_active ? 'opacity-60 bg-surface/40' : ''
                      }`}
                    >
                      {/* Email & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary flex items-center justify-center font-bold font-mono text-xs shrink-0">
                            {staff.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-foreground font-mono">{staff.email}</div>
                            <div className="text-[11px] text-muted font-mono">
                              Added {new Date(staff.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Selector */}
                      <td className="py-3.5 px-4 font-mono">
                        {currentStaffRole === 'platform_owner' ? (
                          <select
                            disabled={isPending}
                            value={staff.role}
                            onChange={(e) => handleRoleChange(staff.id, e.target.value as PlatformRole)}
                            className="bg-surface-elevated border border-separator rounded-lg px-2.5 py-1 text-xs text-foreground cursor-pointer focus:outline-hidden font-semibold"
                          >
                            {Object.entries(ROLE_INFO).map(([key, info]) => (
                              <option key={key} value={key}>
                                {info.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${roleConfig.badgeColor}`}
                          >
                            {roleConfig.label}
                          </span>
                        )}
                      </td>

                      {/* Access Status */}
                      <td className="py-3.5 px-4 font-mono">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            staff.is_active
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-destructive/10 text-destructive border-destructive/20'
                          }`}
                        >
                          {staff.is_active ? 'Active' : 'Deactivated'}
                        </span>
                      </td>

                      {/* Security MFA */}
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <div className="flex items-center gap-1 text-emerald-400">
                          <ShieldCheck size={13} />
                          <span>MFA Enforced</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            disabled={isPending}
                            onClick={() => handleToggleStatus(staff)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                              staff.is_active
                                ? 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            }`}
                          >
                            {staff.is_active ? 'Deactivate' : 'Reactivate'}
                          </button>

                          {currentStaffRole === 'platform_owner' && (
                            <button
                              disabled={isPending}
                              onClick={() => handleRemoveStaff(staff)}
                              className="p-1.5 rounded-lg text-muted hover:text-destructive hover:bg-destructive/10 border border-separator transition-colors cursor-pointer"
                              title="Delete Staff User"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      <AddStaffModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onStaffAdded={(newStaff) => setStaffList((prev) => [newStaff, ...prev])}
      />

      <ConfirmDialog
        isOpen={!!statusToggleTarget}
        onClose={() => setStatusToggleTarget(null)}
        onConfirm={confirmToggleStatus}
        title={statusToggleTarget?.is_active ? 'Deactivate Platform Staff' : 'Reactivate Platform Staff'}
        description={
          statusToggleTarget?.is_active
            ? `Deactivate platform access for ${statusToggleTarget?.email}? They will be immediately blocked from Admin.`
            : `Reactivate platform access for ${statusToggleTarget?.email}?`
        }
        confirmText={statusToggleTarget?.is_active ? 'Deactivate Staff' : 'Reactivate Staff'}
        isDestructive={statusToggleTarget?.is_active}
        isLoading={isPending}
      />

      <ConfirmDialog
        isOpen={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={confirmRemoveStaff}
        title="Remove Platform Staff"
        description={`Permanently remove ${removeTarget?.email || 'this user'} from Platform Staff? This action cannot be undone.`}
        confirmText="Remove Staff"
        isDestructive
        isLoading={isPending}
      />
    </div>
  );
}
