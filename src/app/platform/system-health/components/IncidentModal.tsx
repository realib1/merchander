'use client';

import React, { useState, useTransition } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { createOrUpdateSystemIncident } from '@/app/actions/platform';
import type { SystemIncident, ServiceStatus } from '@/types/support';

export type IncidentService = 'storefront' | 'whatsapp' | 'payments' | 'domains' | 'core_api';

interface IncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingIncident: SystemIncident | null;
  onIncidentSaved: (incident: SystemIncident, isNew: boolean) => void;
}

function IncidentFormContent({
  editingIncident,
  onClose,
  onIncidentSaved,
}: {
  editingIncident: SystemIncident | null;
  onClose: () => void;
  onIncidentSaved: (incident: SystemIncident, isNew: boolean) => void;
}) {
  const [service, setService] = useState<IncidentService>(editingIncident?.service || 'payments');
  const [status, setStatus] = useState<ServiceStatus>(
    editingIncident?.status || 'degraded_performance'
  );
  const [title, setTitle] = useState(editingIncident?.title || '');
  const [message, setMessage] = useState(editingIncident?.message || '');
  const [affectedAreas, setAffectedAreas] = useState(
    editingIncident?.affected_areas?.join(', ') || 'Accra / MTN MoMo Webhooks'
  );
  const [isActive, setIsActive] = useState(editingIncident ? editingIncident.is_active : true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

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
          const updated: SystemIncident = {
            ...editingIncident,
            service,
            status,
            title,
            message,
            affected_areas: areasArray,
            is_active: isActive,
            updated_at: new Date().toISOString(),
          };
          onIncidentSaved(updated, false);
        } else {
          const created: SystemIncident = {
            id: `inc_${Date.now()}`,
            service,
            status,
            title,
            message,
            affected_areas: areasArray,
            is_active: isActive,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          onIncidentSaved(created, true);
        }
        onClose();
      } else {
        setErrorMsg(res.error || 'Failed to save incident');
      }
    });
  };

  return (
    <form onSubmit={handleSaveIncident} className="space-y-4 text-xs">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="font-semibold text-foreground block">Affected Service</label>
          <select
            value={service}
            onChange={(e) => setService(e.target.value as IncidentService)}
            className="w-full bg-surface-elevated border border-separator rounded-xl px-3 py-2 text-foreground focus:outline-hidden"
          >
            <option value="payments">Payment Webhooks &amp; MoMo</option>
            <option value="whatsapp">WhatsApp Cloud API</option>
            <option value="storefront">Edge Storefronts</option>
            <option value="domains">Custom Domains / SSL</option>
            <option value="core_api">Core API Engine</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="font-semibold text-foreground block">Incident Status</label>
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
        <label className="font-semibold text-foreground block">Incident Title</label>
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
        <label className="font-semibold text-foreground block">Notice Message</label>
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
        <label className="font-semibold text-foreground block">Affected Areas</label>
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

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-separator">
        <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          type="submit"
          isLoading={isPending}
          className="font-bold bg-rose-500 hover:bg-rose-600 text-white"
        >
          {editingIncident ? 'Save Incident' : 'Publish Notice'}
        </Button>
      </div>
    </form>
  );
}

export function IncidentModal({
  isOpen,
  onClose,
  editingIncident,
  onIncidentSaved,
}: IncidentModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex flex-col">
          <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider">
            Operational Incident
          </span>
          <span className="text-base font-bold text-foreground font-display mt-0.5">
            {editingIncident ? 'Update System Incident' : 'Publish Platform Incident'}
          </span>
        </div>
      }
      description="Publish or modify real-time operational status notices for merchant storefronts and API rails."
      size="md"
    >
      {isOpen && (
        <IncidentFormContent
          key={editingIncident?.id || 'new-incident'}
          editingIncident={editingIncident}
          onClose={onClose}
          onIncidentSaved={onIncidentSaved}
        />
      )}
    </Modal>
  );
}
