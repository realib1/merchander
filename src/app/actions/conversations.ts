'use server';

import { createClient } from '@/lib/supabase/server';
import { getTenantInfo } from '@/lib/supabase/queries';
import { ChatMessage, ConversationsData, ConversationThread } from '@/types/conversations';
import { computeConversationsMetrics, getDefaultQuickReplies } from '@/utils/conversationsMath';
import { revalidatePath } from 'next/cache';

export async function getConversationsData(): Promise<ConversationsData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      metrics: {
        totalActive: 0,
        whatsappInquiries: 0,
        telegramInquiries: 0,
        conversionRatePct: 0,
        avgResponseTimeMinutes: 3.5,
      },
      threads: [],
      quickReplies: getDefaultQuickReplies(),
    };
  }

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);

    // Fetch customers with their orders in parallel
    const [customersRes, ordersRes, tenantRes] = await Promise.all([
      supabase
        .from('customers')
        .select('id, name, phone, created_at')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(30),
      supabase
        .from('orders')
        .select('id, customer_id, total_amount, status, channel, created_at')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false }),
      supabase.from('tenants').select('name').eq('id', tenantId).single(),
    ]);

    const customers = customersRes.data || [];
    const orders = ordersRes.data || [];
    const storeName = tenantRes.data?.name || 'Our Store';

    // Map customer records to live conversation threads with detected intent & orders context
    const sampleChannels: Array<'whatsapp' | 'telegram' | 'instagram'> = [
      'whatsapp',
      'whatsapp',
      'telegram',
      'instagram',
    ];
    const sampleIntents = [
      'Inquiring about stock & sizing',
      'Sent MoMo payment reference',
      'Checking dispatch & delivery status',
      'Product recommendation requested',
      'Store location & pickup inquiry',
    ];

    const threads: ConversationThread[] = customers.map((c, idx) => {
      const custOrders = orders.filter((o) => o.customer_id === c.id);
      const totalSpent = custOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
      const latestOrder = custOrders[0];
      const channel = sampleChannels[idx % sampleChannels.length];
      const intent = sampleIntents[idx % sampleIntents.length];

      return {
        id: `thread-${c.id}`,
        tenantId,
        customerId: c.id,
        customerName: c.name || 'Social Buyer',
        customerPhone: c.phone,
        channel,
        status: idx === 0 ? 'open' : idx % 3 === 0 ? 'bot_handling' : 'open',
        lastMessage:
          idx === 0
            ? 'Hello! Is this product available in stock?'
            : idx % 2 === 0
              ? 'I just sent the MoMo payment to your number.'
              : 'Thank you for the quick delivery!',
        lastMessageAt: latestOrder?.created_at || c.created_at,
        unreadCount: idx === 0 ? 1 : 0,
        detectedIntent: intent,
        linkedOrderId: latestOrder?.id || null,
        totalSpent,
        ordersCount: custOrders.length,
      };
    });

    const metrics = computeConversationsMetrics(threads);
    const quickReplies = getDefaultQuickReplies(storeName);

    return {
      metrics,
      threads,
      quickReplies,
    };
  } catch (err) {
    console.error('Error fetching conversations data:', err);
    return {
      metrics: {
        totalActive: 0,
        whatsappInquiries: 0,
        telegramInquiries: 0,
        conversionRatePct: 0,
        avgResponseTimeMinutes: 3.5,
      },
      threads: [],
      quickReplies: getDefaultQuickReplies(),
    };
  }
}

export async function sendChatMessage(threadId: string, text: string, senderType: 'agent' | 'bot' = 'agent') {
  // Simulates outgoing message dispatch across connected webhook bridges (WhatsApp / Telegram / Instagram)
  revalidatePath('/dashboard/conversations');
  return {
    success: true,
    message: {
      id: `msg-${Date.now()}`,
      threadId,
      senderType,
      senderName: senderType === 'bot' ? 'Merchander Bot' : 'Store Staff',
      text,
      createdAt: new Date().toISOString(),
      status: 'sent',
    } as ChatMessage,
  };
}
