'use client';

import React from 'react';
import Link from 'next/link';
import { BusinessInsight, InsightCategory, InsightSeverity } from '@/types/insights';
import { Button } from '@/components/ui/Button';
import {
  Boxes,
  Percent,
  Coins,
  TrendingUp,
  Ship,
  UserCheck,
  ShieldAlert,
  AlertTriangle,
  Info,
  ArrowRight,
  MessageCircle,
} from 'lucide-react';

interface InsightCardProps {
  insight: BusinessInsight;
}

function getCategoryIcon(cat: InsightCategory) {
  switch (cat) {
    case 'inventory':
      return <Boxes size={16} className="text-brand-primary" />;
    case 'margin':
      return <Percent size={16} className="text-warning" />;
    case 'credit':
      return <Coins size={16} className="text-destructive" />;
    case 'velocity':
      return <TrendingUp size={16} className="text-success" />;
    case 'supplier':
      return <Ship size={16} className="text-brand-secondary" />;
    case 'customer':
    default:
      return <UserCheck size={16} className="text-info" />;
  }
}

function getSeverityBadge(sev: InsightSeverity) {
  switch (sev) {
    case 'critical':
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
          <ShieldAlert size={12} /> Critical Risk
        </span>
      );
    case 'warning':
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/20">
          <AlertTriangle size={12} /> Warning
        </span>
      );
    case 'opportunity':
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20">
          <TrendingUp size={12} /> Opportunity
        </span>
      );
    case 'info':
    default:
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-info/10 text-info border border-info/20">
          <Info size={12} /> Note
        </span>
      );
  }
}

export function InsightCard({ insight }: InsightCardProps) {
  const isWhatsApp = insight.action.type === 'whatsapp';

  return (
    <div className="bg-surface border border-separator rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      <div>
        {/* Header: Category Icon & Severity Badge */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-surface-elevated rounded-xl border border-separator/60">
              {getCategoryIcon(insight.category)}
            </div>
            <h4 className="text-sm font-bold text-foreground tracking-tight line-clamp-1">{insight.title}</h4>
          </div>
          <div className="shrink-0">{getSeverityBadge(insight.severity)}</div>
        </div>

        {/* Observation (What happened) */}
        <div className="p-3 bg-surface-elevated/70 border border-separator/60 rounded-xl mb-3">
          <div className="text-xs font-semibold text-foreground leading-relaxed flex items-start justify-between gap-2">
            <span>{insight.observation}</span>
            {insight.metricBadge && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  insight.metricBadge.isPositive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                }`}
              >
                {insight.metricBadge.value}
              </span>
            )}
          </div>
        </div>

        {/* 2-Tier Explanation */}
        <div className="space-y-2 mb-4 text-xs">
          {/* Why It Matters */}
          <div className="flex items-start gap-2">
            <span className="font-semibold text-muted shrink-0 w-20">Why it matters:</span>
            <span className="text-secondary leading-normal">{insight.impact}</span>
          </div>

          {/* Recommended Action */}
          <div className="flex items-start gap-2">
            <span className="font-semibold text-brand-primary shrink-0 w-20">Action plan:</span>
            <span className="text-foreground font-medium leading-normal">{insight.recommendation}</span>
          </div>
        </div>
      </div>

      {/* Footer Action Button */}
      <div className="pt-3 border-t border-separator/60 flex items-center justify-between">
        <span className="text-[10px] text-muted uppercase font-semibold tracking-wider">
          {insight.category} intelligence
        </span>

        {isWhatsApp ? (
          <a
            href={insight.action.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-brand-whatsapp hover:opacity-90 text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <MessageCircle size={14} />
            <span>{insight.action.label}</span>
          </a>
        ) : (
          <Link href={insight.action.href}>
            <Button variant="outline" size="sm" rightIcon={<ArrowRight size={13} />}>
              {insight.action.label}
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
