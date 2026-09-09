'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { PlatformBroadcast, BroadcastType, BroadcastTarget } from '@/types/platform';
import { createPlatformBroadcastAction, toggleBroadcastStatusAction } from '@/app/actions/platform-comms';

interface CommunicationsClientProps {
  initialBroadcasts: PlatformBroadcast[];
}

export function CommunicationsClient({ initialBroadcasts }: CommunicationsClientProps) {
  const [broadcasts, setBroadcasts] = useState<PlatformBroadcast[]>(initialBroadcasts);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<BroadcastType>('info');
  const [target, setTarget] = useState<BroadcastTarget>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await createPlatformBroadcastAction({
        title,
        message,
        type,
        target,
      });

      if (res.success) {
        setBroadcasts([
          {
            id: `bc_${Date.now()}`,
            title,
            message,
            type,
            target,
            is_pinned: false,
            is_active: true,
            starts_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          },
          ...broadcasts,
        ]);
        setTitle('');
        setMessage('');
        setShowModal(false);
      }
    } catch (err) {
      console.error('Error creating broadcast:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (id: string, currentActive: boolean) => {
    try {
      const res = await toggleBroadcastStatusAction(id, !currentActive);
      if (res.success) {
        setBroadcasts((prev) =>
          prev.map((b) => (b.id === id ? { ...b, is_active: !currentActive } : b))
        );
      }
    } catch (err) {
      console.error('Error toggling broadcast:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-primary text-brand-primary-foreground hover:bg-brand-primary/90 transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <Plus size={14} />
          <span>New Platform Broadcast</span>
        </button>
      </div>

      {/* Broadcast List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {broadcasts.length === 0 ? (
          <div className="col-span-2 p-8 rounded-2xl bg-surface border border-separator text-center text-xs text-muted">
            No platform broadcasts published yet.
          </div>
        ) : (
          broadcasts.map((b) => (
            <div key={b.id} className="p-5 rounded-2xl bg-surface border border-separator shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                    b.type === 'maintenance'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : b.type === 'security'
                      ? 'bg-destructive/10 text-destructive border-destructive/20'
                      : 'bg-brand-primary/10 text-brand-primary border-brand-primary/20'
                  }`}
                >
                  {b.type} • Target: {b.target.toUpperCase()}
                </span>

                <button
                  onClick={() => handleToggle(b.id, b.is_active)}
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    b.is_active
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-surface-elevated text-muted border border-separator'
                  }`}
                >
                  {b.is_active ? 'Active' : 'Inactive'}
                </button>
              </div>

              <div>
                <div className="font-bold text-sm text-foreground">{b.title}</div>
                <div className="text-xs text-secondary mt-1 leading-relaxed">{b.message}</div>
              </div>

              <div className="text-[11px] text-muted font-mono pt-2 border-t border-separator/40 flex items-center justify-between">
                <span>Published {new Date(b.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create Platform Broadcast"
        description="Publish announcements and operational maintenance alerts to merchant dashboards."
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreate}
              isLoading={isSubmitting}
              className="font-semibold"
            >
              Publish Broadcast
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="text-muted font-mono">Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Scheduled Network Maintenance on Sept 4"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-elevated border border-separator placeholder:text-muted focus:outline-hidden focus:border-brand-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-muted font-mono">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as BroadcastType)}
                className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-separator text-foreground focus:outline-hidden"
              >
                <option value="info">Info</option>
                <option value="announcement">Announcement</option>
                <option value="maintenance">Maintenance</option>
                <option value="warning">Warning</option>
                <option value="security">Security</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-muted font-mono">Target Tier</label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value as BroadcastTarget)}
                className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-separator text-foreground focus:outline-hidden"
              >
                <option value="all">All Merchants</option>
                <option value="starter">Starter &amp; Above</option>
                <option value="growth">Growth &amp; Above</option>
                <option value="business">Business &amp; Enterprise</option>
                <option value="enterprise">Enterprise Only</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-muted font-mono">Message</label>
            <textarea
              required
              rows={3}
              placeholder="Details displayed in tenant dashboards..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-elevated border border-separator placeholder:text-muted focus:outline-hidden focus:border-brand-primary"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
