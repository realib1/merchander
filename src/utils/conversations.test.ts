import { describe, it, expect } from 'vitest';
import { computeConversationsMetrics, filterConversationThreads, getDefaultQuickReplies } from './conversationsMath';
import { ConversationThread } from '@/types/conversations';

describe('Conversations Engine Tests', () => {
  const mockThreads: ConversationThread[] = [
    {
      id: 't-1',
      tenantId: 'tenant-1',
      customerId: 'c-1',
      customerName: 'Ama Serwaa',
      customerPhone: '+233241234567',
      channel: 'whatsapp',
      status: 'open',
      lastMessage: 'Do you have the 24 inch bone straight in stock?',
      lastMessageAt: new Date().toISOString(),
      unreadCount: 2,
      detectedIntent: 'Inquiring stock availability',
      totalSpent: 1200,
      ordersCount: 3,
    },
    {
      id: 't-2',
      tenantId: 'tenant-1',
      customerId: 'c-2',
      customerName: 'Kwame Mensah',
      customerPhone: '+233559876543',
      channel: 'telegram',
      status: 'bot_handling',
      lastMessage: 'I sent the MoMo payment of 350 GHS',
      lastMessageAt: new Date().toISOString(),
      unreadCount: 0,
      detectedIntent: 'Payment verification',
      totalSpent: 350,
      ordersCount: 1,
    },
    {
      id: 't-3',
      tenantId: 'tenant-1',
      customerId: 'c-3',
      customerName: 'Esi Osei',
      customerPhone: '+233201112233',
      channel: 'instagram',
      status: 'resolved',
      lastMessage: 'Thank you! The delivery rider arrived.',
      lastMessageAt: new Date().toISOString(),
      unreadCount: 0,
      detectedIntent: 'Delivery confirmation',
      totalSpent: 0,
      ordersCount: 0,
    },
  ];

  it('computes metrics accurately across channels', () => {
    const metrics = computeConversationsMetrics(mockThreads);
    expect(metrics.totalActive).toBe(2); // t-1 and t-2 are active (not resolved)
    expect(metrics.whatsappInquiries).toBe(1);
    expect(metrics.telegramInquiries).toBe(1);
    expect(metrics.conversionRatePct).toBeCloseTo((2 / 3) * 100);
  });

  it('filters threads by channel and query', () => {
    // WhatsApp only
    const waOnly = filterConversationThreads(mockThreads, '', 'whatsapp');
    expect(waOnly.length).toBe(1);
    expect(waOnly[0].customerName).toBe('Ama Serwaa');

    // Telegram only
    const tgOnly = filterConversationThreads(mockThreads, '', 'telegram');
    expect(tgOnly.length).toBe(1);
    expect(tgOnly[0].customerName).toBe('Kwame Mensah');

    // Search by product keyword in message
    const searchRes = filterConversationThreads(mockThreads, 'bone straight', 'all');
    expect(searchRes.length).toBe(1);
    expect(searchRes[0].customerName).toBe('Ama Serwaa');

    // Search by intent
    const intentRes = filterConversationThreads(mockThreads, 'Payment', 'all');
    expect(intentRes.length).toBe(1);
    expect(intentRes[0].customerName).toBe('Kwame Mensah');
  });

  it('generates standard Ghana commerce quick replies', () => {
    const replies = getDefaultQuickReplies('Glam Hair');
    expect(replies.length).toBeGreaterThan(0);
    expect(replies.some((r) => r.text.includes('MoMo'))).toBe(true);
    expect(replies.some((r) => r.text.includes('Accra'))).toBe(true);
  });
});
