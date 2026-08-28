'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { updateStaffMember } from '@/app/actions/staff';
import { toast } from 'sonner';

interface CustomRole {
  id: string;
  name: string;
}

interface EditStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffMember: {
    id: string; // tenant_users.id
    full_name: string;
    role: string;
    role_id?: string | null;
  } | null;
  customRoles?: CustomRole[];
}

export function EditStaffModal({ isOpen, onClose, staffMember, customRoles = [] }: EditStaffModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState('member');
  const [fullName, setFullName] = useState('');
  const [customRoleText, setCustomRoleText] = useState('');

  useEffect(() => {
    if (staffMember) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFullName(staffMember.full_name);

      const standardRoles = ['admin', 'member', 'owner'];
      const matchingCustomRole = customRoles.find(
        (cr) => cr.name.toLowerCase() === staffMember.role.toLowerCase() || cr.id === staffMember.role_id
      );

      if (standardRoles.includes(staffMember.role.toLowerCase())) {
        setSelectedRole(staffMember.role.toLowerCase());
        setCustomRoleText('');
      } else if (matchingCustomRole) {
        setSelectedRole(matchingCustomRole.name.toLowerCase());
        setCustomRoleText('');
      } else {
        setSelectedRole('custom');
        setCustomRoleText(staffMember.role);
      }
    }
  }, [staffMember, customRoles]);

  if (!staffMember) return null;

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let finalRole = selectedRole;
      let finalRoleId: string | null = null;

      const matchingCustomRole = customRoles.find((cr) => cr.name.toLowerCase() === selectedRole.toLowerCase());

      if (matchingCustomRole) {
        finalRole = matchingCustomRole.name.toLowerCase();
        finalRoleId = matchingCustomRole.id;
      } else if (selectedRole === 'custom') {
        finalRole = customRoleText ? customRoleText.toLowerCase() : 'member';
      }

      const res = await updateStaffMember(staffMember.id, {
        full_name: fullName,
        role: finalRole,
        role_id: finalRoleId,
      });

      if (res?.error) {
        toast.error(res.error);
        return;
      }

      toast.success('Staff member updated successfully!');
      onClose();
    } catch {
      toast.error('An unexpected error occurred while updating the team member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Team Member"
      description={`Update role and details for ${staffMember.full_name}.`}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="edit_full_name" className="text-sm font-medium text-foreground">
            Full Name
          </label>
          <input
            type="text"
            name="full_name"
            id="edit_full_name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="px-3 py-2 bg-surface border border-separator rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
            placeholder="e.g., Jane Doe"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="edit_role" className="text-sm font-medium text-foreground">
            Role
          </label>
          <select
            name="role"
            id="edit_role"
            className="px-3 py-2 bg-surface border border-separator rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="member">Member (Standard Access)</option>
            <option value="admin">Admin (Full Dashboard Access)</option>
            {customRoles.map((cr) => (
              <option key={cr.id} value={cr.name.toLowerCase()}>
                {cr.name} (Custom Role)
              </option>
            ))}
            <option value="custom">Other (Freeform Role)</option>
          </select>

          {selectedRole === 'custom' && (
            <div className="mt-2 flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2">
              <input
                type="text"
                name="custom_role"
                required
                value={customRoleText}
                onChange={(e) => setCustomRoleText(e.target.value)}
                className="px-3 py-2 bg-surface border border-separator rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                placeholder="e.g., Cashier, Logistics Lead"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-separator">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
