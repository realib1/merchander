import {
  ConversationChannel,
  ConversationsMetrics,
  ConversationThread,
  QuickReplyTemplate,
} from '@/types/conversations';

export interface RawConversationInput {
  threads: ConversationThread[];
  totalOrdersCount: number;
}

export function computeConversationsMetrics(threads: ConversationThread[]): ConversationsMetrics {
  const totalActive = threads.filter((t) => t.status !== 'resolved').length;
  const whatsappInquiries = threads.filter((t) => t.channel === 'whatsapp').length;
  const telegramInquiries = threads.filter((t) => t.channel === 'telegram').length;

  const convertedCount = threads.filter((t) => t.ordersCount > 0).length;
  const conversionRatePct = threads.length > 0 ? (convertedCount / threads.length) * 100 : 0;

  return {
    totalActive,
    whatsappInquiries,
    telegramInquiries,
    conversionRatePct,
    avgResponseTimeMinutes: 3.5, // 3.5 min benchmark for social-commerce responses
  };
}

export function filterConversationThreads(
  threads: ConversationThread[],
  query: string,
  filter: string
): ConversationThread[] {
  const normalizedQuery = query.toLowerCase().trim();

  return threads.filter((t) => {
    // 1. Channel / Status Filter
    let matchesFilter = true;
    if (filter === 'whatsapp') matchesFilter = t.channel === 'whatsapp';
    else if (filter === 'telegram') matchesFilter = t.channel === 'telegram';
    else if (filter === 'instagram') matchesFilter = t.channel === 'instagram';
    else if (filter === 'unread') matchesFilter = t.unreadCount > 0;
    else if (filter === 'orders') matchesFilter = Boolean(t.linkedOrderId || t.ordersCount > 0);
    else if (filter === 'bot') matchesFilter = t.status === 'bot_handling';

    if (!matchesFilter) return false;

    // 2. Search query
    if (!normalizedQuery) return true;

    return (
      t.customerName.toLowerCase().includes(normalizedQuery) ||
      t.customerPhone.toLowerCase().includes(normalizedQuery) ||
      t.lastMessage.toLowerCase().includes(normalizedQuery) ||
      (t.detectedIntent && t.detectedIntent.toLowerCase().includes(normalizedQuery))
    );
  });
}

export function getDefaultQuickReplies(storeName = 'Our Store'): QuickReplyTemplate[] {
  return [
    {
      id: 'qr-1',
      title: '📦 Send Product Catalog',
      text: `Hello from ${storeName}! You can browse our full live collection, check available sizes, and place your order directly on our storefront link here: https://merchander.app/store`,
      category: 'catalog',
    },
    {
      id: 'qr-2',
      title: '📱 Request MoMo Reference',
      text: `Thank you for your order! Please send payment to our official merchant MoMo line and reply with your transaction ID / screenshot so we can dispatch immediately.`,
      category: 'payment',
    },
    {
      id: 'qr-3',
      title: '🚚 Accra Delivery Rates',
      text: `Delivery within Greater Accra is GHS 25 - GHS 35 depending on location (same-day delivery via dispatched riders). Deliveries outside Accra are sent via VIP / OA bus parcel.`,
      category: 'delivery',
    },
    {
      id: 'qr-4',
      title: '🕒 Operating Hours',
      text: `Hello from ${storeName}! Our customer service team is active Monday to Saturday from 8:00 AM to 8:00 PM. Our automated assistant can capture your order anytime!`,
      category: 'greeting',
    },
  ];
}

export function getChannelBadgeDetails(channel: ConversationChannel): { label: string; bg: string; text: string } {
  switch (channel) {
    case 'whatsapp':
      return { label: 'WhatsApp', bg: 'bg-success/15', text: 'text-success' };
    case 'telegram':
      return { label: 'Telegram', bg: 'bg-info/15', text: 'text-info' };
    case 'instagram':
      return { label: 'Instagram', bg: 'bg-brand-primary/15', text: 'text-brand-primary' };
    case 'tiktok':
      return { label: 'TikTok (Soon)', bg: 'bg-muted/15', text: 'text-muted' };
    case 'facebook':
      return { label: 'Facebook (Soon)', bg: 'bg-muted/15', text: 'text-muted' };
    default:
      return { label: 'Chat', bg: 'bg-surface-elevated', text: 'text-foreground' };
  }
}
