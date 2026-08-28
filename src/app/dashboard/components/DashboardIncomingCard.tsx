import { Ship, Globe, ArrowDown } from 'lucide-react';
import type { DashboardMetrics } from '@/types/dashboard';

interface DashboardIncomingCardProps {
  incoming: DashboardMetrics['incoming'];
}

export function DashboardIncomingCard({ incoming }: DashboardIncomingCardProps) {
  return (
    <div className="lg:col-span-4 bg-surface border border-separator rounded-2xl shadow-xs p-6 flex flex-col min-h-75">
      <h2 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
        <Ship size={15} className="text-brand-primary" /> Incoming Purchase Orders
      </h2>

      {incoming ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4 bg-surface-elevated rounded-xl border border-separator text-center">
          <div className="text-lg font-display font-semibold mb-1 flex items-center justify-center gap-1.5">
            <Globe size={16} className="text-brand-primary" />
            <span>{incoming.origin}</span>
          </div>
          <ArrowDown size={14} className="text-muted mb-1" />
          <div className="font-medium text-brand-primary mb-1">{incoming.id}</div>
          <ArrowDown size={14} className="text-muted mb-1" />
          <div className="font-medium mb-1 tabular-nums">{incoming.units} units</div>
          <ArrowDown size={14} className="text-muted mb-3" />
          <div className="text-sm font-medium">ETA: {incoming.eta}</div>

          <div className="w-full h-px bg-separator my-4" />

          <div className="text-sm font-medium">
            {incoming.preOrders} customers are already waiting for these products.
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-4 bg-surface-elevated rounded-xl border border-separator text-center">
          <div className="text-muted mb-3">
            <Ship size={32} className="opacity-20 mx-auto" />
          </div>
          <div className="text-sm">No active purchase orders in transit.</div>
        </div>
      )}
    </div>
  );
}
