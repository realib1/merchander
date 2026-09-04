import { NextRequest, NextResponse } from 'next/server';
import { verifyWhatsAppSignature, parseWhatsAppMessages } from '@/lib/channels/whatsapp/webhook';
import { resolveChannelIdentity } from '@/lib/channels/identity';
import { createAdminClient } from '@/lib/supabase/admin';

// TODO: Replace with environment variable or platform_settings fetcher
const META_APP_SECRET = process.env.META_APP_SECRET || ''; 

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // TODO: Compare token with environment variable or platform_settings
  if (mode === 'subscribe' && token === (process.env.META_VERIFY_TOKEN || 'merchander_webhook_verify_token')) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-hub-signature-256');

    if (!verifyWhatsAppSignature(rawBody, signature, META_APP_SECRET)) {
      return new NextResponse('Invalid signature', { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const messages = parseWhatsAppMessages(payload);

    if (messages.length === 0) {
      return new NextResponse('OK', { status: 200 }); // Acknowledge non-message payloads
    }

    const supabase = createAdminClient();

    for (const msg of messages) {
      // 1. Route to correct tenant
      // Note: getTenantByWhatsAppPhoneId must be implemented when integration settings exist
      let tenantId: string;
      try {
        // Mock implementation for now, in a real app this queries a settings table
        // tenantId = await getTenantByWhatsAppPhoneId(supabase, msg.phoneNumberId);
        
        // For testing/mocking purposes, if phoneNumberId is '123', return 'tenant-123'
        tenantId = msg.phoneNumberId === '123' ? 'tenant-123' : 'unknown';
        if (tenantId === 'unknown') {
          console.warn(`No tenant found for phone_number_id: ${msg.phoneNumberId}`);
          continue;
        }
      } catch (err) {
        console.error('Routing failed', err);
        continue; // Skip this message, try the next
      }

      // 2. Resolve the sender's identity
      const identity = await resolveChannelIdentity(
        supabase,
        tenantId,
        'whatsapp',
        msg.from,
        msg.profileName
      );

      // 3. Insert the inbound message (ignoring unique constraint errors for idempotency)
      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          tenant_id: tenantId,
          channel_identity_id: identity.id,
          direction: 'inbound',
          type: 'text',
          status: 'received',
          external_id: msg.messageId,
          content: { text: msg.text },
          created_at: new Date(parseInt(msg.timestamp) * 1000).toISOString(),
        });
      
      if (insertError) {
        if (insertError.code === '23505') {
          // Unique constraint violation on external_id, safely ignore (idempotent retry)
          console.log(`Duplicate message skipped: ${msg.messageId}`);
        } else {
          console.error(`Failed to insert message ${msg.messageId}`, insertError);
        }
      }
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook processing error', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
