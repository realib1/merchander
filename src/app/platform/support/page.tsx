import React from 'react';
import { getPlatformSupportTicketsAction } from '@/app/actions/platform-support';
import { requirePlatformRoute } from '@/lib/auth/require-platform-route';
import { SupportClient } from './components/SupportClient';

export const dynamic = 'force-dynamic';

export default async function SupportPage() {
  await requirePlatformRoute('/platform/support');
  const { tickets } = await getPlatformSupportTicketsAction();

  return (
    <div className="flex flex-col animate-fadeIn max-w-7xl mx-auto w-full space-y-6">
      <SupportClient initialTickets={tickets} />
    </div>
  );
}
