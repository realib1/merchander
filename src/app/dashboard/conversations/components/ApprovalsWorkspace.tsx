'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AIActionRecord } from '@/types/actions';
import { filterActionQueue, QueueTabFilter } from '@/utils/actionsMath';
import { ApprovalActionCard } from './ApprovalActionCard';
import { UrgentExceptionCard } from './UrgentExceptionCard';
import {
  Search,
  CheckCheck,
  RotateCw,
  Clock,
  AlertTriangle,
  History,
  Inbox,
  Loader2,
} from 'lucide-react';

interface ApprovalsWorkspaceProps {
  initialActions: AIActionRecord[];
}

export function ApprovalsWorkspace({ initialActions }: ApprovalsWorkspaceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<QueueTabFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const filteredActions = filterActionQueue(initialActions, searchQuery, activeTab);

  // Compute counts for tab badges
  const pendingYellowCount = initialActions.filter(
    (a) => a.tier === 'yellow' && a.status === 'pending'
  ).length;
  const urgentRedCount = initialActions.filter(
    (a) => a.tier === 'red' && a.status === 'pending'
  ).length;
  const allPendingCount = initialActions.filter((a) => a.status === 'pending').length;
  const historyCount = initialActions.filter((a) => a.status !== 'pending').length;

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* 1. Header Toolbar & Tab Filter */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-surface border border-separator rounded-2xl p-3 shadow-xs">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-2 shrink-0 ${
              activeTab === 'all'
                ? 'bg-foreground text-background font-semibold shadow-xs'
                : 'text-muted hover:text-foreground hover:bg-surface-muted'
            }`}
          >
            <Clock size={13} />
            All Pending
            {allPendingCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'all'
                    ? 'bg-background text-foreground'
                    : 'bg-surface-muted text-foreground'
                }`}
              >
                {allPendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('yellow')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-2 shrink-0 ${
              activeTab === 'yellow'
                ? 'bg-amber-500 text-white font-semibold shadow-xs'
                : 'text-muted hover:text-amber-500 hover:bg-amber-500/10'
            }`}
          >
            <Clock size={13} />
            Pending Approvals
            {pendingYellowCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-amber-600/30 text-white">
                {pendingYellowCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('red')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-2 shrink-0 ${
              activeTab === 'red'
                ? 'bg-rose-500 text-white font-semibold shadow-xs'
                : 'text-muted hover:text-rose-500 hover:bg-rose-500/10'
            }`}
          >
            <AlertTriangle size={13} />
            Urgent Exceptions
            {urgentRedCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-rose-600 text-white animate-pulse">
                {urgentRedCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-2 shrink-0 ${
              activeTab === 'history'
                ? 'bg-foreground text-background font-semibold shadow-xs'
                : 'text-muted hover:text-foreground hover:bg-surface-muted'
            }`}
          >
            <History size={13} />
            History
            {historyCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-surface-muted text-muted">
                {historyCount}
              </span>
            )}
          </button>
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer, phone, or intent..."
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-separator bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-brand-primary placeholder:text-muted"
            />
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isPending}
            className="p-2 border border-separator rounded-xl text-muted hover:text-foreground hover:bg-surface-muted transition shrink-0"
            title="Refresh queue"
          >
            {isPending ? (
              <Loader2 size={14} className="animate-spin text-brand-primary" />
            ) : (
              <RotateCw size={14} />
            )}
          </button>
        </div>
      </div>

      {/* 2. Action List / Empty State */}
      {filteredActions.length === 0 ? (
        <div className="bg-surface border border-separator rounded-2xl p-14 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-surface-muted text-muted flex items-center justify-center border border-separator">
            <Inbox size={24} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {searchQuery ? 'No Matching Queue Items' : 'All Clear — Inbox Zero!'}
            </h3>
            <p className="text-xs text-muted max-w-sm mt-1">
              {searchQuery
                ? `No actions matched "${searchQuery}". Try clearing your search.`
                : activeTab === 'red'
                ? 'No urgent human exceptions at this time. All customer inquiries are being safely handled.'
                : activeTab === 'yellow'
                ? 'No pending Yellow actions awaiting verification. Commercial & financial operations are up to date.'
                : 'All AI actions have been reviewed and dispatched. New payment claims or human requests will arrive here automatically.'}
            </p>
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs text-brand-primary hover:underline font-medium mt-1"
            >
              Clear search filter
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredActions.map((action) => {
            if (action.tier === 'red') {
              return (
                <UrgentExceptionCard
                  key={action.id}
                  action={action}
                  onMutated={handleRefresh}
                />
              );
            }
            return (
              <ApprovalActionCard
                key={action.id}
                action={action}
                onMutated={handleRefresh}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
