'use client';

import React from 'react';
import { BranchData } from '@/types/branches';
import { MapPin, Phone, MessageCircle, Star, ArrowLeftRight, Edit2, Trash2, Package, Navigation } from 'lucide-react';

interface BranchCardProps {
  branch: BranchData;
  onEdit: (branch: BranchData) => void;
  onDelete: (branchId: string) => void;
  onSetPrimary: (branchId: string) => void;
  onTransfer: (branch: BranchData) => void;
  isPending?: boolean;
}

export function BranchCard({ branch, onEdit, onDelete, onSetPrimary, onTransfer, isPending = false }: BranchCardProps) {
  const fullAddress = [branch.street_address, branch.landmark, branch.city, branch.region].filter(Boolean).join(', ');

  return (
    <div
      className={`p-5 rounded-2xl border transition-all relative flex flex-col justify-between ${
        branch.is_primary
          ? 'bg-surface border-brand-primary shadow-xs ring-1 ring-brand-primary/50'
          : 'bg-surface border-separator hover:border-separator/80'
      }`}
    >
      <div>
        {/* Header Badges & Title */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-foreground font-display">{branch.name}</h3>
              {branch.is_primary && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary text-[10px] font-bold">
                  <Star size={11} className="fill-brand-primary" /> Primary HQ
                </span>
              )}
              <span
                className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  branch.pickup_enabled ? 'bg-success/10 text-success' : 'bg-muted/20 text-muted'
                }`}
              >
                {branch.pickup_enabled ? '● Pickup Enabled' : '○ Delivery Only'}
              </span>
            </div>

            {/* Address & Digital GPS */}
            <p className="text-xs text-muted flex items-center gap-1.5 mt-1.5 line-clamp-1">
              <MapPin size={13} className="shrink-0 text-muted" />
              <span>{fullAddress || branch.location || 'Address not specified'}</span>
            </p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted/90 pt-3 border-t border-separator/50 mb-4">
          {branch.digital_address && (
            <div className="flex items-center gap-1.5">
              <Navigation size={12} className="text-brand-primary shrink-0" />
              <span className="font-mono text-[11px] font-bold text-foreground">{branch.digital_address}</span>
            </div>
          )}

          {branch.phone && (
            <div className="flex items-center gap-1.5">
              <Phone size={12} className="text-muted shrink-0" />
              <span className="font-mono text-[11px]">{branch.phone}</span>
            </div>
          )}

          {branch.whatsapp_phone && (
            <div className="flex items-center gap-1.5">
              <MessageCircle size={12} className="text-success shrink-0" />
              <span className="font-mono text-[11px] text-success font-medium">{branch.whatsapp_phone}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <Package size={12} className="text-muted shrink-0" />
            <span className="text-[11px]">
              <strong className="text-foreground">{branch.totalUnitsCount || 0}</strong> total units (
              {branch.totalProductsCount || 0} SKUs)
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-separator/50">
        <div className="flex items-center gap-1">
          {!branch.is_primary && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => onSetPrimary(branch.id)}
              className="px-2.5 py-1.5 rounded-lg border border-separator bg-surface-elevated hover:bg-surface-elevated/80 text-[11px] font-semibold text-foreground cursor-pointer transition"
            >
              Make Primary
            </button>
          )}

          <button
            type="button"
            disabled={isPending}
            onClick={() => onTransfer(branch)}
            className="px-2.5 py-1.5 rounded-lg border border-separator bg-surface-elevated hover:bg-surface-elevated/80 text-[11px] font-semibold text-foreground cursor-pointer transition flex items-center gap-1"
          >
            <ArrowLeftRight size={12} />
            <span>Transfer Stock</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={isPending}
            onClick={() => onEdit(branch)}
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-elevated cursor-pointer transition"
            title="Edit Branch"
          >
            <Edit2 size={14} />
          </button>

          {!branch.is_primary && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => onDelete(branch.id)}
              className="p-1.5 rounded-lg text-muted hover:text-destructive hover:bg-destructive/10 cursor-pointer transition"
              title="Delete Branch"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
