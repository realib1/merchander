'use client';

import React, { useState } from 'react';
import { PlatformSupportTicket } from '@/types/platform';
import { updateSupportTicketStatusAction } from '@/app/actions/platform-support';

interface SupportClientProps {
  initialTickets: PlatformSupportTicket[];
}

export function SupportClient({ initialTickets }: SupportClientProps) {
  const [tickets, setTickets] = useState<PlatformSupportTicket[]>(initialTickets);
  const [selectedTicket, setSelectedTicket] = useState<PlatformSupportTicket | null>(
    initialTickets[0] || null
  );
  const [newNote, setNewNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (
    ticketId: string,
    tenantId: string,
    newStatus: PlatformSupportTicket['status']
  ) => {
    setIsUpdating(true);
    try {
      const res = await updateSupportTicketStatusAction(tenantId, ticketId, { status: newStatus });
      if (res.success) {
        setTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
        );
        if (selectedTicket && selectedTicket.id === ticketId) {
          setSelectedTicket((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      }
    } catch (err) {
      console.error('Error updating ticket:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddInternalNote = async () => {
    if (!selectedTicket || !newNote.trim()) return;

    setIsUpdating(true);
    try {
      const res = await updateSupportTicketStatusAction(
        selectedTicket.tenant_id,
        selectedTicket.id,
        { newInternalNote: newNote }
      );
      if (res.success) {
        const updatedNotes = [
          ...(selectedTicket.internal_notes || []),
          {
            author: 'Support Staff',
            note: newNote,
            created_at: new Date().toISOString(),
          },
        ];
        setSelectedTicket((prev) => (prev ? { ...prev, internal_notes: updatedNotes } : null));
        setNewNote('');
      }
    } catch (err) {
      console.error('Error adding internal note:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Ticket List (Left 1 col) */}
      <div className="space-y-3 lg:col-span-1">
        <div className="text-xs font-bold text-muted uppercase font-mono tracking-wider">
          Ticket Queue ({tickets.length})
        </div>

        <div className="space-y-2 max-h-150 overflow-y-auto custom-scrollbar pr-1">
          {tickets.length === 0 ? (
            <div className="p-6 rounded-2xl bg-surface border border-separator text-center text-xs text-muted">
              No active support tickets in queue.
            </div>
          ) : (
            tickets.map((t) => {
              const isSelected = selectedTicket?.id === t.id;
              const isUrgent = t.priority === 'urgent';

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-brand-primary/10 border-brand-primary/40 shadow-xs'
                      : 'bg-surface border-separator hover:bg-surface-elevated'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-foreground truncate">{t.tenant_name}</span>
                    <span
                      className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                        t.status === 'open'
                          ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/20'
                          : t.status === 'in_progress'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}
                    >
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-foreground mt-1.5 truncate">{t.subject}</div>

                  <div className="flex items-center justify-between text-[11px] text-muted font-mono mt-2 pt-2 border-t border-separator/40">
                    <span className={isUrgent ? 'text-destructive font-bold' : ''}>
                      {t.priority.toUpperCase()}
                    </span>
                    <span>{new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Ticket Details & Action Drawer (Right 2 cols) */}
      <div className="lg:col-span-2">
        {selectedTicket ? (
          <div className="p-6 rounded-2xl bg-surface border border-separator shadow-xs space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-separator/60 pb-4">
              <div>
                <div className="text-xs text-muted font-mono">
                  Ticket #{selectedTicket.id} • {selectedTicket.category.toUpperCase()}
                </div>
                <h2 className="text-lg font-bold text-foreground font-display mt-0.5">
                  {selectedTicket.subject}
                </h2>
                <div className="text-xs text-secondary font-mono mt-0.5">
                  Reporter: {selectedTicket.merchant_email} ({selectedTicket.tenant_name})
                </div>
              </div>

              {/* Status Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted font-mono">Status:</span>
                <select
                  disabled={isUpdating}
                  value={selectedTicket.status}
                  onChange={(e) =>
                    handleStatusChange(
                      selectedTicket.id,
                      selectedTicket.tenant_id,
                      e.target.value as PlatformSupportTicket['status']
                    )
                  }
                  className="bg-surface-elevated border border-separator rounded-xl px-3 py-1.5 text-xs text-foreground font-semibold cursor-pointer focus:outline-hidden"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="waiting_for_merchant">Waiting for Merchant</option>
                  <option value="escalated">Escalated</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            {/* Merchant Message */}
            <div className="p-4 rounded-xl bg-surface-elevated border border-separator text-xs text-foreground leading-relaxed">
              <div className="text-[10px] text-muted font-mono uppercase mb-1.5">Original Merchant Request:</div>
              {selectedTicket.message || 'No additional message details provided.'}
            </div>

            {/* Internal Staff Notes */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-muted uppercase font-mono">
                Internal Collaboration Notes ({selectedTicket.internal_notes?.length || 0})
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(selectedTicket.internal_notes || []).map((note, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-surface-elevated border border-separator text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-muted">
                      <span className="font-bold text-brand-primary">{note.author}</span>
                      <span>{new Date(note.created_at).toLocaleString()}</span>
                    </div>
                    <div className="text-foreground">{note.note}</div>
                  </div>
                ))}
              </div>

              {/* Add Note Input */}
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Add internal staff note (visible only to platform team)..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddInternalNote()}
                  className="flex-1 px-3.5 py-2 rounded-xl text-xs bg-surface-elevated border border-separator placeholder:text-muted focus:outline-hidden focus:border-brand-primary/50"
                />
                <button
                  disabled={isUpdating || !newNote.trim()}
                  onClick={handleAddInternalNote}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-primary text-brand-primary-foreground hover:bg-brand-primary/90 disabled:opacity-50 transition-colors"
                >
                  Add Note
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 rounded-2xl bg-surface border border-separator text-center text-xs text-muted">
            Select a ticket from the queue to review details.
          </div>
        )}
      </div>
    </div>
  );
}
