'use client';

import React from 'react';
import { ConversationThread } from '@/types/conversations';
import { formatCurrency } from '@/utils/format';
import { User, Phone, ShoppingBag, ExternalLink, PlusCircle, Lightbulb, BarChart3, Tag } from 'lucide-react';
import Link from 'next/link';

interface CustomerContextPanelProps {
  thread: ConversationThread | null;
  onCreateOrder: (customerId: string) => void;
}

export function CustomerContextPanel({ thread, onCreateOrder }: CustomerContextPanelProps) {
  if (!thread) return null;

  return (
    <div className="w-full lg:w-72 xl:w-80 flex flex-col bg-surface border border-separator rounded-2xl overflow-hidden shadow-xs shrink-0 h-170">
      {/* Header */}
      <div className="p-4 border-b border-separator bg-surface-elevated/30">
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
          <User size={14} className="text-brand-primary" /> Customer Profile
        </h3>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {/* Customer Identity */}
        <div className="flex flex-col items-center text-center p-3 rounded-xl bg-surface-elevated/40 border border-separator/60">
          <div className="w-12 h-12 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-base mb-2">
            {thread.customerName.charAt(0)}
          </div>
          <h4 className="text-xs font-bold text-foreground">{thread.customerName}</h4>
          <p className="text-[11px] text-muted font-mono flex items-center gap-1 mt-0.5">
            <Phone size={11} /> {thread.customerPhone}
          </p>

          <Link
            href={`/dashboard/customers/${thread.customerId}`}
            className="mt-2 text-[11px] font-semibold text-brand-primary hover:underline flex items-center gap-1"
          >
            <span>View Full CRM Profile</span>
            <ExternalLink size={10} />
          </Link>
        </div>

        {/* Quick Commerce Actions */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => onCreateOrder(thread.customerId)}
            className="w-full py-2.5 rounded-xl bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary/90 cursor-pointer transition flex items-center justify-center gap-1.5 shadow-xs"
          >
            <PlusCircle size={14} />
            <span>Create New Order</span>
          </button>
        </div>

        {/* Customer Stats Cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-xl bg-surface-elevated border border-separator/60 text-left">
            <span className="text-[10px] text-muted font-semibold uppercase tracking-wider block">Total Spent</span>
            <span className="text-xs font-bold text-foreground tabular-nums mt-0.5 block">
              {formatCurrency(thread.totalSpent, 'GHS')}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-elevated border border-separator/60 text-left">
            <span className="text-[10px] text-muted font-semibold uppercase tracking-wider block">Orders Placed</span>
            <span className="text-xs font-bold text-foreground tabular-nums mt-0.5 block">
              {thread.ordersCount} {thread.ordersCount === 1 ? 'order' : 'orders'}
            </span>
          </div>
        </div>

        {/* Channel & Bot Intelligence */}
        <div className="p-3 rounded-xl bg-surface-elevated/40 border border-separator/60 space-y-2 text-xs">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted flex items-center gap-1">
              <Tag size={11} /> Channel:
            </span>
            <span className="font-semibold text-foreground uppercase">{thread.channel}</span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted flex items-center gap-1">
              <ShoppingBag size={11} /> Linked Order:
            </span>
            <span className="font-semibold text-foreground">
              {thread.linkedOrderId ? `#${thread.linkedOrderId.slice(0, 6)}` : 'None'}
            </span>
          </div>
        </div>

        {/* Business Intelligence & Cross-Links */}
        <div className="p-3 rounded-xl bg-brand-secondary/5 border border-brand-secondary/20 space-y-2">
          <div className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
            <Lightbulb size={13} className="text-brand-secondary" /> Smart Recommendation
          </div>
          <p className="text-[11px] text-muted leading-snug">
            {thread.ordersCount > 1
              ? 'VIP Returning Buyer: Eligible for loyalty perks or free delivery offer.'
              : 'New Inbound Lead: Send catalog link and offer first-time discount code.'}
          </p>

          <div className="pt-1 flex items-center gap-2">
            <Link
              href="/dashboard/insights"
              className="text-[10px] font-semibold text-brand-secondary hover:underline flex items-center gap-1"
            >
              <Lightbulb size={10} /> Insights
            </Link>
            <span className="text-muted">•</span>
            <Link
              href="/dashboard/analytics"
              className="text-[10px] font-semibold text-brand-secondary hover:underline flex items-center gap-1"
            >
              <BarChart3 size={10} /> Analytics
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
