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
        avgResponseTimeMinutes: 0,
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
        .limit(50),
      supabase
        .from('orders')
        .select('id, customer_id, total_amount, status, sales_channel, created_at')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false }),
      supabase.from('tenants').select('name').eq('id', tenantId).single(),
    ]);

    const customers = customersRes.data || [];
    const orders = ordersRes.data || [];
    const storeName = tenantRes.data?.name || 'Our Store';

    const threads: ConversationThread[] = customers.map((c) => {
      const custOrders = orders.filter((o) => o.customer_id === c.id);
      const totalSpent = custOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
      const latestOrder = custOrders[0];

      const channelRaw = (latestOrder?.sales_channel as string)?.toLowerCase() || 'whatsapp';
      const channel: 'whatsapp' | 'telegram' | 'instagram' =
        channelRaw === 'telegram' ? 'telegram' : channelRaw === 'instagram' ? 'instagram' : 'whatsapp';

      let lastMessage = 'Customer started conversation';
      let detectedIntent = 'General inquiry';

      if (latestOrder) {
        if (latestOrder.status === 'pending') {
          lastMessage = `Awaiting payment confirmation for order #${latestOrder.id.slice(0, 8)}`;
          detectedIntent = 'Payment pending';
        } else if (latestOrder.status === 'confirmed' || latestOrder.status === 'processing') {
          lastMessage = `Order #${latestOrder.id.slice(0, 8)} in preparation`;
          detectedIntent = 'Order fulfillment';
        } else if (latestOrder.status === 'delivered') {
          lastMessage = `Order #${latestOrder.id.slice(0, 8)} delivered successfully`;
          detectedIntent = 'Delivery completed';
        } else {
          lastMessage = `Order #${latestOrder.id.slice(0, 8)} (${latestOrder.status})`;
          detectedIntent = 'Order inquiry';
        }
      }

      return {
        id: `thread-${c.id}`,
        tenantId,
        customerId: c.id,
        customerName: c.name || 'Customer',
        customerPhone: c.phone,
        channel,
        status: 'open',
        lastMessage,
        lastMessageAt: latestOrder?.created_at || c.created_at,
        unreadCount: 0,
        detectedIntent,
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
        avgResponseTimeMinutes: 0,
      },
      threads: [],
      quickReplies: getDefaultQuickReplies(),
    };
  }
}

export async function sendChatMessage(threadId: string, text: string, senderType: 'agent' | 'bot' = 'agent') {
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
