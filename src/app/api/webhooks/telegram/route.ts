import { NextRequest, NextResponse } from 'next/server';
import { NormalizedMessage } from '@/types/messaging';
import { extractCartFromChat } from '@/lib/intelligence/extract';
import { timingSafeStringEqual } from '@/utils/webhook-signature';

/**
 * Constant-time equality for the Telegram secret token. Returns false when the
 * header is absent or the expected token is not configured.
 */
function secretTokenValid(header: string | null): boolean {
  const expected = process.env.TELEGRAM_SECRET_TOKEN;
  if (!header || !expected) return false;
  return timingSafeStringEqual(header, expected);
}

/**
 * Handles incoming Telegram messages
 */
export async function POST(request: NextRequest) {
  try {
    if (!secretTokenValid(request.headers.get('x-telegram-bot-api-secret-token'))) {
      console.warn('Telegram webhook secret token verification failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const update = await request.json();

    if (update.message && update.message.text) {
      const message = update.message;

      // Convert to Merchander NormalizedMessage
      const normalizedMsg: NormalizedMessage = {
        platform: 'telegram',
        external_id: message.message_id.toString(),
        // Telegram IDs are typically numeric user IDs, not phone numbers.
        sender_id: message.from.id.toString(),
        text: message.text,
        timestamp: new Date(message.date * 1000).toISOString(),
      };

      // Pass to the Intelligence Brain Interface
      const extractedCart = await extractCartFromChat(normalizedMsg);

      // TODO: Trigger order state machine (Ticket 4)
      console.log(
        `[Telegram Webhook] Extracted intent=${extractedCart.intent} items=${extractedCart.items.length} confidence=${extractedCart.confidence}`
      );
    }

    // Always return 200 OK
    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
