import React from 'react';
import { getConversationsData } from '@/app/actions/conversations';
import { ConversationsTopMetrics } from './components/ConversationsTopMetrics';
import { ConversationsWorkspace } from './components/ConversationsWorkspace';

export const metadata = {
  title: 'Conversations | Merchander',
  description:
    'Manage WhatsApp, Telegram, and social customer conversations with smart bot intelligence and order conversion.',
};

export default async function ConversationsPage() {
  const data = await getConversationsData();

  return (
    <div className="flex flex-col animate-fadeIn max-w-7xl mx-auto w-full">
      <h1 className="sr-only">Conversations</h1>

      {/* Top 4 KPI Metrics */}
      <ConversationsTopMetrics metrics={data.metrics} />

      {/* Conversations Master-Detail Workspace */}
      <ConversationsWorkspace data={data} />
    </div>
  );
}
