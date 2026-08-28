import { Lightbulb } from 'lucide-react';
import type { DashboardMetrics } from '@/types/dashboard';

interface DashboardIntelligenceCardProps {
  intelligence: DashboardMetrics['intelligence'];
}

export function DashboardIntelligenceCard({ intelligence }: DashboardIntelligenceCardProps) {
  return (
    <div className="lg:col-span-4 bg-surface border border-separator rounded-2xl shadow-xs flex flex-col min-h-100">
      <div className="px-6 py-4 border-b border-separator bg-surface-elevated rounded-t-2xl flex items-center justify-between">
        <h2 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Lightbulb size={16} className="text-brand-secondary" /> Merchander Intelligence
        </h2>
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">What Merchander sees:</div>
        <p className="text-sm text-foreground leading-relaxed mb-4">{intelligence.velocityInsight}</p>

        <div className="bg-surface-elevated rounded-xl p-4 border border-separator mb-4 flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
            <div className="text-xs font-semibold text-muted uppercase tracking-wider">Analysis Engine</div>
          </div>
          <div className="text-sm text-muted space-y-2">
            {intelligence.supplyInsight.map((insight, idx) => (
              <p key={idx}>{insight}</p>
            ))}
          </div>
        </div>

        <div className="text-sm bg-brand-primary/10 border border-brand-primary/20 rounded-xl p-4">
          <span className="font-semibold text-brand-primary block mb-1">Recommendation:</span>
          <span className="text-foreground">{intelligence.recommendation}</span>
        </div>
      </div>
    </div>
  );
}
