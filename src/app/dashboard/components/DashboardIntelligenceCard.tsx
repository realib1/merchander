import { BrainCircuit, Activity } from 'lucide-react';
import type { DashboardMetrics } from '@/types/dashboard';

interface DashboardIntelligenceCardProps {
  intelligence: DashboardMetrics['intelligence'];
}

export function DashboardIntelligenceCard({ intelligence }: DashboardIntelligenceCardProps) {
  return (
    <div className="lg:col-span-4 bg-surface border border-separator/70 rounded-xl shadow-2xs flex flex-col min-h-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-separator/60 bg-surface flex items-center justify-between">
        <h2 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
          <BrainCircuit size={15} className="text-brand-primary" /> Merchander Intelligence
        </h2>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
          <Activity size={10} className="shrink-0" />
          Active
        </span>
      </div>
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">What Merchander sees:</div>
          <p className="text-sm text-foreground leading-relaxed mb-4 font-medium">{intelligence.velocityInsight}</p>

          <div className="bg-surface-elevated/70 rounded-xl p-4 border border-separator/70 mb-4">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Activity size={13} className="text-brand-secondary shrink-0" />
              <div className="text-[11px] font-bold text-muted uppercase tracking-wider">Analysis Engine</div>
            </div>
            <div className="text-xs text-muted space-y-2">
              {intelligence.supplyInsight.map((insight, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-brand-primary text-xs leading-none mt-0.5">•</span>
                  <p className="leading-relaxed text-foreground/90">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-xs bg-brand-primary/10 border border-brand-primary/25 rounded-xl p-4 shadow-2xs">
          <span className="font-bold text-brand-primary block mb-1 text-xs uppercase tracking-wider">
            Recommendation
          </span>
          <span className="text-foreground leading-relaxed font-medium">{intelligence.recommendation}</span>
        </div>
      </div>
    </div>
  );
}
