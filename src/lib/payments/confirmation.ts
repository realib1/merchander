import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { normalizeGhanaPhone } from '@/utils/phone';
import { formatPaymentReceiptMessage } from '@/utils/paymentLinks';
import { resolveChannelIdentity } from '@/lib/channels/identity';
import { sendOutboundWhatsAppMessage } from '@/lib/channels/whatsapp/service';

export interface DispatchPaymentConfirmationParams {
  supabase: SupabaseClient<Database>;
  tenantId: string;
  orderId: string;
  amount: number;
  provider: string;
  transactionRef: string;
  customerPhone?: string | null;
  customerName?: string | null;
}

export interface DispatchReceiptResult {
  sent: boolean;
  messageId?: string;
  reason?: string;
  error?: string;
}

/**
 * Dispatches an automated WhatsApp payment confirmation receipt to the customer
 * upon successful payment settlement.
 */
export async function dispatchPaymentConfirmationReceipt(
  params: DispatchPaymentConfirmationParams
): Promise<DispatchReceiptResult> {
  const { supabase, tenantId, orderId, amount, provider, transactionRef } = params;

  try {
    // 1. Fetch order details to resolve customer and short_id
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, short_id, customer_id, customer:customers(id, name, phone)')
      .eq('id', orderId)
      .maybeSingle();

    if (orderErr) {
      console.warn('[Payment Confirmation] Error querying order for receipt dispatch:', orderErr);
    }

    // Resolve customer details from params or linked customer relation
    const rawCustomer = order?.customer as unknown as { id?: string; name?: string | null; phone?: string | null } | null;
    const rawPhone = params.customerPhone || rawCustomer?.phone;
    const customerName = params.customerName || rawCustomer?.name || 'Valued Customer';
    const orderNumber = order?.short_id || orderId.slice(0, 8).toUpperCase();

    if (!rawPhone) {
      console.log(`[Payment Confirmation] No phone number found for order ${orderId}; skipping receipt dispatch.`);
      return { sent: false, reason: 'no_phone' };
    }

    const cleanPhone = normalizeGhanaPhone(rawPhone);
    if (!cleanPhone) {
      console.log(`[Payment Confirmation] Invalid phone number (${rawPhone}) for order ${orderId}; skipping receipt dispatch.`);
      return { sent: false, reason: 'invalid_phone' };
    }

    // 2. Resolve omnichannel WhatsApp channel identity
    const identity = await resolveChannelIdentity(
      supabase,
      tenantId,
      'whatsapp',
      cleanPhone,
      customerName
    );

    // 3. Resolve storefront slug for tracking URL
    let storeSlug = `store-${tenantId.slice(0, 8)}`;
    try {
      const { data: sfData } = await supabase
        .from('storefront_settings')
        .select('slug')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (sfData?.slug) {
        storeSlug = sfData.slug;
      }
    } catch {
      // Fall back to default storeSlug
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/+$/, '');
    const trackingUrl = appUrl ? `${appUrl}/store/${storeSlug}/orders/${orderNumber}` : undefined;

    // 4. Format payment confirmation receipt message
    const receiptText = formatPaymentReceiptMessage({
      customerName,
      orderNumber,
      amountPaid: amount,
      currency: 'GHS',
      provider,
      transactionRef,
      trackingUrl,
    });

    // 5. Dispatch outbound message via WhatsApp
    const sendRes = await sendOutboundWhatsAppMessage({
      supabase,
      tenantId,
      channelIdentityId: identity.id,
      to: cleanPhone,
      messageType: 'text',
      text: receiptText,
      metadata: {
        action_type: 'payment_confirmation',
        order_id: orderId,
        order_number: orderNumber,
        transaction_ref: transactionRef,
        amount,
        provider,
      },
    });

    return {
      sent: true,
      messageId: sendRes?.messages?.[0]?.id || undefined,
    };
  } catch (err) {
    console.warn('[Payment Confirmation] WhatsApp receipt dispatch failed:', err);
    return {
      sent: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
