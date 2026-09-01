'use client';

import React, { useState } from 'react';
import { TargetProgress, TargetsIntelligenceSummary } from '@/types/targets';
import { TargetCard } from './TargetCard';
import { TargetFormModal } from './TargetFormModal';
import { Button } from '@/components/ui/Button';
import { Target, Plus, BrainCircuit } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TargetsSectionProps {
  targets: TargetProgress[];
  summary: TargetsIntelligenceSummary;
  availableProducts: Array<{ id: string; name: string }>;
  availableBatches: Array<{ id: string; name: string; code: string }>;
  currency?: string;
}

export function TargetsSection({
  targets,
  summary,
  availableProducts,
  availableBatches,
  currency = 'GHS',
}: TargetsSectionProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section aria-labelledby="goals-targets-heading" className="space-y-4 pt-6 border-t border-separator">
      {/* Header & New Target Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-brand-primary/10 text-brand-primary">
              <Target size={18} />
            </div>
            <h2
              id="goals-targets-heading"
              className="text-base sm:text-lg font-bold font-display text-foreground tracking-tight"
            >
              Business Goals & Intelligence Targets
            </h2>
          </div>
          <p className="text-xs text-muted">
            Automated accountability engine tracking actual performance, daily pace, and projected outcomes.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="gap-1.5 text-xs shadow-xs cursor-pointer shrink-0"
        >
          <Plus size={14} />
          <span>New Target</span>
        </Button>
      </div>

      {/* Intelligence Executive Summary Banner */}
      <div className="p-4 rounded-2xl border border-separator bg-surface-elevated flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-brand-primary/10 text-brand-primary">
              <BrainCircuit size={13} />
            </span>
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              Executive Performance Summary
            </span>
          </div>
          <h3 className="text-sm font-bold text-foreground">{summary.headline}</h3>
          <p className="text-xs text-muted leading-relaxed">{summary.narrative}</p>
        </div>

        {/* Quick KPI Stat Badges */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="px-3 py-2 rounded-xl bg-surface border border-separator text-center min-w-20">
            <span className="text-[10px] font-semibold text-muted uppercase block">Active</span>
            <span className="text-sm font-bold font-mono text-foreground">{summary.total_active_targets}</span>
          </div>

          <div className="px-3 py-2 rounded-xl bg-surface border border-separator text-center min-w-20">
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase block">
              On Track
            </span>
            <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {summary.on_track_count}
            </span>
          </div>

          {summary.at_risk_count > 0 && (
            <div className="px-3 py-2 rounded-xl bg-surface border border-amber-500/30 text-center min-w-20">
              <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase block">
                At Risk
              </span>
              <span className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400">
                {summary.at_risk_count}
              </span>
            </div>
          )}

          {summary.achieved_count > 0 && (
            <div className="px-3 py-2 rounded-xl bg-surface border border-purple-500/30 text-center min-w-20">
              <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 uppercase block">
                Achieved
              </span>
              <span className="text-sm font-bold font-mono text-purple-600 dark:text-purple-400">
                {summary.achieved_count}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Target Cards Grid */}
      {targets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {targets.map((progress) => (
            <TargetCard
              key={progress.target.id}
              progress={progress}
              currency={currency}
              onDeleted={() => router.refresh()}
            />
          ))}
        </div>
      ) : (
        <div className="p-8 rounded-2xl border border-dashed border-separator bg-surface text-center space-y-3">
          <div className="w-10 h-10 mx-auto rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
            <Target size={20} />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-sm font-bold text-foreground">No Goals Defined Yet</h3>
            <p className="text-xs text-muted">
              Create your first monthly revenue, customer reach, or pre-order batch target to start tracking progress.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="gap-1.5 text-xs cursor-pointer"
          >
            <Plus size={14} />
            <span>Create First Goal</span>
          </Button>
        </div>
      )}

      {/* Target Creation Modal */}
      <TargetFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => router.refresh()}
        availableProducts={availableProducts}
        availableBatches={availableBatches}
        currency={currency}
      />
    </section>
  );
}
