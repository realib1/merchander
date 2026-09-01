'use client';

import React, { useState, useTransition, useEffect } from 'react';
import {
  MessageCircle,
  BookOpen,
  Keyboard,
  ExternalLink,
  LifeBuoy,
  Send,
  Phone,
  Copy,
  Check,
  Loader2,
  Info,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { submitSupportTicket, getStoreSupportDiagnostics, StoreDiagnostics } from '@/app/actions/support';
import { toast } from 'sonner';

interface HelpSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpSupportModal({ isOpen, onClose }: HelpSupportModalProps) {
  const [activeTab, setActiveTab] = useState<'quick' | 'guides' | 'shortcuts' | 'diagnostics'>('quick');
  const [category, setCategory] = useState<'issue' | 'feature' | 'billing' | 'onboarding' | 'other'>('issue');
  const [feedbackText, setFeedbackText] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [diagnostics, setDiagnostics] = useState<StoreDiagnostics | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getStoreSupportDiagnostics().then((data) => {
        if (data) setDiagnostics(data);
      });
    }
  }, [isOpen]);

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    startTransition(async () => {
      const res = await submitSupportTicket({
        category,
        message: feedbackText,
        isUrgent,
      });

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Ticket ${res.referenceCode} created! Our engineering team will review it.`);
        setFeedbackText('');
        setIsUrgent(false);
      }
    });
  };

  const handleOpenWhatsAppSupport = () => {
    const storeInfo = diagnostics ? ` (Store: ${diagnostics.storeName}, ID: ${diagnostics.tenantId})` : '';
    const msg = encodeURIComponent(
      `Hello Merchander Support Team! I need assistance with my store dashboard${storeInfo}.`
    );
    const supportNumber = diagnostics?.supportPhone ? diagnostics.supportPhone.replace(/[^0-9]/g, '') : '233240000000';
    window.open(`https://wa.me/${supportNumber}?text=${msg}`, '_blank');
  };

  const handleCopyDiagnostics = () => {
    if (!diagnostics) return;
    const diagText = [
      `Store: ${diagnostics.storeName}`,
      `Tenant ID: ${diagnostics.tenantId}`,
      `Email: ${diagnostics.userEmail}`,
      `Currency: ${diagnostics.currency}`,
      `Products: ${diagnostics.productCount}`,
      `Active Batches: ${diagnostics.activeBatchCount}`,
      `User Agent: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'}`,
      `Timestamp: ${new Date().toISOString()}`,
    ].join('\n');

    navigator.clipboard.writeText(diagText);
    setCopied(true);
    toast.success('System diagnostics copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
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
        <div className="flex items-center gap-1.5 p-1 bg-surface-elevated rounded-xl border border-separator/80 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('quick')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
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
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
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
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'shortcuts'
                ? 'bg-surface text-foreground shadow-2xs font-bold'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <Keyboard size={13} className="text-info" />
            <span>Shortcuts</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('diagnostics')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'diagnostics'
                ? 'bg-surface text-foreground shadow-2xs font-bold'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <Info size={13} className="text-purple-500" />
            <span>System</span>
          </button>
        </div>

        {/* Tab 1: Direct Support */}
        {activeTab === 'quick' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-linear-to-r from-success/10 to-brand-primary/10 border border-success/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <h3 className="text-xs font-bold text-foreground">Live WhatsApp Support</h3>
                </div>
                <p className="text-[11px] text-muted mt-0.5">
                  Chat with a dedicated Ghanaian merchant specialist on WhatsApp.
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

            {/* Support Ticket Submission Form */}
            <form onSubmit={handleSendFeedback} className="space-y-3 pt-1">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="ticketCategory" className="block text-xs font-semibold text-foreground">
                  Submit Support Ticket / Feedback
                </label>
                <select
                  id="ticketCategory"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as typeof category)}
                  disabled={isPending}
                  className="rounded-lg border border-separator bg-surface px-2.5 py-1 text-[11px] font-semibold text-foreground outline-none cursor-pointer"
                >
                  <option value="issue">Report Bug / Issue</option>
                  <option value="feature">Feature Request</option>
                  <option value="billing">Billing / Plan</option>
                  <option value="onboarding">Store Onboarding</option>
                  <option value="other">General Inquiry</option>
                </select>
              </div>

              <textarea
                rows={3}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Tell us what you need assistance with or how we can improve Merchander for your store..."
                disabled={isPending}
                className="w-full bg-surface-elevated border border-separator rounded-xl px-3.5 py-2.5 text-xs placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary resize-none transition"
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isUrgent}
                    onChange={(e) => setIsUrgent(e.target.checked)}
                    disabled={isPending}
                    className="rounded border-separator text-brand-primary focus:ring-brand-primary/50"
                  />
                  <span>Mark as Urgent Issue</span>
                </label>

                <button
                  type="submit"
                  disabled={isPending || !feedbackText.trim()}
                  className="px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary-600 disabled:opacity-40 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  {isPending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  <span>{isPending ? 'Submitting...' : 'Submit Ticket'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Operational Guides */}
        {activeTab === 'guides' && (
          <div className="space-y-2 animate-fadeIn max-h-68 overflow-y-auto custom-scrollbar pr-1">
            {[
              {
                title: 'Pre-order Batches & Arrival Timelines',
                desc: 'Configure batch open/close dates, cargo freight modes, and automated arrival countdowns.',
                link: '/dashboard/inventory/batches',
              },
              {
                title: 'Intelligence Goals & Pace Engine',
                desc: 'Set revenue, order, and customer targets with automated daily pace and risk tracking.',
                link: '/dashboard/insights',
              },
              {
                title: 'Mobile Money SMS Reconciliation',
                desc: 'Paste MTN MoMo or Telecel SMS alerts to automatically verify and match payments.',
                link: '/dashboard/orders',
              },
              {
                title: 'WhatsApp Automation & Channels',
                desc: 'Connect WhatsApp Cloud API for automated message replies and live catalogue checkout.',
                link: '/dashboard/settings/channels',
              },
              {
                title: 'Dynamic QR Product Flyers',
                desc: 'Generate branded social flyers and downloadable QR codes for WhatsApp status.',
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
              { key: 'I', label: 'Open Intelligence & Goals' },
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

        {/* Tab 4: System Diagnostics */}
        {activeTab === 'diagnostics' && (
          <div className="space-y-3 animate-fadeIn">
            <div className="p-3 rounded-xl bg-surface-elevated border border-separator/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">Store Diagnostics</span>
                <button
                  type="button"
                  onClick={handleCopyDiagnostics}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-primary hover:underline cursor-pointer"
                >
                  {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy Diagnostics'}</span>
                </button>
              </div>

              {diagnostics ? (
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-muted block">Tenant ID:</span>
                    <span className="font-mono font-semibold text-foreground truncate block">
                      {diagnostics.tenantId}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block">Store Name:</span>
                    <span className="font-semibold text-foreground truncate block">{diagnostics.storeName}</span>
                  </div>
                  <div>
                    <span className="text-muted block">Currency:</span>
                    <span className="font-semibold text-foreground">{diagnostics.currency}</span>
                  </div>
                  <div>
                    <span className="text-muted block">Catalog & Batches:</span>
                    <span className="font-semibold text-foreground">
                      {diagnostics.productCount} products, {diagnostics.activeBatchCount} active batches
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-2 text-center text-muted">Loading system telemetry...</div>
              )}
            </div>

            <p className="text-[11px] text-muted leading-relaxed">
              When contacting our support team, copying your store diagnostics helps us investigate and resolve issues
              faster.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
