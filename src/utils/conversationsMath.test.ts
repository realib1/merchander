import { describe, it, expect } from 'vitest';
import {
  computeConversationsMetrics,
  filterConversationThreads,
  getDefaultQuickReplies,
  getChannelBadgeDetails,
} from './conversationsMath';
import type { ConversationThread } from '@/types/conversations';

function thread(overrides: Partial<ConversationThread> = {}): ConversationThread {
  return {
    id: 't1',
    tenantId: 'tenant1',
    customerId: 'cust1',
    customerName: 'Kofi Mensah',
    customerPhone: '+233241234567',
    channel: 'whatsapp',
    status: 'open',
    lastMessage: 'Is the blue one in stock?',
    lastMessageAt: '2026-02-01T10:00:00.000Z',
    unreadCount: 0,
    detectedIntent: 'Inquiring stock',
    linkedOrderId: null,
    totalSpent: 0,
    ordersCount: 0,
    ...overrides,
  };
}

describe('computeConversationsMetrics', () => {
  it('counts active threads as everything not resolved', () => {
    const threads = [
      thread({ id: 'a', status: 'open' }),
      thread({ id: 'b', status: 'bot_handling' }),
      thread({ id: 'c', status: 'resolved' }),
    ];
    expect(computeConversationsMetrics(threads).totalActive).toBe(2);
  });

  it('counts inquiries per channel', () => {
    const threads = [
      thread({ id: 'a', channel: 'whatsapp' }),
      thread({ id: 'b', channel: 'whatsapp' }),
      thread({ id: 'c', channel: 'telegram' }),
      thread({ id: 'd', channel: 'instagram' }),
    ];
    const m = computeConversationsMetrics(threads);
    expect(m.whatsappInquiries).toBe(2);
    expect(m.telegramInquiries).toBe(1);
  });

  it('derives conversion rate from threads with at least one order', () => {
    const threads = [
      thread({ id: 'a', ordersCount: 2 }),
      thread({ id: 'b', ordersCount: 0 }),
      thread({ id: 'c', ordersCount: 0 }),
      thread({ id: 'd', ordersCount: 1 }),
    ];
    expect(computeConversationsMetrics(threads).conversionRatePct).toBe(50);
  });

  it('guards against an empty thread list', () => {
    expect(computeConversationsMetrics([]).conversionRatePct).toBe(0);
    expect(computeConversationsMetrics([]).totalActive).toBe(0);
    expect(computeConversationsMetrics([]).avgResponseTimeMinutes).toBe(0);
  });

  it('calculates dynamic avgResponseTimeMinutes accurately from valid durations', () => {
    const threads = [thread({ id: 'a' })];
    const metrics = computeConversationsMetrics(threads, [2.5, 4.0, 5.5]);
    // (2.5 + 4.0 + 5.5) / 3 = 12 / 3 = 4.0
    expect(metrics.avgResponseTimeMinutes).toBe(4);
  });

  it('filters out invalid or negative durations and rounds to 1 decimal place', () => {
    const threads = [thread({ id: 'a' })];
    const metrics = computeConversationsMetrics(threads, [1.25, 3.42, -5, NaN]);
    // (1.25 + 3.42) / 2 = 2.335 -> 2.3
    expect(metrics.avgResponseTimeMinutes).toBe(2.3);
  });
});

describe('filterConversationThreads', () => {
  const threads = [
    thread({ id: 'wa', channel: 'whatsapp', customerName: 'Adjoa', unreadCount: 3 }),
    thread({ id: 'tg', channel: 'telegram', customerName: 'Bright', lastMessage: 'Payment sent' }),
    thread({ id: 'ig', channel: 'instagram', customerName: 'Comfort', detectedIntent: 'Delivery status' }),
    thread({ id: 'bot', channel: 'whatsapp', status: 'bot_handling', customerName: 'Doris' }),
    thread({ id: 'ord', channel: 'whatsapp', customerName: 'Esi', linkedOrderId: 'o-1' }),
  ];

  it('filters by channel', () => {
    expect(filterConversationThreads(threads, '', 'telegram').map((t) => t.id)).toEqual(['tg']);
    expect(filterConversationThreads(threads, '', 'instagram').map((t) => t.id)).toEqual(['ig']);
  });

  it('filters unread, bot-handled, and order-linked threads', () => {
    expect(filterConversationThreads(threads, '', 'unread').map((t) => t.id)).toEqual(['wa']);
    expect(filterConversationThreads(threads, '', 'bot').map((t) => t.id)).toEqual(['bot']);
    expect(filterConversationThreads(threads, '', 'orders').map((t) => t.id)).toEqual(['ord']);
  });

  it('treats an unknown filter as "all"', () => {
    expect(filterConversationThreads(threads, '', 'all')).toHaveLength(threads.length);
  });

  it('searches name, phone, last message and intent case-insensitively', () => {
    expect(filterConversationThreads(threads, 'ADJOA', 'all').map((t) => t.id)).toEqual(['wa']);
    expect(filterConversationThreads(threads, 'payment', 'all').map((t) => t.id)).toEqual(['tg']);
    expect(filterConversationThreads(threads, 'delivery status', 'all').map((t) => t.id)).toEqual(['ig']);
  });

  it('combines a channel filter with a query', () => {
    expect(filterConversationThreads(threads, 'esi', 'whatsapp').map((t) => t.id)).toEqual(['ord']);
    expect(filterConversationThreads(threads, 'bright', 'whatsapp')).toEqual([]);
  });
});

describe('getDefaultQuickReplies', () => {
  it('returns four templates and interpolates the store name', () => {
    const replies = getDefaultQuickReplies('Kente Corner');
    expect(replies).toHaveLength(4);
    expect(replies.some((r) => r.text.includes('Kente Corner'))).toBe(true);
    expect(new Set(replies.map((r) => r.id)).size).toBe(4);
  });

  it('falls back to a default store name', () => {
    expect(getDefaultQuickReplies().some((r) => r.text.includes('Our Store'))).toBe(true);
  });
});

describe('getChannelBadgeDetails', () => {
  it('maps each known channel to a label', () => {
    expect(getChannelBadgeDetails('whatsapp').label).toBe('WhatsApp');
    expect(getChannelBadgeDetails('telegram').label).toBe('Telegram');
    expect(getChannelBadgeDetails('instagram').label).toBe('Instagram');
    expect(getChannelBadgeDetails('tiktok').label).toContain('TikTok');
    expect(getChannelBadgeDetails('facebook').label).toContain('Facebook');
  });

  it('falls back to a generic Chat badge for anything else', () => {
    expect(getChannelBadgeDetails('carrier_pigeon' as never).label).toBe('Chat');
  });
});
