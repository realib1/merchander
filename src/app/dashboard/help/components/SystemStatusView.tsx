'use client';

import React from 'react';
import { SystemIncident, ServiceStatus } from '@/types/support';
import { CheckCircle2, AlertTriangle, AlertOctagon, Clock, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

interface SystemStatusViewProps {
  incidents: SystemIncident[];
  onOpenReport: () => void;
}

export function SystemStatusView({ incidents, onOpenReport }: SystemStatusViewProps) {
  const activeIncidents = incidents.filter((i) => i.is_active);

  const getStatusIcon = (status: ServiceStatus) => {
    switch (status) {
      case 'operational':
        return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'degraded_performance':
      case 'partial_outage':
        return <AlertTriangle size={16} className="text-amber-500" />;
      case 'major_outage':
        return <AlertOctagon size={16} className="text-destructive" />;
      case 'maintenance':
      default:
        return <Clock size={16} className="text-muted" />;
    }
  };

  const getStatusLabel = (status: ServiceStatus) => {
    switch (status) {
      case 'operational':
        return 'Operational';
      case 'degraded_performance':
        return 'Degraded Performance';
      case 'partial_outage':
        return 'Partial Disruption';
      case 'major_outage':
        return 'Major Outage';
      case 'maintenance':
        return 'Scheduled Maintenance';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl border border-separator bg-surface-elevated flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm font-bold text-foreground font-display">
              {activeIncidents.length === 0
                ? 'All Systems Fully Operational'
                : `${activeIncidents.length} Active System Advisory`}
            </h2>
          </div>
          <p className="text-xs text-muted">
            Continuous real-time telemetry across Ghanaian mobile money gateways, WhatsApp APIs, and edge storefronts.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenReport}
          className="text-xs font-bold text-brand-primary hover:underline cursor-pointer shrink-0 flex items-center gap-1"
        >
          <span>Report an outage</span>
          <ArrowRight size={13} aria-hidden="true" />
        </button>
      </div>

      {/* Active Incidents Banner (if any) */}
      {activeIncidents.length > 0 && (
        <div className="space-y-3">
          {activeIncidents.map((inc) => (
            <div key={inc.id} className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400" />
                  <span className="font-bold text-foreground">{inc.title}</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">
                  {getStatusLabel(inc.status)}
                </span>
              </div>
              <p className="text-foreground/90 leading-relaxed">{inc.message}</p>
              <p className="text-[10px] text-muted">Last updated {format(new Date(inc.updated_at), 'MMM d, h:mm a')}</p>
            </div>
          ))}
        </div>
      )}

      {/* Services Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {incidents.map((srv) => (
          <div
            key={srv.id}
            className="p-4 rounded-2xl border border-separator bg-surface flex items-center justify-between gap-3 shadow-xs"
          >
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold text-foreground">{srv.title}</h3>
              <p className="text-[11px] text-muted">{srv.message}</p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {getStatusIcon(srv.status)}
              <span className="text-[11px] font-semibold text-muted">{getStatusLabel(srv.status)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
