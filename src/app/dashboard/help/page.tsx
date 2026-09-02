import React, { Suspense } from 'react';
import { getMerchantSupportData } from '@/app/actions/support';
import { getTenantSupportAccessGrantsAction } from '@/app/actions/support-grant';
import { HelpHubContainer } from './components/HelpHubContainer';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Help Center, Support & System Status | Merchander',
  description: 'Merchant task guides, contextual support tickets, case threads, and platform status.',
};

export default async function HelpPage() {
  const [supportData, grantData] = await Promise.all([
    getMerchantSupportData(),
    getTenantSupportAccessGrantsAction(),
  ]);

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6 pb-16">
      <h1 className="sr-only">Help & Support Hub</h1>
      <Suspense fallback={<div className="p-8 text-center text-xs text-muted">Loading Help & Support Hub...</div>}>
        <HelpHubContainer
          initialTickets={supportData.tickets}
          initialIncidents={supportData.incidents}
          articles={supportData.articles}
          diagnostics={supportData.diagnostics}
          activeGrant={grantData.activeGrant}
          grantHistory={grantData.history}
        />
      </Suspense>
    </div>
  );
}
