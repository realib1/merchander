'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { removeStaffMember, sendPasswordReset } from '@/app/actions/staff';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EditStaffModal } from './EditStaffModal';
import { StaffFilterToolbar } from './StaffFilterToolbar';
import { StaffTableRow, StaffMember } from './StaffTableRow';

interface CustomRole {
  id: string;
  name: string;
}

interface StaffTableProps {
  staff: StaffMember[];
  customRoles?: CustomRole[];
}

export function StaffTable({ staff, customRoles = [] }: StaffTableProps) {
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredStaff = useMemo(() => {
    return staff.filter((member) => {
      const matchesSearch =
        member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === 'all' || member.role.toLowerCase() === roleFilter.toLowerCase();

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && member.last_sign_in_at !== null) ||
        (statusFilter === 'pending' && member.last_sign_in_at === null);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [staff, searchQuery, roleFilter, statusFilter]);

  const handleRemove = (id: string, name: string) => {
    setOpenDropdownId(null);
    setMemberToRemove({ id, name });
  };

  const confirmRemove = async () => {
    if (!memberToRemove) return;

    setIsRemoving(true);
    try {
      const res = await removeStaffMember(memberToRemove.id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`${memberToRemove.name} has been removed.`);
        setMemberToRemove(null);
      }
    } catch {
      toast.error('Failed to remove staff member');
    } finally {
      setIsRemoving(false);
    }
  };

  const handlePasswordReset = async (userId: string, name: string) => {
    setOpenDropdownId(null);
    const res = await sendPasswordReset(userId);
    if (res.error) toast.error(res.error);
    else toast.success(`Password reset email sent for ${name}.`);
  };

  return (
    <div className="space-y-4" ref={dropdownRef}>
      <StaffFilterToolbar
        searchQuery={searchQuery}
        roleFilter={roleFilter}
        statusFilter={statusFilter}
        customRoles={customRoles}
        onSearchChange={setSearchQuery}
        onRoleFilterChange={setRoleFilter}
        onStatusFilterChange={setStatusFilter}
      />

      <div className="bg-surface border border-separator rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-separator bg-surface-elevated/40 text-xs font-semibold text-muted">
                <th className="px-6 py-4">Team Member</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4 hidden md:table-cell">Status</th>
                <th className="px-6 py-4 hidden lg:table-cell">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-separator/40">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted">
                    No team members found matching your search.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((member) => (
                  <StaffTableRow
                    key={member.id}
                    member={member}
                    isDropdownOpen={openDropdownId === member.id}
                    onToggleDropdown={(id) => setOpenDropdownId(openDropdownId === id ? null : id)}
                    onEdit={(m) => setEditingStaff(m)}
                    onPasswordReset={handlePasswordReset}
                    onRemove={handleRemove}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingStaff && (
        <EditStaffModal
          isOpen={editingStaff !== null}
          staffMember={editingStaff}
          customRoles={customRoles}
          onClose={() => setEditingStaff(null)}
        />
      )}

      <ConfirmDialog
        isOpen={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={confirmRemove}
        title="Remove Team Member"
        description={`Are you sure you want to remove ${memberToRemove?.name || 'this member'} from your team? They will lose access immediately.`}
        confirmText="Remove Member"
        isDestructive
        isLoading={isRemoving}
      />
    </div>
  );
}
