'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { updateStaffMember } from '@/app/actions/staff';
import { toast } from 'sonner';

interface EditStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffMember: {
    id: string; // tenant_users.id
    full_name: string;
    role: string;
  } | null;
}

export function EditStaffModal({ isOpen, onClose, staffMember }: EditStaffModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState('member');
  const [fullName, setFullName] = useState('');
  const [customRoleText, setCustomRoleText] = useState('');

  useEffect(() => {
    if (staffMember) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFullName(staffMember.full_name);
      
      if (['admin', 'member'].includes(staffMember.role)) {
        setSelectedRole(staffMember.role);
        setCustomRoleText('');
      } else {
        setSelectedRole('custom');
        setCustomRoleText(staffMember.role);
      }
    }
  }, [staffMember]);

  if (!staffMember) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      let finalRole = selectedRole;
      if (selectedRole === 'custom') {
        finalRole = customRoleText ? customRoleText.toLowerCase() : 'member';
      }

      // Note: We don't handle role_id here yet, just string role matching for simplicity
      const res = await updateStaffMember(staffMember.id, {
        full_name: fullName,
        role: finalRole,
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
            <option value="custom">Other (Custom Role)</option>
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
                placeholder="e.g., Cashier, Attendant"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-separator">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
