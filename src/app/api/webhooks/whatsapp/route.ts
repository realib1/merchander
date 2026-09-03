import { NextRequest, NextResponse } from 'next/server';
import { normalizeGhanaPhone } from '@/utils/phone';
import { NormalizedMessage } from '@/types/messaging';
import { extractCartFromChat } from '@/lib/intelligence/extract';
import { verifyMetaSignature } from '@/utils/webhook-signature';

/**
 * Handles webhook verification from Meta. Requires WHATSAPP_VERIFY_TOKEN to be
 * configured; there is no fallback value.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  if (!verifyToken) {
    console.error('WhatsApp webhook: WHATSAPP_VERIFY_TOKEN is not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 403 });
  }

  if (mode === 'subscribe' && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Invalid verification token' }, { status: 403 });
}

/**
 * Handles incoming WhatsApp messages
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    if (!verifyMetaSignature(rawBody, request.headers.get('x-hub-signature-256'), process.env.WHATSAPP_APP_SECRET)) {
      console.warn('WhatsApp webhook signature verification failed');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const body = JSON.parse(rawBody);

    // 1. Validate WhatsApp Cloud API structure
    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const message = value?.messages?.[0];
      const contact = value?.contacts?.[0];

      if (message && message.type === 'text') {
        const rawPhone = contact?.wa_id || message.from;

        // 2. Normalize Phone Number
        const senderId = normalizeGhanaPhone(rawPhone) || `+${rawPhone}`;

        // 3. Convert to Merchander NormalizedMessage
        const normalizedMsg: NormalizedMessage = {
          platform: 'whatsapp',
          external_id: message.id,
          sender_id: senderId,
          text: message.text.body,
          timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
        };

        // 4. Pass to the Intelligence Brain Interface
        const extractedCart = await extractCartFromChat(normalizedMsg);

        // 5. TODO: Trigger order state machine (Ticket 4)
        console.log('[WhatsApp Webhook] Extracted cart:', extractedCart);
      }
    }

    // Always return 200 OK immediately to acknowledge receipt to Meta
    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
