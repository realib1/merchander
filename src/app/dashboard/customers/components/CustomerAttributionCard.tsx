'use client';

import React from 'react';
import { CustomerAttributionBreakdown, CustomerAttributionSource } from '@/app/actions/customers';
import {
  TrendingUp,
  MessageSquare,
  Share2,
  Globe,
  Layers,
  Sparkles,
  Camera,
  Compass,
} from 'lucide-react';

interface CustomerAttributionCardProps {
  attribution: CustomerAttributionBreakdown;
  currency?: string;
}

function getChannelIcon(source: CustomerAttributionSource) {
  switch (source) {
    case 'instagram':
      return <Camera size={14} className="text-pink-500" />;
    case 'whatsapp':
      return <MessageSquare size={14} className="text-emerald-500" />;
    case 'facebook':
      return <Compass size={14} className="text-blue-500" />;
    case 'referral':
      return <Share2 size={14} className="text-amber-500" />;
    case 'preorder_batch':
      return <Layers size={14} className="text-purple-500" />;
    case 'direct':
    case 'storefront':
    default:
      return <Globe size={14} className="text-indigo-400" />;
  }
}

function getChannelBarColor(source: CustomerAttributionSource) {
  switch (source) {
    case 'instagram':
      return 'bg-pink-500';
    case 'whatsapp':
      return 'bg-emerald-500';
    case 'facebook':
      return 'bg-blue-500';
    case 'referral':
      return 'bg-amber-500';
    case 'preorder_batch':
      return 'bg-purple-500';
    default:
      return 'bg-indigo-500';
  }
}

export function CustomerAttributionCard({
  attribution,
  currency = 'GH₵',
}: CustomerAttributionCardProps) {
  return (
    <div className="p-5 rounded-3xl bg-surface border border-separator shadow-xs space-y-4 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-separator/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary">
            <TrendingUp size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground font-display">
              Customer Acquisition &amp; Attribution
            </h3>
            <p className="text-[11px] text-muted">
              First-touch discovery channels and lifetime GMV contribution
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-surface-elevated border border-separator/60 text-[11px] font-mono font-semibold text-foreground">
          <Sparkles size={12} className="text-amber-400" />
          <span>Top: {attribution.topChannel}</span>
        </div>
      </div>

      {/* Acquisition Channels Progress Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {attribution.channels.map((channel) => {
          const barColor = getChannelBarColor(channel.source);

          return (
            <div
              key={channel.source}
              className="p-3.5 rounded-2xl bg-surface-elevated/70 border border-separator/60 space-y-2.5 hover:border-separator transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-surface border border-separator/40">
                    {getChannelIcon(channel.source)}
                  </div>
                  <span className="text-xs font-bold text-foreground truncate max-w-32.5">
                    {channel.label}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-foreground">
                  {channel.percentage}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-surface rounded-full h-1.5 overflow-hidden border border-separator/30">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${Math.max(channel.percentage, 3)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted font-mono pt-1">
                <span>{channel.customerCount} customers</span>
                <span className="font-semibold text-foreground">
                  {currency} {channel.totalGmv.toLocaleString()} GMV
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
