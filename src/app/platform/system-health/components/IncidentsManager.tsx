'use client';

import React, { useState, useTransition } from 'react';
import {
  Radio,
  Plus,
  Loader2,
  X,
  Trash2,
  Edit2,
  ShieldAlert,
} from 'lucide-react';
import { SystemIncident, ServiceStatus } from '@/types/support';
import {
  createOrUpdateSystemIncident,
  deleteSystemIncident,
} from '@/app/actions/platform';

interface IncidentsManagerProps {
  initialIncidents: SystemIncident[];
}

type IncidentService = 'storefront' | 'whatsapp' | 'payments' | 'domains' | 'core_api';

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
  const [isPending, startTransition] = useTransition();

  const [service, setService] = useState<IncidentService>('payments');
  const [status, setStatus] = useState<ServiceStatus>('degraded_performance');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [affectedAreas, setAffectedAreas] = useState('Accra / MTN Mobile Money');
  const [isActive, setIsActive] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setEditingIncident(null);
    setService('payments');
    setStatus('degraded_performance');
    setTitle('');
    setMessage('');
    setAffectedAreas('Accra / MTN MoMo Webhooks');
    setIsActive(true);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (inc: SystemIncident) => {
    setEditingIncident(inc);
    setService(inc.service);
    setStatus(inc.status);
    setTitle(inc.title);
    setMessage(inc.message);
    setAffectedAreas(inc.affected_areas?.join(', ') || '');
    setIsActive(inc.is_active);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSaveIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setErrorMsg('Incident title and message are required');
      return;
    }

    const areasArray = affectedAreas
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    startTransition(async () => {
      const res = await createOrUpdateSystemIncident({
        id: editingIncident?.id,
        service,
        status,
        title,
        message,
        affected_areas: areasArray,
        is_active: isActive,
      });

      if (res.success) {
        if (editingIncident) {
          setIncidents((prev) =>
            prev.map((i) =>
              i.id === editingIncident.id
                ? {
                    ...i,
                    service,
                    status,
                    title,
                    message,
                    affected_areas: areasArray,
                    is_active: isActive,
                    updated_at: new Date().toISOString(),
                  }
                : i
            )
          );
        } else {
          setIncidents((prev) => [
            {
              id: `inc_${Date.now()}`,
              service,
              status,
              title,
              message,
              affected_areas: areasArray,
              is_active: isActive,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            ...prev,
          ]);
        }
        setIsModalOpen(false);
      } else {
        setErrorMsg(res.error || 'Failed to save incident');
      }
    });
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
    if (!confirm('Are you sure you want to delete this incident record?')) return;
    startTransition(async () => {
      const res = await deleteSystemIncident(incId);
      if (res.success) {
        setIncidents((prev) => prev.filter((i) => i.id !== incId));
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
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-surface border border-separator rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-separator pb-3">
              <div>
                <div className="text-xs font-mono font-bold text-rose-400 uppercase">Operational Incident</div>
                <h3 className="text-base font-bold text-foreground font-display mt-0.5">
                  {editingIncident ? 'Update System Incident' : 'Publish Platform Incident'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-elevated transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveIncident} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-secondary block">Affected Service</label>
                  <select
                    value={service}
                    onChange={(e) => setService(e.target.value as IncidentService)}
                    className="w-full bg-surface-elevated border border-separator rounded-xl px-3 py-2 text-foreground focus:outline-hidden"
                  >
                    <option value="payments">Payment Webhooks & MoMo</option>
                    <option value="whatsapp">WhatsApp Cloud API</option>
                    <option value="storefront">Edge Storefronts</option>
                    <option value="domains">Custom Domains / SSL</option>
                    <option value="core_api">Core API Engine</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-secondary block">Incident Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ServiceStatus)}
                    className="w-full bg-surface-elevated border border-separator rounded-xl px-3 py-2 text-foreground focus:outline-hidden font-medium capitalize"
                  >
                    <option value="degraded_performance">Degraded Performance</option>
                    <option value="partial_outage">Partial Outage</option>
                    <option value="major_outage">Major Outage</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="operational">Operational</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-secondary block">Incident Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., MTN MoMo Webhook Delays in Greater Accra"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-surface-elevated border border-separator rounded-xl px-3 py-2 text-foreground focus:outline-hidden focus:border-rose-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-secondary block">Notice Message</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the issue, current investigation status, and expected resolution time."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-surface-elevated border border-separator rounded-xl px-3 py-2 text-foreground focus:outline-hidden focus:border-rose-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-secondary block">Affected Areas</label>
                <input
                  type="text"
                  placeholder="e.g., Accra, Kumasi, MoMo Checkout"
                  value={affectedAreas}
                  onChange={(e) => setAffectedAreas(e.target.value)}
                  className="w-full bg-surface-elevated border border-separator rounded-xl px-3 py-2 text-foreground focus:outline-hidden"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-separator text-rose-500 focus:ring-rose-500"
                />
                <span className="text-secondary font-medium">Broadcast active notice to tenant dashboards</span>
              </label>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-xs">
                  {errorMsg}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-separator">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-muted hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500 text-white hover:bg-rose-600 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {isPending ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    'Publish Notice'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
