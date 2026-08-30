'use client';

import React, { useState } from 'react';
import { ChatMessage, ConversationThread, QuickReplyTemplate } from '@/types/conversations';
import { sendChatMessage } from '@/app/actions/conversations';
import { getChannelBadgeDetails } from '@/utils/conversationsMath';
import { Send, Sparkles, Bot, User, CheckCheck, Check, ShoppingBag, ExternalLink } from 'lucide-react';

interface ChatStreamViewProps {
  thread: ConversationThread | null;
  quickReplies: QuickReplyTemplate[];
  onCreateOrder: (customerId: string) => void;
}

export function ChatStreamView({ thread, quickReplies, onCreateOrder }: ChatStreamViewProps) {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (!thread) return [];
    return [
      {
        id: 'msg-1',
        threadId: thread.id,
        senderType: 'customer',
        senderName: thread.customerName,
        text: thread.lastMessage,
        createdAt: thread.lastMessageAt,
        status: 'read',
      },
      {
        id: 'msg-2',
        threadId: thread.id,
        senderType: 'bot',
        senderName: 'Merchander Bot',
        text: 'Automated Response: Hello! Thank you for contacting us. Our team has received your message.',
        createdAt: new Date().toISOString(),
        status: 'delivered',
      },
    ];
  });

  if (!thread) {
    return (
      <div className="flex-1 bg-surface border border-separator rounded-2xl p-12 flex flex-col items-center justify-center text-center text-muted shadow-xs h-170">
        <Bot size={44} className="opacity-25 mb-3 text-brand-primary" />
        <h3 className="text-sm font-bold text-foreground">Select a conversation</h3>
        <p className="text-xs text-muted max-w-xs mt-1">
          Choose a WhatsApp, Telegram, or Instagram thread from the left to view customer messages and order context.
        </p>
      </div>
    );
  }

  const channelBadge = getChannelBadgeDetails(thread.channel);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      threadId: thread.id,
      senderType: 'agent',
      senderName: 'You',
      text: inputText,
      createdAt: new Date().toISOString(),
      status: 'sent',
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    await sendChatMessage(thread.id, inputText, 'agent');
  };

  const handleApplyQuickReply = (qrText: string) => {
    setInputText(qrText);
  };

  return (
    <div className="flex-1 flex flex-col bg-surface border border-separator rounded-2xl overflow-hidden shadow-xs h-170">
      {/* 1. Chat Header */}
      <div className="p-4 border-b border-separator flex items-center justify-between bg-surface-elevated/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-sm shrink-0">
            {thread.customerName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-foreground">{thread.customerName}</h2>
              <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-bold ${channelBadge.bg} ${channelBadge.text}`}>
                {channelBadge.label}
              </span>
            </div>
            <p className="text-[11px] text-muted font-mono">{thread.customerPhone}</p>
          </div>
        </div>

        {/* Quick Actions Header */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onCreateOrder(thread.customerId)}
            className="px-3 py-1.5 rounded-xl bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary/90 cursor-pointer transition flex items-center gap-1.5 shadow-xs"
          >
            <ShoppingBag size={13} />
            <span>Create Order</span>
          </button>
        </div>
      </div>

      {/* 2. Bot Intelligence & Intent Card */}
      {thread.detectedIntent && (
        <div className="px-4 py-2.5 bg-brand-secondary/5 border-b border-brand-secondary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-brand-secondary shrink-0" />
            <div className="text-xs">
              <span className="text-muted font-medium">Customer Intent: </span>
              <span className="font-semibold text-foreground">{thread.detectedIntent}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                handleApplyQuickReply('Hello! Here is our product catalog link: https://merchander.app/store')
              }
              className="px-2 py-1 rounded-lg bg-surface border border-separator text-[11px] font-semibold text-foreground hover:bg-surface-elevated transition cursor-pointer flex items-center gap-1"
            >
              <span>Send Catalog</span>
              <ExternalLink size={10} className="text-muted" />
            </button>
            <button
              type="button"
              onClick={() =>
                handleApplyQuickReply('Please send payment to our MoMo merchant line and reply with transaction ID.')
              }
              className="px-2 py-1 rounded-lg bg-surface border border-separator text-[11px] font-semibold text-brand-primary hover:bg-surface-elevated transition cursor-pointer"
            >
              Request MoMo ID
            </button>
          </div>
        </div>
      )}

      {/* 3. Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar bg-background/50">
        {messages.map((m) => {
          const isCustomer = m.senderType === 'customer';
          const isBot = m.senderType === 'bot';

          if (isBot) {
            return (
              <div key={m.id} className="flex justify-center my-2">
                <div className="px-3 py-1.5 rounded-xl bg-surface border border-separator text-[11px] text-muted flex items-center gap-1.5 max-w-md text-center">
                  <Bot size={13} className="text-brand-primary shrink-0" />
                  <span>{m.text}</span>
                </div>
              </div>
            );
          }

          return (
            <div key={m.id} className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}>
              <div className="flex items-center gap-1 mb-1 text-[10px] text-muted">
                {isCustomer ? <User size={10} /> : null}
                <span>{m.senderName}</span>
                <span>•</span>
                <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              <div
                className={`px-4 py-2.5 rounded-2xl max-w-sm sm:max-w-md text-xs leading-relaxed ${
                  isCustomer
                    ? 'bg-surface border border-separator text-foreground rounded-tl-xs shadow-xs'
                    : 'bg-brand-primary text-white rounded-tr-xs shadow-xs'
                }`}
              >
                <p>{m.text}</p>
              </div>

              {!isCustomer && (
                <div className="flex items-center gap-1 text-[10px] text-muted mt-0.5">
                  {m.status === 'read' ? <CheckCheck size={12} className="text-info" /> : <Check size={12} />}
                  <span>{m.status}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 4. Quick Replies Bar */}
      <div className="p-2 border-t border-separator bg-surface-elevated/40 flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
        <span className="text-[10px] font-bold text-muted uppercase tracking-wider px-1 shrink-0">Quick Replies:</span>
        {quickReplies.map((qr) => (
          <button
            key={qr.id}
            type="button"
            onClick={() => handleApplyQuickReply(qr.text)}
            className="px-2.5 py-1 rounded-lg bg-surface border border-separator text-[11px] font-semibold text-muted hover:text-foreground whitespace-nowrap cursor-pointer transition shrink-0"
          >
            {qr.title}
          </button>
        ))}
      </div>

      {/* 5. Message Input Composer */}
      <form onSubmit={handleSend} className="p-3 border-t border-separator bg-surface flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Reply to ${thread.customerName} on ${channelBadge.label}...`}
          className="flex-1 bg-surface-elevated border border-separator rounded-xl px-4 py-2 text-xs placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary transition"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary/90 disabled:opacity-40 cursor-pointer transition flex items-center gap-1.5 shadow-xs shrink-0"
        >
          <Send size={13} />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}
