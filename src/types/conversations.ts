export type ConversationChannel = 'whatsapp' | 'telegram' | 'instagram' | 'tiktok' | 'facebook';

export type ConversationStatus = 'open' | 'bot_handling' | 'waiting_customer' | 'resolved';

export interface ChatMessage {
  id: string;
  threadId: string;
  senderType: 'customer' | 'agent' | 'bot';
  senderName: string;
  text: string;
  createdAt: string;
  status: 'sent' | 'delivered' | 'read';
  suggestedAction?: string;
  intentBadge?: string;
}

export interface ConversationThread {
  id: string;
  tenantId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  channel: ConversationChannel;
  status: ConversationStatus;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  assignedStaff?: string | null;
  detectedIntent?: string | null; // e.g. 'Inquiring stock', 'Payment verification', 'Delivery status'
  linkedOrderId?: string | null;
  totalSpent: number;
  ordersCount: number;
}

export interface QuickReplyTemplate {
  id: string;
  title: string;
  text: string;
  category: 'catalog' | 'payment' | 'delivery' | 'greeting' | 'support';
}

export interface ConversationsMetrics {
  totalActive: number;
  whatsappInquiries: number;
  telegramInquiries: number;
  conversionRatePct: number;
  avgResponseTimeMinutes: number;
}

export interface ConversationsData {
  metrics: ConversationsMetrics;
  threads: ConversationThread[];
  quickReplies: QuickReplyTemplate[];
}
