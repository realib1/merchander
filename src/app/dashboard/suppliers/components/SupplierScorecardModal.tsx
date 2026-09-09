'use client';

import React from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Star,
  Receipt,
  Truck,
  ShieldCheck,
} from 'lucide-react';
import { SupplierPerformanceScore } from '@/types/intelligence-demand';
import { SupplierScorecardBadge } from './SupplierScorecardBadge';
import { formatCurrency } from '@/utils/format';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface SupplierScorecardModalProps {
  scorecard: SupplierPerformanceScore | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SupplierScorecardModal({
  scorecard,
  isOpen,
  onClose,
}: SupplierScorecardModalProps) {
  if (!isOpen || !scorecard) return null;

  return (
    <Modal
      isOpen={isOpen && !!scorecard}
      onClose={onClose}
      size="md"
      title={
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span>{scorecard.supplierName}</span>
              <SupplierScorecardBadge
                grade={scorecard.grade}
                score={scorecard.compositeScore}
                size="sm"
              />
            </h3>
            <p className="text-[11px] text-muted">
              {scorecard.country ? `${scorecard.country} • ` : ''}
              {scorecard.completedPOs} of {scorecard.totalPOs} POs completed
            </p>
          </div>
        </div>
      }
      footer={
        <Button variant="outline" size="sm" onClick={onClose}>
          Close Scorecard
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Composite Score Banner */}
        <div className="p-4 rounded-2xl bg-surface-elevated border border-separator/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted tracking-wider uppercase">
              Overall Reliability Index
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-foreground tabular-nums">
                {scorecard.grade === 'Unrated' ? 'N/A' : `${scorecard.compositeScore.toFixed(1)}%`}
              </span>
              <span className="text-xs font-bold text-muted">
                {scorecard.grade === 'Unrated'
                  ? '(New Supplier)'
                  : `Grade ${scorecard.grade}`}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-muted font-medium">Avg. Lead Time</p>
            <p className="text-sm font-bold text-foreground tabular-nums flex items-center justify-end gap-1 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-muted" />
              <span>{scorecard.averageLeadTimeDays} days</span>
            </p>
          </div>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Pillar 1: On-Time Delivery */}
          <div className="p-3.5 rounded-xl bg-surface border border-separator flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted">Punctuality (40%)</span>
              <Truck className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="my-2">
              <span className="text-lg font-black text-foreground tabular-nums">
                {scorecard.onTimeDeliveryRate.toFixed(0)}%
              </span>
            </div>
            <p className="text-[10px] text-muted leading-tight">
              POs delivered on or before promised ETA
            </p>
          </div>

          {/* Pillar 2: Fulfillment Completeness */}
          <div className="p-3.5 rounded-xl bg-surface border border-separator flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted">Fulfillment (30%)</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="my-2">
              <span className="text-lg font-black text-foreground tabular-nums">
                {scorecard.fulfillmentAccuracy.toFixed(0)}%
              </span>
            </div>
            <p className="text-[10px] text-muted leading-tight">
              Units delivered vs quantities ordered
            </p>
          </div>

          {/* Pillar 3: Quality & Defects */}
          <div className="p-3.5 rounded-xl bg-surface border border-separator flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted">Quality (20%)</span>
              <Star className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="my-2 flex items-baseline gap-1.5">
              <span className="text-lg font-black text-foreground tabular-nums">
                {scorecard.averageQualityRating
                  ? `${scorecard.averageQualityRating.toFixed(1)}★`
                  : 'N/A'}
              </span>
              {scorecard.defectCount > 0 && (
                <span className="text-[10px] text-destructive font-bold flex items-center gap-0.5">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  {scorecard.defectCount} defect(s)
                </span>
              )}
            </div>
            <p className="text-[10px] text-muted leading-tight">
              Delivery inspection condition & defects
            </p>
          </div>

          {/* Pillar 4: Balance & Debt Ratio */}
          <div className="p-3.5 rounded-xl bg-surface border border-separator flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted">Balance (10%)</span>
              <Receipt className="w-3.5 h-3.5 text-purple-500" />
            </div>
            <div className="my-2">
              <span className="text-sm font-black text-foreground tabular-nums truncate block">
                {formatCurrency(scorecard.outstandingBalance)}
              </span>
            </div>
            <p className="text-[10px] text-muted leading-tight">
              Current outstanding vendor payable
            </p>
          </div>
        </div>

        {/* Explanation Footer */}
        <div className="p-3 rounded-xl bg-surface-elevated/40 border border-separator/60 text-[11px] text-muted leading-relaxed">
          <p>
            💡 <strong>How it works:</strong> Supplier scorecards use weighted statistical performance across all historical purchase orders. New suppliers remain Unrated until their initial delivery is inspected.
          </p>
        </div>
      </div>
    </Modal>
  );
}
