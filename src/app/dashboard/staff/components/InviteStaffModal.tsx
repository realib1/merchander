'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { inviteStaffMember } from '@/app/actions/staff';
import { toast } from 'sonner';

interface CustomRole {
  id: string;
  name: string;
}

interface InviteStaffModalProps {
  children: React.ReactNode;
  customRoles?: CustomRole[];
}

export function InviteStaffModal({ children, customRoles = [] }: InviteStaffModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState('member');

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);

      // If custom role, replace the role value with the custom one
      if (selectedRole === 'custom') {
        const customRole = formData.get('custom_role') as string;
        if (customRole) {
          formData.set('role', customRole.toLowerCase());
        } else {
          formData.set('role', 'member');
        }
      }

      const res = await inviteStaffMember(formData);

      if (res?.error) {
        toast.error(res.error);
        return;
      }

      toast.success('Invitation sent successfully!');
      setIsOpen(false);
    } catch {
      toast.error('An unexpected error occurred while sending the invitation.');
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
        title="Invite Team Member"
        description="Invite a new member to join your team."
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="full_name" className="text-sm font-medium text-foreground">
              Full Name
            </label>
            <input
              type="text"
              name="full_name"
              id="full_name"
              required
              className="px-3 py-2 bg-surface border border-separator rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
              placeholder="e.g., Jane Doe"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              id="email"
              required
              className="px-3 py-2 bg-surface border border-separator rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
              placeholder="jane@example.com"
            />
            <p className="text-xs text-muted">They will receive an email to join the team.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="role" className="text-sm font-medium text-foreground">
              Role
            </label>
            <select
              name="role"
              id="role"
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
              <option value="custom">Other (Create New Role on Invite)</option>
            </select>

            {selectedRole === 'custom' && (
              <div className="mt-2 flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2">
                <input
                  type="text"
                  name="custom_role"
                  id="custom_role"
                  required
                  className="px-3 py-2 bg-surface border border-separator rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                  placeholder="e.g., Cashier, Attendant, Receptionist"
                />
              </div>
            )}
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
              className="px-4 py-2 text-sm font-medium bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
