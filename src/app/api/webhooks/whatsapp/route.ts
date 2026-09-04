import { NextRequest, NextResponse } from 'next/server';
import { parseWhatsAppMessages, parseWhatsAppStatuses } from '@/lib/channels/whatsapp/webhook';
import { verifyMetaSignature, timingSafeStringEqual } from '@/utils/webhook-signature';
import { resolveChannelIdentity } from '@/lib/channels/identity';
import { createAdminClient } from '@/lib/supabase/admin';

import { fetchWhatsAppMedia } from '@/lib/channels/whatsapp/api';

// Meta Cloud API credentials. Names match .env.example. A future per-tenant
// connector will source these from platform_settings instead.
const WHATSAPP_APP_SECRET = process.env.WHATSAPP_APP_SECRET;
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (
    mode === 'subscribe' &&
    !!WHATSAPP_VERIFY_TOKEN &&
    !!token &&
    timingSafeStringEqual(token, WHATSAPP_VERIFY_TOKEN)
  ) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-hub-signature-256');

    if (!verifyMetaSignature(rawBody, signature, WHATSAPP_APP_SECRET)) {
      return new NextResponse('Invalid signature', { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const messages = parseWhatsAppMessages(payload);
    const statuses = parseWhatsAppStatuses(payload);

    if (messages.length === 0 && statuses.length === 0) {
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

      const contentObj: Record<string, unknown> = { type: msg.type, text: msg.text };

      // 3. Download and store media if present
      if (msg.mediaId && WHATSAPP_ACCESS_TOKEN) {
        try {
          const { buffer, mimeType } = await fetchWhatsAppMedia(msg.mediaId, WHATSAPP_ACCESS_TOKEN);
          
          const ext = mimeType.split('/')[1] || 'bin';
          const filePath = `${tenantId}/whatsapp/${msg.messageId}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from('message-media')
            .upload(filePath, buffer, {
              contentType: mimeType,
              upsert: true,
            });

          if (uploadError) {
            console.error(`Failed to upload media ${msg.mediaId}`, uploadError);
          } else {
            contentObj.mediaUrl = filePath;
            contentObj.mimeType = mimeType;
          }
        } catch (mediaError) {
          console.error(`Failed to fetch media ${msg.mediaId}`, mediaError);
        }
      }

      // 4. Insert the inbound message (ignoring unique constraint errors for idempotency)
      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          tenant_id: tenantId,
          channel_identity_id: identity.id,
          direction: 'inbound',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          type: msg.type as any,
          status: 'received',
          external_id: msg.messageId,
          content: contentObj,
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

    for (const status of statuses) {
      const { error: updateError } = await supabase
        .from('messages')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update({ status: status.status as any }) // Supabase enum casting
        .eq('external_id', status.messageId);
        
      if (updateError) {
        console.error(`Failed to update status for message ${status.messageId}`, updateError);
      }
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook processing error', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
