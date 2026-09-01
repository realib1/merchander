import React, { Suspense } from 'react';
import { getMerchantSupportData } from '@/app/actions/support';
import { HelpHubContainer } from './components/HelpHubContainer';

export const metadata = {
  title: 'Help Center, Support & System Status | Merchander',
  description: 'Merchant task guides, contextual support tickets, case threads, and platform status.',
};

export default async function HelpPage() {
  const data = await getMerchantSupportData();

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6 pb-16">
      <h1 className="sr-only">Help & Support Hub</h1>
      <Suspense fallback={<div className="p-8 text-center text-xs text-muted">Loading Help & Support Hub...</div>}>
        <HelpHubContainer
          initialTickets={data.tickets}
          initialIncidents={data.incidents}
          articles={data.articles}
          diagnostics={data.diagnostics}
        />
      </Suspense>
    </div>
  );
}
