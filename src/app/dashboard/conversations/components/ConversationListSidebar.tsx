'use client';

import React, { useState } from 'react';
import { ConversationThread } from '@/types/conversations';
import { filterConversationThreads, getChannelBadgeDetails } from '@/utils/conversationsMath';
import { Search, MessageSquare, MessageCircle, Send, Bot, ShoppingBag } from 'lucide-react';

interface ConversationListSidebarProps {
  threads: ConversationThread[];
  selectedThreadId: string | null;
  onSelectThread: (thread: ConversationThread) => void;
}

export function ConversationListSidebar({ threads, selectedThreadId, onSelectThread }: ConversationListSidebarProps) {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredThreads = filterConversationThreads(threads, searchQuery, activeFilter);

  return (
    <div className="w-full lg:w-80 xl:w-96 flex flex-col bg-surface border border-separator rounded-2xl overflow-hidden shadow-xs shrink-0 h-170">
      {/* Header & Search */}
      <div className="p-4 border-b border-separator space-y-3 bg-surface-elevated/30">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare size={14} className="text-brand-primary" /> Inbox Threads ({threads.length})
          </h2>
          <span className="text-[11px] text-muted font-medium">Real-time sync</span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search name, phone, or intent..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-separator rounded-xl pl-7 pr-3 py-1.5 text-xs placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition ${
              activeFilter === 'all'
                ? 'bg-brand-primary text-white shadow-xs'
                : 'bg-surface border border-separator text-muted hover:text-foreground'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('whatsapp')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition flex items-center gap-1 ${
              activeFilter === 'whatsapp'
                ? 'bg-success text-white shadow-xs'
                : 'bg-surface border border-separator text-muted hover:text-foreground'
            }`}
          >
            <MessageCircle size={11} /> WhatsApp
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('telegram')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition flex items-center gap-1 ${
              activeFilter === 'telegram'
                ? 'bg-info text-white shadow-xs'
                : 'bg-surface border border-separator text-muted hover:text-foreground'
            }`}
          >
            <Send size={11} /> Telegram
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('orders')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition flex items-center gap-1 ${
              activeFilter === 'orders'
                ? 'bg-brand-secondary text-white shadow-xs'
                : 'bg-surface border border-separator text-muted hover:text-foreground'
            }`}
          >
            <ShoppingBag size={11} /> Orders
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('unread')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition ${
              activeFilter === 'unread'
                ? 'bg-destructive text-white shadow-xs'
                : 'bg-surface border border-separator text-muted hover:text-foreground'
            }`}
          >
            Unread
          </button>
          <button
            type="button"
            disabled
            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap bg-surface-elevated text-muted/60 border border-separator/40 cursor-not-allowed"
          >
            TikTok (Soon)
          </button>
        </div>
      </div>

      {/* Threads List */}
      <div className="flex-1 overflow-y-auto divide-y divide-separator/40 custom-scrollbar">
        {filteredThreads.length === 0 ? (
          <div className="p-8 text-center text-muted space-y-1">
            <MessageSquare size={28} className="mx-auto opacity-30" />
            <p className="text-xs font-medium">No conversations found</p>
          </div>
        ) : (
          filteredThreads.map((t) => {
            const isSelected = t.id === selectedThreadId;
            const channelBadge = getChannelBadgeDetails(t.channel);

            return (
              <div
                key={t.id}
                onClick={() => onSelectThread(t)}
                className={`p-3.5 cursor-pointer transition-colors text-left flex flex-col justify-between gap-1.5 ${
                  isSelected ? 'bg-brand-primary/10 border-l-4 border-l-brand-primary' : 'hover:bg-surface-elevated/50'
                }`}
              >
                {/* Top Row: Customer Name & Timestamp */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs font-bold text-foreground truncate max-w-35 sm:max-w-40">
                      {t.customerName}
                    </span>
                    {t.status === 'bot_handling' && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-brand-primary/15 text-brand-primary text-[9px] font-bold shrink-0">
                        <Bot size={9} /> Bot
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted shrink-0 font-mono">
                    {new Date(t.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Middle Row: Message snippet */}
                <p className="text-xs text-muted line-clamp-1 leading-snug">{t.lastMessage}</p>

                {/* Bottom Row: Badges (Channel, Intent, Unread) */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-1.5 py-0.2 rounded-md text-[9px] font-bold ${channelBadge.bg} ${channelBadge.text}`}
                    >
                      {channelBadge.label}
                    </span>

                    {t.detectedIntent && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] text-muted font-medium bg-surface-elevated px-1.5 py-0.2 rounded-md border border-separator/50 truncate max-w-30">
                        <Bot size={8} className="text-brand-secondary shrink-0" />
                        <span className="truncate">{t.detectedIntent}</span>
                      </span>
                    )}
                  </div>

                  {t.unreadCount > 0 && (
                    <span className="h-4 min-w-4 px-1 rounded-full bg-brand-primary text-white text-[9px] font-bold flex items-center justify-center">
                      {t.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
