'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { MoreVertical, Play, Pause, AlertTriangle, Edit } from 'lucide-react';
import { updateTenantStatusAction, updateTenantPlanAction } from '@/app/actions/platform';
import type { TenantPlatformStatus, PlatformTier } from '@/types/platform';

interface MerchantControlsClientProps {
  tenantId: string;
  currentStatus: TenantPlatformStatus;
  currentTier: PlatformTier;
}

export function MerchantControlsClient({ tenantId, currentStatus, currentTier }: MerchantControlsClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleStatusChange(newStatus: TenantPlatformStatus) {
    const reason = window.prompt(`Reason for changing status to ${newStatus}?`);
    if (!reason) return;

    setIsUpdating(true);
    const res = await updateTenantStatusAction(tenantId, newStatus, reason);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(`Merchant status updated to ${newStatus}`);
    }
    setIsUpdating(false);
    setIsOpen(false);
  }

  async function handleTierChange() {
    const tiers: PlatformTier[] = ['free', 'starter', 'growth', 'business', 'enterprise'];
    const newTierStr = window.prompt(`Enter new tier (${tiers.join(', ')}):`, currentTier);
    if (!newTierStr || newTierStr === currentTier) return;
    
    if (!tiers.includes(newTierStr as PlatformTier)) {
      toast.error('Invalid tier selected.');
      return;
    }

    const reason = window.prompt(`Reason for updating plan to ${newTierStr}?`);
    if (!reason) return;

    setIsUpdating(true);
    const res = await updateTenantPlanAction(tenantId, newTierStr as Exclude<PlatformTier, 'none'>, 'monthly', reason);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(`Merchant plan updated to ${newTierStr}`);
    }
    setIsUpdating(false);
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isUpdating}
        className="p-2 rounded-xl border border-separator bg-surface text-muted hover:bg-surface-elevated hover:text-foreground transition-colors disabled:opacity-50 flex items-center justify-center"
        aria-label="Merchant Actions"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-56 bg-surface-elevated border border-separator rounded-xl shadow-lg z-50 overflow-hidden py-1 text-sm">
            <div className="px-3 py-2 border-b border-separator/40 text-xs font-semibold text-muted uppercase tracking-wider">
              Administration
            </div>

            <button
              onClick={handleTierChange}
              className="w-full text-left px-3 py-2.5 hover:bg-muted/10 flex items-center gap-2.5 transition-colors text-foreground"
            >
              <Edit size={14} className="text-muted" />
              <span>Change Plan Tier</span>
            </button>

            {currentStatus === 'active' ? (
              <button
                onClick={() => handleStatusChange('suspended')}
                className="w-full text-left px-3 py-2.5 hover:bg-destructive/10 text-destructive flex items-center gap-2.5 transition-colors"
              >
                <Pause size={14} />
                <span>Suspend Merchant</span>
              </button>
            ) : (
              <button
                onClick={() => handleStatusChange('active')}
                className="w-full text-left px-3 py-2.5 hover:bg-emerald-500/10 text-emerald-500 flex items-center gap-2.5 transition-colors"
              >
                <Play size={14} />
                <span>Reactivate Merchant</span>
              </button>
            )}
            
            {currentStatus !== 'restricted' && (
              <button
                onClick={() => handleStatusChange('restricted')}
                className="w-full text-left px-3 py-2.5 hover:bg-amber-500/10 text-amber-500 flex items-center gap-2.5 transition-colors"
              >
                <AlertTriangle size={14} />
                <span>Restrict Account</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
