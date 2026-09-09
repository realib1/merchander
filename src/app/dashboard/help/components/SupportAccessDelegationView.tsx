'use client';

import React, { useState, useTransition } from 'react';
import {
  ShieldCheck,
  Key,
  Clock,
  Lock,
  Loader2,
  History,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { SupportAccessGrant } from '@/types/support';
import {
  createSupportAccessGrantAction,
  revokeSupportAccessGrantAction,
} from '@/app/actions/support-grant';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface SupportAccessDelegationViewProps {
  initialActiveGrant: SupportAccessGrant | null;
  initialHistory: SupportAccessGrant[];
}

export function SupportAccessDelegationView({
  initialActiveGrant,
  initialHistory,
}: SupportAccessDelegationViewProps) {
  const [activeGrant, setActiveGrant] = useState<SupportAccessGrant | null>(initialActiveGrant);
  const [history, setHistory] = useState<SupportAccessGrant[]>(initialHistory);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [grantToRevoke, setGrantToRevoke] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Modal form state
  const [durationHours, setDurationHours] = useState(2);
  const [ticketId, setTicketId] = useState('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleOpenModal = () => {
    setDurationHours(2);
    setTicketId('');
    setReason('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleGrantAccess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setFormError('Please provide a reason or support ticket context for granting access');
      return;
    }
    setFormError(null);

    startTransition(async () => {
      const res = await createSupportAccessGrantAction({
        durationHours: Number(durationHours),
        reason: reason.trim(),
        ticketId: ticketId.trim() || undefined,
      });

      if (res.success && res.grant) {
        setActiveGrant(res.grant);
        setHistory((prev) => [res.grant!, ...prev]);
        setIsModalOpen(false);
      } else {
        setFormError(res.error || 'Failed to grant support access');
      }
    });
  };

  const handleRevoke = (grantId: string) => {
    setGrantToRevoke(grantId);
  };

  const confirmRevoke = () => {
    if (!grantToRevoke) return;
    const grantId = grantToRevoke;

    startTransition(async () => {
      const res = await revokeSupportAccessGrantAction(grantId);
      if (res.success) {
        toast.success('Support access revoked successfully');
        if (activeGrant && activeGrant.id === grantId) {
          const revoked = {
            ...activeGrant,
            status: 'revoked' as const,
            revoked_at: new Date().toISOString(),
          };
          setActiveGrant(null);
          setHistory((prev) => [revoked, ...prev.filter((h) => h.id !== grantId)]);
        }
        setGrantToRevoke(null);
      } else {
        toast.error(res.error || 'Failed to revoke grant');
      }
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Active Grant Status Card */}
      {activeGrant ? (
        <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-foreground space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 shrink-0 mt-0.5">
                <Key size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-foreground font-display">
                    Platform Support Access Active
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500 text-black">
                    Delegated
                  </span>
                </div>
                <p className="text-xs text-secondary mt-1 leading-relaxed">
                  Authorized Merchander Engineering staff currently have temporary, read-only diagnostic context access to your workspace.
                </p>

                <div className="mt-3 p-3 rounded-xl bg-surface/60 border border-separator/40 space-y-1 text-xs">
                  <div className="flex items-center gap-2 text-foreground font-mono">
                    <Clock size={13} className="text-amber-400" />
                    <span>Expires: <strong>{new Date(activeGrant.expires_at).toLocaleString()}</strong></span>
                  </div>
                  <div className="text-muted text-[11px]">
                    Reason: <em>&ldquo;{activeGrant.reason}&rdquo;</em> {activeGrant.ticket_id && `(Ticket: ${activeGrant.ticket_id})`}
                  </div>
                </div>
              </div>
            </div>

            <button
              disabled={isPending}
              onClick={() => handleRevoke(activeGrant.id)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-destructive text-white hover:bg-destructive/90 transition-colors shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              {isPending ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Revoking...
                </>
              ) : (
                'Revoke Access Now'
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-surface border border-separator shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
              <Lock size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-foreground">
                  Support Access: Locked (Default)
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Protected
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5 leading-relaxed">
                By default, Merchander platform staff cannot casually inspect your diagnostic context or catalog records without your explicit permission.
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-primary text-brand-primary-foreground hover:opacity-90 transition-opacity shadow-xs shrink-0 cursor-pointer"
          >
            <Key size={14} />
            <span>Grant Support Access</span>
          </button>
        </div>
      )}

      {/* Grant History */}
      <div className="bg-surface rounded-2xl border border-separator overflow-hidden shadow-xs">
        <div className="p-4 border-b border-separator bg-surface-elevated flex items-center justify-between text-xs font-semibold text-muted font-mono uppercase">
          <div className="flex items-center gap-2">
            <History size={14} className="text-brand-primary" />
            <span>Support Delegation Audit Trail</span>
          </div>
          <span>{history.length} Past Grants</span>
        </div>

        <div className="divide-y divide-separator/60">
          {history.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted">
              No previous support access grants on record for this store.
            </div>
          ) : (
            history.map((g) => (
              <div
                key={g.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-surface-elevated/40 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{g.reason}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                        g.status === 'active'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : g.status === 'revoked'
                          ? 'bg-destructive/10 text-destructive border border-destructive/20'
                          : 'bg-muted/20 text-muted'
                      }`}
                    >
                      {g.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted font-mono">
                    Duration: {g.duration_hours}h • Granted {new Date(g.created_at).toLocaleString()}
                    {g.ticket_id && ` • Ticket #${g.ticket_id}`}
                  </div>
                </div>

                <div className="text-[11px] text-muted font-mono shrink-0">
                  {g.status === 'revoked' && g.revoked_at ? (
                    <span className="text-destructive">Revoked {new Date(g.revoked_at).toLocaleTimeString()}</span>
                  ) : (
                    <span>Expired {new Date(g.expires_at).toLocaleTimeString()}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Grant Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="sm"
        title={
          <div>
            <div className="text-xs font-mono font-bold text-brand-primary uppercase">Security Handshake</div>
            <div className="text-base font-bold text-foreground font-display mt-0.5">
              Grant Support Access
            </div>
          </div>
        }
      >
        <form onSubmit={handleGrantAccess} className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-brand-primary/5 border border-brand-primary/20 text-foreground space-y-1">
            <div className="font-semibold text-brand-primary flex items-center gap-1.5">
              <ShieldCheck size={14} />
              <span>Privacy & Audit Guarantee</span>
            </div>
            <p className="text-[11px] text-secondary leading-relaxed">
              Support staff are granted <strong>read-only diagnostic access</strong> strictly for troubleshooting. All actions and entries are immutably logged to the platform audit trail.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-secondary block">Access Duration</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { hours: 2, label: '2 Hours', desc: 'Standard diagnosis' },
                { hours: 6, label: '6 Hours', desc: 'Complex issues' },
                { hours: 24, label: '24 Hours', desc: 'Extended testing' },
              ].map((d) => (
                <button
                  key={d.hours}
                  type="button"
                  onClick={() => setDurationHours(d.hours)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    durationHours === d.hours
                      ? 'border-brand-primary bg-brand-primary/10 text-foreground font-bold'
                      : 'border-separator bg-surface-elevated text-muted'
                  }`}
                >
                  <div className="text-xs">{d.label}</div>
                  <div className="text-[10px] text-muted font-normal mt-0.5">{d.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-secondary block">
              Support Ticket Reference <span className="text-muted font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g., TCK-48201 or MoMo Webhook issue"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              className="w-full bg-surface-elevated border border-separator rounded-xl px-3 py-2 text-foreground focus:outline-hidden focus:border-brand-primary font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-secondary block">
              Reason for Support Access <span className="text-rose-400 font-bold">*</span>
            </label>
            <textarea
              required
              rows={2}
              placeholder="Describe what issue you need support staff to investigate (e.g., WhatsApp orders not syncing, payment status discrepancy)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-surface-elevated border border-separator rounded-xl px-3 py-2 text-foreground focus:outline-hidden focus:border-brand-primary"
            />
          </div>

          {formError && (
            <div className="p-3 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-xs">
              {formError}
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
              className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-primary text-brand-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Authorizing...
                </>
              ) : (
                'Authorize Support Access'
              )}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!grantToRevoke}
        onClose={() => setGrantToRevoke(null)}
        onConfirm={confirmRevoke}
        title="Revoke Support Access"
        description="Revoke platform support access immediately? Support staff will no longer be able to inspect diagnostics."
        confirmText="Revoke Access"
        isDestructive
        isLoading={isPending}
      />
    </div>
  );
}
