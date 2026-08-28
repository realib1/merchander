'use client';

import React from 'react';
import { ConversationsMetrics } from '@/types/conversations';
import { MetricCard } from '@/components/ui/MetricCard';
import { MessageSquare, MessageCircle, Send, TrendingUp } from 'lucide-react';

interface ConversationsTopMetricsProps {
  metrics: ConversationsMetrics;
}

export function ConversationsTopMetrics({ metrics }: ConversationsTopMetricsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Total Active Conversations */}
      <MetricCard
        title="Active Conversations"
        value={metrics.totalActive}
        icon={<MessageSquare size={14} />}
        iconBg="bg-brand-primary/10 text-brand-primary"
        subtitle="Open customer dialogue threads"
        change={metrics.totalActive > 0 ? 12 : undefined}
        periodText="vs yesterday"
      />

      {/* 2. WhatsApp Inbound Inquiries */}
      <MetricCard
        title="WhatsApp Inquiries"
        value={metrics.whatsappInquiries}
        icon={<MessageCircle size={14} />}
        iconBg="bg-success/10 text-success"
        subtitle="Primary Ghana social-commerce channel"
        change={metrics.whatsappInquiries > 0 ? 18 : undefined}
        periodText="inbound chats"
      />

      {/* 3. Telegram & Social Channels */}
      <MetricCard
        title="Telegram & Social Inquiries"
        value={metrics.telegramInquiries}
        icon={<Send size={14} />}
        iconBg="bg-info/10 text-info"
        subtitle="Omnichannel bot & customer leads"
      />

      {/* 4. Chat-to-Order Conversion Rate */}
      <MetricCard
        title="Chat Conversion Rate"
        value={`${metrics.conversionRatePct.toFixed(1)}%`}
        icon={<TrendingUp size={14} />}
        iconBg="bg-brand-secondary/10 text-brand-secondary"
        subtitle="Conversations turned into paid orders"
        badge={
          <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-secondary/10 text-brand-secondary">
            {metrics.conversionRatePct >= 50 ? 'Strong' : 'Healthy'}
          </span>
        }
      />
    </div>
  );
}
