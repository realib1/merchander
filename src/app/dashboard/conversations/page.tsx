import React from 'react';
import { getPendingApprovals, getApprovalsQueueMetrics } from '@/app/actions/approvals';
import { ApprovalsTopMetrics } from './components/ApprovalsTopMetrics';
import { ApprovalsWorkspace } from './components/ApprovalsWorkspace';

export const metadata = {
  title: 'Approvals & Inquiries | Merchander',
  description:
    'Operational approval and exceptions queue for AI actions, payment claims, and WhatsApp customer handoffs.',
};

export default async function ConversationsPage() {
  const [metrics, actions] = await Promise.all([
    getApprovalsQueueMetrics(),
    getPendingApprovals({ status: 'all', limit: 100 }),
  ]);

  return (
    <div className="flex flex-col animate-fadeIn max-w-7xl mx-auto w-full">
      <div className="flex flex-col gap-1 mb-6">
        <h1 className="text-xl font-bold text-foreground">Approvals & Inquiries</h1>
        <p className="text-xs text-muted">
          Review commercial actions requiring approval, verify payment claims, and take over urgent WhatsApp conversations.
        </p>
      </div>

      {/* Top 4 KPI Metrics */}
      <ApprovalsTopMetrics metrics={metrics} />

      {/* Approvals & Exceptions Workspace */}
      <ApprovalsWorkspace initialActions={actions} />
    </div>
  );
}
