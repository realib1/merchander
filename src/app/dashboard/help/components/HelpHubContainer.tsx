'use client';

import React, { useState } from 'react';
import { SupportTicket, SystemIncident, HelpArticle, TicketCategory, SupportAccessGrant } from '@/types/support';
import { HelpCenterView } from './HelpCenterView';
import { ContactSupportForm } from './ContactSupportForm';
import { MyRequestsView } from './MyRequestsView';
import { SystemStatusView } from './SystemStatusView';
import { SupportAccessDelegationView } from './SupportAccessDelegationView';
import { BookOpen, MessageSquare, Ticket, Activity, LifeBuoy, Key } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

interface HelpHubContainerProps {
  initialTickets: SupportTicket[];
  initialIncidents: SystemIncident[];
  articles: HelpArticle[];
  diagnostics: unknown;
  activeGrant?: SupportAccessGrant | null;
  grantHistory?: SupportAccessGrant[];
}

export function HelpHubContainer({
  initialTickets,
  initialIncidents,
  articles,
  activeGrant,
  grantHistory = [],
}: HelpHubContainerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const areaParam = searchParams.get('area');
  const errorParam = searchParams.get('error');

  const initialTab =
    tabParam === 'contact' ||
    tabParam === 'requests' ||
    tabParam === 'status' ||
    tabParam === 'access'
      ? tabParam
      : 'help_center';

  const [activeTab, setActiveTab] = useState<
    'help_center' | 'contact' | 'requests' | 'status' | 'access'
  >(initialTab);

  const [prefillSubject, setPrefillSubject] = useState<string>(
    areaParam ? `Issue reported in ${areaParam}${errorParam ? `: ${errorParam}` : ''}` : ''
  );
  const [prefillCategory, setPrefillCategory] = useState<TicketCategory>(
    areaParam &&
      ['channels', 'orders', 'payments', 'domain', 'storefront', 'intelligence', 'billing', 'account'].includes(
        areaParam.toLowerCase()
      )
      ? (areaParam.toLowerCase() as TicketCategory)
      : 'other'
  );
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const handleOpenContactWithTopic = (subject?: string, category?: TicketCategory) => {
    if (subject) setPrefillSubject(subject);
    if (category) setPrefillCategory(category);
    setActiveTab('contact');
  };

  const handleTicketCreated = (ticketId: string) => {
    setSelectedRequestId(ticketId);
    setActiveTab('requests');
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-brand-primary/10 text-brand-primary">
              <LifeBuoy size={18} />
            </div>
            <h2 className="text-xl font-bold font-display text-foreground tracking-tight">Help & Support Hub</h2>
          </div>
          <p className="text-xs text-muted">
            Find answers, contact technical engineering, review active cases, and govern diagnostic access.
          </p>
        </div>

        {/* Global Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-surface rounded-2xl border border-separator shadow-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('help_center')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'help_center'
                ? 'bg-brand-primary text-white shadow-xs font-bold'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <BookOpen size={13} />
            <span>Help Center</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'contact'
                ? 'bg-brand-primary text-white shadow-xs font-bold'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <MessageSquare size={13} />
            <span>Contact Support</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-brand-primary text-white shadow-xs font-bold'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <Ticket size={13} />
            <span>My Requests ({initialTickets.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('access')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'access'
                ? 'bg-brand-primary text-white shadow-xs font-bold'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <Key size={13} />
            <span>Support Access</span>
            {activeGrant && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'status'
                ? 'bg-brand-primary text-white shadow-xs font-bold'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <Activity size={13} />
            <span>System Status</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'help_center' && (
        <HelpCenterView articles={articles} onOpenContact={handleOpenContactWithTopic} />
      )}

      {activeTab === 'contact' && (
        <ContactSupportForm
          initialSubject={prefillSubject}
          initialCategory={prefillCategory}
          onTicketCreated={handleTicketCreated}
        />
      )}

      {activeTab === 'requests' && (
        <MyRequestsView
          tickets={initialTickets}
          initialSelectedId={selectedRequestId}
          onRefresh={() => router.refresh()}
          onOpenNewTicket={() => setActiveTab('contact')}
        />
      )}

      {activeTab === 'access' && (
        <SupportAccessDelegationView
          initialActiveGrant={activeGrant || null}
          initialHistory={grantHistory}
        />
      )}

      {activeTab === 'status' && (
        <SystemStatusView
          incidents={initialIncidents}
          onOpenReport={() =>
            handleOpenContactWithTopic('System Outage / Degradation Report', 'other')
          }
        />
      )}
    </div>
  );
}
