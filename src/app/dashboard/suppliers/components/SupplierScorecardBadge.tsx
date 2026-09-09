'use client';

import React from 'react';
import { SupplierGrade } from '@/types/intelligence-demand';
import { Award, AlertCircle, HelpCircle } from 'lucide-react';

interface SupplierScorecardBadgeProps {
  grade: SupplierGrade;
  score?: number;
  size?: 'sm' | 'md';
  onClick?: () => void;
  showScore?: boolean;
}

export function SupplierScorecardBadge({
  grade,
  score,
  size = 'md',
  onClick,
  showScore = true,
}: SupplierScorecardBadgeProps) {
  const isInteractive = Boolean(onClick);

  const getBadgeStyle = () => {
    switch (grade) {
      case 'A':
        return {
          container: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/25',
          dot: 'bg-emerald-500',
          icon: <Award className="w-3 h-3 text-emerald-600" />,
        };
      case 'B':
        return {
          container: 'bg-blue-500/15 text-blue-600 border-blue-500/30 hover:bg-blue-500/25',
          dot: 'bg-blue-500',
          icon: <Award className="w-3 h-3 text-blue-600" />,
        };
      case 'C':
        return {
          container: 'bg-amber-500/15 text-amber-600 border-amber-500/30 hover:bg-amber-500/25',
          dot: 'bg-amber-500',
          icon: <AlertCircle className="w-3 h-3 text-amber-600" />,
        };
      case 'Needs Attention':
        return {
          container: 'bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/25',
          dot: 'bg-destructive',
          icon: <AlertCircle className="w-3 h-3 text-destructive" />,
        };
      case 'Unrated':
      default:
        return {
          container: 'bg-surface-elevated text-muted border-separator hover:bg-surface-elevated/80',
          dot: 'bg-muted',
          icon: <HelpCircle className="w-3 h-3 text-muted" />,
        };
    }
  };

  const style = getBadgeStyle();
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px] gap-1' : 'px-2.5 py-1 text-xs gap-1.5';

  const content = (
    <span
      className={`inline-flex items-center font-bold border rounded-lg transition-colors select-none ${style.container} ${sizeClasses} ${
        isInteractive ? 'cursor-pointer hover:shadow-2xs' : ''
      }`}
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={(e) => {
        if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
      <span>Grade {grade}</span>
      {showScore && score !== undefined && grade !== 'Unrated' && (
        <span className="font-mono text-[10px] opacity-80 tabular-nums">
          ({Math.round(score)}%)
        </span>
      )}
    </span>
  );

  return content;
}
