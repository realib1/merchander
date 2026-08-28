'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConversationsData, ConversationThread } from '@/types/conversations';
import { ConversationListSidebar } from './ConversationListSidebar';
import { ChatStreamView } from './ChatStreamView';
import { CustomerContextPanel } from './CustomerContextPanel';

interface ConversationsWorkspaceProps {
  data: ConversationsData;
}

export function ConversationsWorkspace({ data }: ConversationsWorkspaceProps) {
  const router = useRouter();
  const [selectedThread, setSelectedThread] = useState<ConversationThread | null>(data.threads[0] || null);

  const handleCreateOrder = (customerId: string) => {
    router.push(`/dashboard/orders/new?customerId=${customerId}`);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start w-full">
      {/* 1. Left Sidebar / Conversation Threads List */}
      <ConversationListSidebar
        threads={data.threads}
        selectedThreadId={selectedThread?.id || null}
        onSelectThread={setSelectedThread}
      />

      {/* 2. Center Chat Stream View */}
      <ChatStreamView thread={selectedThread} quickReplies={data.quickReplies} onCreateOrder={handleCreateOrder} />

      {/* 3. Right Customer Context Panel */}
      <div className="hidden xl:block">
        <CustomerContextPanel thread={selectedThread} onCreateOrder={handleCreateOrder} />
      </div>
    </div>
  );
}
