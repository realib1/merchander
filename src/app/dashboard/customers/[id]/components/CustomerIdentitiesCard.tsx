'use client';

import { useState } from 'react';
import { MessageSquare, Plus, Trash2, CheckCircle2, Globe, Send, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { linkCustomerIdentity, removeCustomerIdentity } from '@/app/actions/customers';
import { Modal } from '@/components/ui/Modal';

export interface CustomerIdentity {
  id: string;
  customer_id: string;
  channel: 'whatsapp' | 'instagram' | 'facebook' | 'telegram' | 'storefront';
  identifier: string;
  profile_data?: Record<string, unknown> | null;
  is_verified: boolean;
  created_at: string;
}

interface CustomerIdentitiesCardProps {
  customerId: string;
  initialIdentities: CustomerIdentity[];
}

const CHANNEL_CONFIG = {
  whatsapp: {
    name: 'WhatsApp',
    icon: Phone,
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    borderColor: 'border-emerald-500/20',
    placeholder: '+233 24 123 4567 or JID',
  },
  instagram: {
    name: 'Instagram',
    icon: MessageSquare,
    bgColor: 'bg-pink-500/10',
    textColor: 'text-pink-600 dark:text-pink-400',
    borderColor: 'border-pink-500/20',
    placeholder: '@username or IGID',
  },
  facebook: {
    name: 'Facebook',
    icon: Globe,
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-500/20',
    placeholder: 'Profile ID or PSID',
  },
  telegram: {
    name: 'Telegram',
    icon: Send,
    bgColor: 'bg-sky-500/10',
    textColor: 'text-sky-600 dark:text-sky-400',
    borderColor: 'border-sky-500/20',
    placeholder: '@telegram_handle or Chat ID',
  },
  storefront: {
    name: 'Storefront Account',
    icon: Globe,
    bgColor: 'bg-brand-primary/10',
    textColor: 'text-brand-primary',
    borderColor: 'border-brand-primary/20',
    placeholder: 'Customer Account ID / Email',
  },
};

export function CustomerIdentitiesCard({ customerId, initialIdentities }: CustomerIdentitiesCardProps) {
  const [identities, setIdentities] = useState<CustomerIdentity[]>(initialIdentities);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<
    'whatsapp' | 'instagram' | 'facebook' | 'telegram' | 'storefront'
  >('whatsapp');
  const [identifierInput, setIdentifierInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLinkIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifierInput.trim()) {
      toast.error('Please enter a valid handle or phone number');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await linkCustomerIdentity(customerId, selectedChannel, identifierInput.trim());
      setIdentities((prev) => {
        const filtered = prev.filter(
          (item) => item.channel !== selectedChannel || item.identifier !== identifierInput.trim()
        );
        return [...filtered, created as unknown as CustomerIdentity];
      });
      toast.success(`Connected ${CHANNEL_CONFIG[selectedChannel].name} identity`);
      setIdentifierInput('');
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to link identity');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveIdentity = async (identityId: string, channelName: string) => {
    try {
      await removeCustomerIdentity(identityId, customerId);
      setIdentities((prev) => prev.filter((i) => i.id !== identityId));
      toast.success(`Removed ${channelName} identity`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove identity');
    }
  };

  return (
    <div className="bg-surface border border-separator rounded-2xl p-6 shadow-xs flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground font-display">Unified Social Identities</h2>
          <p className="text-xs text-muted mt-0.5">Connected channels resolving to this single customer profile</p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-elevated text-xs font-semibold text-foreground hover:bg-brand-primary/10 hover:text-brand-primary transition-colors border border-separator"
        >
          <Plus size={14} />
          Link Channel
        </button>
      </div>

      {identities.length === 0 ? (
        <div className="p-4 rounded-xl bg-surface-elevated/40 border border-separator/60 text-center text-xs text-muted">
          No additional social identities linked yet. Click &quot;Link Channel&quot; to connect WhatsApp, Instagram, or
          Telegram accounts.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {identities.map((item) => {
            const config = CHANNEL_CONFIG[item.channel] || CHANNEL_CONFIG.storefront;
            const Icon = config.icon;

            return (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3 rounded-xl border ${config.borderColor} ${config.bgColor} transition-all`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.textColor} bg-surface shrink-0 shadow-2xs`}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-foreground truncate">{config.name}</span>
                      {item.is_verified && (
                        <span title="Verified">
                          <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-muted truncate">{item.identifier}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveIdentity(item.id, config.name)}
                  className="p-1.5 text-muted hover:text-destructive hover:bg-surface rounded-lg transition-colors ml-2 shrink-0"
                  title="Unlink identity"
                  aria-label={`Unlink ${config.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Link Identity Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Link Social Channel Identity"
        description="Associate a WhatsApp number, Instagram handle, or Telegram ID with this customer."
        size="sm"
      >
        <form onSubmit={handleLinkIdentity} className="flex flex-col gap-4 py-2">
          <div>
            <label htmlFor="channel-select" className="text-xs font-semibold text-foreground block mb-1.5">
              Channel Platform
            </label>
            <select
              id="channel-select"
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value as typeof selectedChannel)}
              className="w-full px-3 py-2 text-sm bg-surface-elevated border border-separator rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="whatsapp">WhatsApp (Phone number / JID)</option>
              <option value="instagram">Instagram (DM handle / Scoped ID)</option>
              <option value="facebook">Facebook (Messenger PSID / Profile)</option>
              <option value="telegram">Telegram (Handle / Chat ID)</option>
              <option value="storefront">Storefront Account</option>
            </select>
          </div>

          <div>
            <label htmlFor="identifier-input" className="text-xs font-semibold text-foreground block mb-1.5">
              Identifier or Handle
            </label>
            <input
              id="identifier-input"
              type="text"
              value={identifierInput}
              onChange={(e) => setIdentifierInput(e.target.value)}
              placeholder={CHANNEL_CONFIG[selectedChannel].placeholder}
              className="w-full px-3 py-2 text-sm bg-surface-elevated border border-separator rounded-xl placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary"
              required
            />
            <p className="text-[11px] text-muted mt-1">
              Messages from this handle or number will automatically associate with this customer.
            </p>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-surface-elevated text-foreground hover:bg-surface border border-separator transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-brand-primary text-white hover:bg-brand-primary-600 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Linking...' : 'Connect Identity'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
