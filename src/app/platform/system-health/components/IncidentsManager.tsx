'use client';

import React, { useState, useTransition } from 'react';
import {
  Radio,
  Plus,
  Trash2,
  Edit2,
  ShieldAlert,
} from 'lucide-react';
import { SystemIncident, ServiceStatus } from '@/types/support';
import {
  createOrUpdateSystemIncident,
  deleteSystemIncident,
} from '@/app/actions/platform';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { IncidentModal, IncidentService } from './IncidentModal';

interface IncidentsManagerProps {
  initialIncidents: SystemIncident[];
}

const SERVICE_LABELS: Record<IncidentService, string> = {
  payments: 'Payment Webhooks & MoMo Rails',
  whatsapp: 'WhatsApp Cloud API Gateway',
  storefront: 'Storefronts & Edge Routing',
  domains: 'Custom Domains & SSL Certificates',
  core_api: 'Core API Engine & Database',
};

const STATUS_LABELS: Record<ServiceStatus, { label: string; color: string }> = {
  degraded_performance: { label: 'Degraded Performance', color: 'bg-amber-500 text-white' },
  partial_outage: { label: 'Partial Outage', color: 'bg-orange-500 text-white' },
  major_outage: { label: 'Major Outage', color: 'bg-rose-500 text-white' },
  maintenance: { label: 'Scheduled Maintenance', color: 'bg-blue-500 text-white' },
  operational: { label: 'Operational', color: 'bg-emerald-500 text-white' },
};

export function IncidentsManager({ initialIncidents }: IncidentsManagerProps) {
  const [incidents, setIncidents] = useState<SystemIncident[]>(initialIncidents);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<SystemIncident | null>(null);
  const [incidentToDelete, setIncidentToDelete] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenCreate = () => {
    setEditingIncident(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (inc: SystemIncident) => {
    setEditingIncident(inc);
    setIsModalOpen(true);
  };

  const handleIncidentSaved = (saved: SystemIncident, isNew: boolean) => {
    if (isNew) {
      setIncidents((prev) => [saved, ...prev]);
    } else {
      setIncidents((prev) => prev.map((i) => (i.id === saved.id ? saved : i)));
    }
  };

  const handleQuickResolve = (inc: SystemIncident) => {
    startTransition(async () => {
      const res = await createOrUpdateSystemIncident({
        id: inc.id,
        service: inc.service,
        status: 'operational',
        title: inc.title,
        message: `${inc.message} (Resolved by platform operations)`,
        affected_areas: inc.affected_areas,
        is_active: false,
      });

      if (res.success) {
        setIncidents((prev) =>
          prev.map((i) =>
            i.id === inc.id ? { ...i, status: 'operational' as ServiceStatus, is_active: false } : i
          )
        );
      }
    });
  };

  const handleDelete = (incId: string) => {
    setIncidentToDelete(incId);
  };

  const confirmDelete = () => {
    if (!incidentToDelete) return;
    const incId = incidentToDelete;

    startTransition(async () => {
      const res = await deleteSystemIncident(incId);
      if (res.success) {
        toast.success('Incident deleted successfully');
        setIncidents((prev) => prev.filter((i) => i.id !== incId));
        setIncidentToDelete(null);
      } else {
        toast.error('Failed to delete incident');
      }
    });
  };

  const activeIncidents = incidents.filter((i) => i.is_active);
  const resolvedIncidents = incidents.filter((i) => !i.is_active);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-4 rounded-2xl border border-separator shadow-xs">
        <div>
          <div className="text-xs font-bold text-foreground flex items-center gap-2">
            <Radio size={14} className="text-rose-500" />
            <span>Platform Status Incident Broadcaster</span>
          </div>
          <div className="text-xs text-muted mt-0.5">
            Publish, update, and resolve platform degradation notices affecting merchant storefronts and API connectors.
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500 text-white hover:bg-rose-600 transition-colors shadow-xs shrink-0 cursor-pointer"
        >
          <Plus size={14} />
          <span>Publish Incident</span>
        </button>
      </div>

      {/* Active Incidents Banner */}
      {activeIncidents.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs font-bold font-mono text-rose-400 uppercase tracking-wider">
            Active Incidents ({activeIncidents.length})
          </div>
          <div className="space-y-3">
            {activeIncidents.map((inc) => (
              <div
                key={inc.id}
                className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 text-foreground space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 shrink-0">
                      <ShieldAlert size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{inc.title}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            STATUS_LABELS[inc.status]?.color || 'bg-rose-500 text-white'
                          }`}
                        >
                          {STATUS_LABELS[inc.status]?.label || inc.status}
                        </span>
                      </div>
                      <div className="text-xs text-secondary mt-1 leading-relaxed">
                        {inc.message}
                      </div>
                      <div className="text-[11px] text-muted font-mono mt-1.5 flex items-center gap-2">
                        <span>
                          Service: <strong>{SERVICE_LABELS[inc.service] || inc.service}</strong>
                        </span>
                        <span>•</span>
                        <span>Areas: {inc.affected_areas?.join(', ') || 'Global'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      disabled={isPending}
                      onClick={() => handleQuickResolve(inc)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors cursor-pointer"
                    >
                      Resolve
                    </button>
                    <button
                      disabled={isPending}
                      onClick={() => handleOpenEdit(inc)}
                      className="p-1.5 rounded-lg bg-surface text-secondary hover:text-foreground border border-separator transition-colors cursor-pointer"
                      title="Edit Incident"
                    >
                      <Edit2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past / Resolved Incidents */}
      <div className="bg-surface rounded-2xl border border-separator overflow-hidden shadow-xs">
        <div className="p-3.5 border-b border-separator bg-surface-elevated flex items-center justify-between text-xs font-semibold text-muted font-mono uppercase">
          <span>Incident History & Log</span>
          <span>{resolvedIncidents.length} Resolved</span>
        </div>

        <div className="divide-y divide-separator/60">
          {resolvedIncidents.length === 0 && activeIncidents.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted">
              All infrastructure services operational. No platform incidents reported.
            </div>
          ) : (
            resolvedIncidents.map((inc) => (
              <div
                key={inc.id}
                className="p-3.5 flex items-center justify-between gap-4 text-xs hover:bg-surface-elevated/40 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{inc.title}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Resolved
                    </span>
                  </div>
                  <div className="text-[11px] text-muted truncate max-w-xl">{inc.message}</div>
                </div>

                <div className="flex items-center gap-3 shrink-0 font-mono text-[11px] text-muted">
                  <span>{new Date(inc.created_at).toLocaleDateString()}</span>
                  <button
                    disabled={isPending}
                    onClick={() => handleDelete(inc.id)}
                    className="p-1 text-muted hover:text-destructive transition-colors cursor-pointer"
                    title="Delete Record"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Incident Modal */}
      <IncidentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingIncident={editingIncident}
        onIncidentSaved={handleIncidentSaved}
      />

      <ConfirmDialog
        isOpen={!!incidentToDelete}
        onClose={() => setIncidentToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Incident Record"
        description="Are you sure you want to delete this incident record? This action cannot be undone."
        confirmText="Delete Incident"
        isDestructive
        isLoading={isPending}
      />
    </div>
  );
}
