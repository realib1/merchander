'use client';

import React, { useState, useTransition } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AlertTriangle } from 'lucide-react';
import { updateTenantStatusAction } from '@/app/actions/platform';
import { toast } from 'sonner';
import type { PlatformTenant, TenantPlatformStatus } from '@/types/platform';

interface MerchantStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: PlatformTenant | null;
  initialStatus?: TenantPlatformStatus;
  onSuccess: (newStatus: TenantPlatformStatus) => void;
}

function MerchantStatusFormContent({
  tenant,
  initialStatus,
  onClose,
  onSuccess,
}: {
  tenant: PlatformTenant;
  initialStatus?: TenantPlatformStatus;
  onClose: () => void;
  onSuccess: (newStatus: TenantPlatformStatus) => void;
}) {
  const [targetStatus, setTargetStatus] = useState<TenantPlatformStatus>(
    initialStatus || (tenant.status as TenantPlatformStatus) || 'active'
  );
  const [statusReason, setStatusReason] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSaveStatus = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!statusReason.trim()) {
      setModalError('A mandatory reason is required for status changes');
      return;
    }

    startTransition(async () => {
      const res = await updateTenantStatusAction(tenant.id, targetStatus, statusReason);
      if (!res.success) {
        setModalError(res.error || 'Failed to update tenant status');
        return;
      }
      toast.success(`Updated status for ${tenant.name} to ${targetStatus}`);
      onSuccess(targetStatus);
      onClose();
    });
  };

  return (
    <form onSubmit={handleSaveStatus} className="space-y-4 text-xs">
      <div className="space-y-1.5">
        <label className="font-semibold text-foreground block">Select Target Status</label>
        <select
          value={targetStatus}
          onChange={(e) => setTargetStatus(e.target.value as TenantPlatformStatus)}
          className="w-full bg-surface-elevated border border-separator rounded-xl px-3 py-2 text-foreground focus:outline-hidden font-medium capitalize"
        >
          <option value="active">Active (Full platform and checkout access)</option>
          <option value="trial">Trial (Extended evaluation status)</option>
          <option value="past_due">Past Due (Subscription renewal failed)</option>
          <option value="restricted">Restricted (Channel or payment limits)</option>
          <option value="suspended">Suspended (Storefront and dashboard locked)</option>
        </select>
      </div>

      {targetStatus === 'suspended' && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-start gap-2">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Warning:</strong> Suspending this tenant will immediately disable their customer storefront, lock their merchant dashboard, and pause WhatsApp integrations.
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="font-semibold text-foreground block">
          Mandatory Reason <span className="text-rose-400 font-bold">*</span>
        </label>
        <textarea
          required
          rows={3}
          placeholder="State the explicit operational or policy justification (e.g., Compliance investigation #104, Payment dispute)..."
          value={statusReason}
          onChange={(e) => setStatusReason(e.target.value)}
          className="w-full bg-surface-elevated border border-separator rounded-xl px-3 py-2 text-foreground focus:outline-hidden focus:border-brand-primary"
        />
      </div>

      {modalError && (
        <div className="p-3 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-xs">
          {modalError}
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-separator">
        <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          type="submit"
          isLoading={isPending}
          className="font-bold"
        >
          Confirm Status Update
        </Button>
      </div>
    </form>
  );
}

export function MerchantStatusModal({
  isOpen,
  onClose,
  tenant,
  initialStatus,
  onSuccess,
}: MerchantStatusModalProps) {
  if (!tenant) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex flex-col">
          <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider">
            Tenant Governance
          </span>
          <span className="text-base font-bold text-foreground font-display mt-0.5">
            Update Status for {tenant.name}
          </span>
        </div>
      }
      description="Select target status and provide mandatory justification for platform audit logs."
      size="md"
    >
      {isOpen && (
        <MerchantStatusFormContent
          key={tenant.id}
          tenant={tenant}
          initialStatus={initialStatus}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      )}
    </Modal>
  );
}
