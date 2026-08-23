import { NextRequest, NextResponse } from 'next/server';
import { NormalizedMessage } from '@/types/messaging';
import { extractCartFromChat } from '@/lib/intelligence/extract';

// Secret token configured in Telegram webhook setup
const TELEGRAM_SECRET_TOKEN = process.env.TELEGRAM_SECRET_TOKEN || 'merchander_telegram_token';

/**
 * Handles incoming Telegram messages
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validate Telegram Secret Token
    const secretToken = request.headers.get('x-telegram-bot-api-secret-token');
    if (process.env.NODE_ENV === 'production' && secretToken !== TELEGRAM_SECRET_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const update = await request.json();

    if (update.message && update.message.text) {
      const message = update.message;
      
      // 2. Convert to Merchander NormalizedMessage
      const normalizedMsg: NormalizedMessage = {
        platform: 'telegram',
        external_id: message.message_id.toString(),
        // Telegram IDs are typically numeric user IDs, not phone numbers.
        sender_id: message.from.id.toString(),
        text: message.text,
        timestamp: new Date(message.date * 1000).toISOString()
      };

      // 3. Pass to the Intelligence Brain Interface
      const extractedCart = await extractCartFromChat(normalizedMsg);
      
      // 4. TODO: Trigger order state machine (Ticket 4)
      console.log('[Telegram Webhook] Extracted cart:', extractedCart);
    }

    // Always return 200 OK
    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
