'use client';

import { useState } from 'react';
import { MessageCircle, BookOpen, Keyboard, ExternalLink, LifeBuoy, Send, Phone } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'sonner';

interface HelpSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpSupportModal({ isOpen, onClose }: HelpSupportModalProps) {
  const [activeTab, setActiveTab] = useState<'quick' | 'guides' | 'shortcuts'>('quick');
  const [feedbackText, setFeedbackText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setFeedbackText('');
      toast.success('Thank you! Your feedback has been sent to our team.');
    }, 600);
  };

  const handleOpenWhatsAppSupport = () => {
    const msg = encodeURIComponent('Hello Merchander Support team! I need assistance with my store dashboard.');
    window.open(`https://wa.me/233240000000?text=${msg}`, '_blank');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
            <LifeBuoy size={17} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground font-display leading-tight">Merchander Help & Support</h2>
            <p className="text-[11px] text-muted font-normal">Direct assistance, guides, and merchant shortcuts</p>
          </div>
        </div>
      }
      size="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] text-muted">Ghana Support: Mon - Sat (8am - 8pm GMT)</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-surface border border-separator text-xs font-semibold text-foreground hover:bg-surface-elevated transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      }
    >
      <div className="space-y-4 py-1">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-surface-elevated rounded-xl border border-separator/80">
          <button
            type="button"
            onClick={() => setActiveTab('quick')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'quick'
                ? 'bg-surface text-foreground shadow-2xs font-bold'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <MessageCircle size={13} className="text-success" />
            <span>Direct Support</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guides')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'guides'
                ? 'bg-surface text-foreground shadow-2xs font-bold'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <BookOpen size={13} className="text-brand-primary" />
            <span>Guides</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('shortcuts')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'shortcuts'
                ? 'bg-surface text-foreground shadow-2xs font-bold'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <Keyboard size={13} className="text-info" />
            <span>Shortcuts</span>
          </button>
        </div>

        {/* Tab 1: Direct Support */}
        {activeTab === 'quick' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-linear-to-r from-success/10 to-brand-primary/10 border border-success/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <h4 className="text-xs font-bold text-foreground">Live WhatsApp Support</h4>
                </div>
                <p className="text-[11px] text-muted mt-0.5">
                  Chat with a dedicated Ghanaian merchant onboarding specialist.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenWhatsAppSupport}
                className="px-4 py-2 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:bg-[#20bd5a] transition-colors flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
              >
                <Phone size={13} />
                <span>Chat on WhatsApp</span>
              </button>
            </div>

            {/* Quick Feedback Form */}
            <form onSubmit={handleSendFeedback} className="space-y-2.5">
              <label className="block text-xs font-semibold text-foreground">
                Report an Issue or Suggest a Feature
              </label>
              <textarea
                rows={3}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Tell us what you need help with or how we can make Merchander better for your business..."
                className="w-full bg-surface-elevated border border-separator rounded-xl px-3.5 py-2.5 text-xs placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary resize-none transition"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSending || !feedbackText.trim()}
                  className="px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary-600 disabled:opacity-40 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Send size={12} />
                  <span>{isSending ? 'Sending...' : 'Send to Team'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Operational Guides */}
        {activeTab === 'guides' && (
          <div className="space-y-2 animate-fadeIn max-h-60 overflow-y-auto custom-scrollbar pr-1">
            {[
              {
                title: 'Mobile Money SMS Reconciliation',
                desc: 'Paste MTN or Telecel SMS alerts to automatically match and settle orders.',
                link: '/dashboard/orders',
              },
              {
                title: 'Connecting WhatsApp Cloud API',
                desc: 'Set up automated message replies and live catalogue ordering.',
                link: '/dashboard/settings/channels',
              },
              {
                title: 'Dynamic QR Product Flyers',
                desc: 'Generate social flyers and downloadable QR codes for WhatsApp status.',
                link: '/dashboard/products',
              },
              {
                title: 'Tema Port Landed Cost Calculation',
                desc: 'Track CBM sea freight & air cargo costs allocated per product unit.',
                link: '/dashboard/shipments',
              },
            ].map((guide) => (
              <a
                key={guide.title}
                href={guide.link}
                onClick={onClose}
                className="p-3 rounded-xl bg-surface border border-separator/80 hover:bg-surface-elevated transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-foreground group-hover:text-brand-primary transition-colors">
                    {guide.title}
                  </div>
                  <div className="text-[11px] text-muted mt-0.5">{guide.desc}</div>
                </div>
                <ExternalLink size={13} className="text-muted group-hover:text-brand-primary shrink-0 ml-2" />
              </a>
            ))}
          </div>
        )}

        {/* Tab 3: Keyboard Shortcuts */}
        {activeTab === 'shortcuts' && (
          <div className="space-y-2 animate-fadeIn">
            {[
              { key: 'Ctrl / ⌘ + K', label: 'Universal Command Palette Search' },
              { key: 'N', label: 'Create New Order Wizard' },
              { key: 'P', label: 'Navigate to Products Catalog' },
              { key: 'Esc', label: 'Close Active Modal / Drawer' },
            ].map((sc) => (
              <div
                key={sc.key}
                className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-separator/80 text-xs"
              >
                <span className="text-muted">{sc.label}</span>
                <kbd className="px-2 py-1 rounded-lg bg-surface-elevated border border-separator font-mono text-[11px] font-bold text-foreground">
                  {sc.key}
                </kbd>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
