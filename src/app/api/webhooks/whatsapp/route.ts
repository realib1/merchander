import { NextRequest, NextResponse } from 'next/server';
import { normalizeGhanaPhone } from '@/utils/phone';
import { NormalizedMessage } from '@/types/messaging';
import { extractCartFromChat } from '@/lib/intelligence/extract';

// Verification token for WhatsApp Cloud API
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'merchander_verify_token';

/**
 * Handles Webhook Verification from Meta
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Invalid verification token' }, { status: 403 });
}

/**
 * Handles incoming WhatsApp messages
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

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
          timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString()
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
