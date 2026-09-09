'use client';

import React, { useState, useTransition } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { addPlatformStaffAction } from '@/app/actions/platform-staff';
import type { PlatformStaffUser, PlatformRole } from '@/types/platform';

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStaffAdded: (staff: PlatformStaffUser) => void;
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

export function AddStaffModal({ isOpen, onClose, onStaffAdded }: AddStaffModalProps) {
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<PlatformRole>('support');
  const [reason, setReason] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleClose = () => {
    if (isPending) return;
    setEmail('');
    setSelectedRole('support');
    setReason('');
    setErrorMessage(null);
    setSuccessMessage(null);
    onClose();
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Staff email is required');
      return;
    }

    startTransition(async () => {
      const res = await addPlatformStaffAction({
        email,
        role: selectedRole,
        reason,
      });

      if (res.success) {
        const newStaff: PlatformStaffUser = {
          id: `staff_${Date.now()}`,
          user_id: `uid_${Date.now()}`,
          email: email.trim().toLowerCase(),
          role: selectedRole,
          is_active: true,
          mfa_enabled: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        onStaffAdded(newStaff);
        setSuccessMessage(`Staff member ${email} added successfully!`);
        setTimeout(() => {
          handleClose();
        }, 600);
      } else {
        setErrorMessage(res.error || 'Failed to add staff member');
      }
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex flex-col">
          <span className="text-xs font-mono font-bold text-brand-primary uppercase tracking-wider">
            Staff Onboarding
          </span>
          <span className="text-base font-bold text-foreground font-display mt-0.5">
            Add Platform Staff Member
          </span>
        </div>
      }
      description="Provision internal platform access under role-based access control."
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="ghost" size="sm" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleAddStaff}
            isLoading={isPending}
            className="font-bold"
          >
            Add Staff User
          </Button>
        </div>
      }
    >
      <form onSubmit={handleAddStaff} className="space-y-4 text-xs">
        <div className="space-y-1.5">
          <label className="font-semibold text-foreground block">Staff Email Address</label>
          <input
            type="email"
            required
            placeholder="e.g., alex@merchander.app"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-surface-elevated border border-separator rounded-xl px-3 py-2 text-foreground focus:outline-hidden focus:border-brand-primary font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <label className="font-semibold text-foreground block">Assigned Platform Role</label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as PlatformRole)}
            className="w-full bg-surface-elevated border border-separator rounded-xl px-3 py-2 text-foreground focus:outline-hidden focus:border-brand-primary font-medium"
          >
            {Object.entries(ROLE_INFO).map(([key, info]) => (
              <option key={key} value={key}>
                {info.label}: {info.description.substring(0, 45)}...
              </option>
            ))}
          </select>
          <p className="text-[11px] text-muted leading-relaxed mt-1">
            {ROLE_INFO[selectedRole].description}
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="font-semibold text-foreground block">
            Onboarding Reason <span className="text-muted font-normal">(Logged to Audit Trail)</span>
          </label>
          <input
            type="text"
            placeholder="e.g., Onboarding Operations Lead for Ghana market"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-surface-elevated border border-separator rounded-xl px-3 py-2 text-foreground focus:outline-hidden focus:border-brand-primary"
          />
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-xs">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs">
            {successMessage}
          </div>
        )}
      </form>
    </Modal>
  );
}
