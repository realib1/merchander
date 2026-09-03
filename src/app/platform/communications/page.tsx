import React from 'react';
import { getPlatformBroadcastsAction } from '@/app/actions/platform-comms';
import { requirePlatformRoute } from '@/lib/auth/require-platform-route';
import { CommunicationsClient } from './components/CommunicationsClient';

export const dynamic = 'force-dynamic';

export default async function CommunicationsPage() {
  await requirePlatformRoute('/platform/communications');
  const { broadcasts } = await getPlatformBroadcastsAction();

  return (
    <div className="flex flex-col animate-fadeIn max-w-7xl mx-auto w-full space-y-6">
      <CommunicationsClient initialBroadcasts={broadcasts} />
    </div>
  );
}
