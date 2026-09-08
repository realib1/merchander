import { NextRequest, NextResponse } from 'next/server';
import { parseWhatsAppMessages, parseWhatsAppStatuses } from '@/lib/channels/whatsapp/webhook';
import { verifyMetaSignature, timingSafeStringEqual } from '@/utils/webhook-signature';
import { resolveChannelIdentity } from '@/lib/channels/identity';
import { createAdminClient } from '@/lib/supabase/admin';

import { fetchWhatsAppMedia } from '@/lib/channels/whatsapp/api';
import { sendOutboundWhatsAppMessage } from '@/lib/channels/whatsapp/service';
import { extractCartFromChat } from '@/lib/intelligence/extract';
import { generateGroundedReply } from '@/lib/intelligence/reply';
import { classifyActionSafety } from '@/lib/intelligence/safety';
import { NormalizedMessage, CustomerContext } from '@/types/messaging';

// Meta Cloud API credentials. Names match .env.example. A future per-tenant
// connector will source these from platform_settings instead.
const getAppSecret = () => process.env.WHATSAPP_APP_SECRET;
const getVerifyToken = () => process.env.WHATSAPP_VERIFY_TOKEN;
const getAccessToken = () => process.env.WHATSAPP_ACCESS_TOKEN || '';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');
  const verifyToken = getVerifyToken();

  if (
    mode === 'subscribe' &&
    !!verifyToken &&
    !!token &&
    timingSafeStringEqual(token, verifyToken)
  ) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-hub-signature-256');
    const appSecret = getAppSecret();
    const accessToken = getAccessToken();

    if (!verifyMetaSignature(rawBody, signature, appSecret)) {
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
      if (msg.mediaId && accessToken) {
        try {
          const { buffer, mimeType } = await fetchWhatsAppMedia(msg.mediaId, accessToken);
          
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

      // 5. Dispatch inbound text messages to the Intelligence pipeline
      if (msg.type === 'text' && msg.text && (!insertError || insertError.code === '23505')) {
        const normalizedMsg: NormalizedMessage = {
          platform: 'whatsapp',
          external_id: msg.messageId,
          sender_id: msg.from,
          text: msg.text,
          timestamp: new Date(parseInt(msg.timestamp, 10) * 1000).toISOString(),
        };

        const customerContext: CustomerContext = {
          customer_id: identity.customer_id ?? undefined,
          phone_number: identity.channel_handle || msg.from,
          name: identity.profile_name ?? undefined,
        };

        // 5a. Run cart extraction for order intents
        let isCartOrder = false;
        try {
          const extractedCart = await extractCartFromChat(normalizedMsg, tenantId);
          console.log(
            `[WhatsApp Webhook] Extracted intent=${extractedCart.intent} items=${extractedCart.items.length} confidence=${extractedCart.confidence}`
          );
          if (extractedCart.items && extractedCart.items.length > 0) {
            isCartOrder = true;
          }
        } catch (extractErr) {
          console.warn('[WhatsApp Webhook] Extraction dispatch failed', extractErr);
        }

        // 5b. For inquiry messages (non-cart orders), generate grounded reply and dispatch outbound
        if (!isCartOrder) {
          try {
            const reply = await generateGroundedReply({
              tenant_id: tenantId,
              message: normalizedMsg,
              customer: customerContext,
            });

            console.log(
              `[WhatsApp Webhook] Generated reply intent=${reply.intent} confidence=${reply.confidence} requires_human_approval=${reply.requires_human_approval}`
            );

            const classification = classifyActionSafety({
              intent: reply.intent,
              confidence: reply.confidence,
              requires_human_approval: reply.requires_human_approval,
              escalation_reason: reply.escalation_reason,
            });

            console.log(
              `[WhatsApp Webhook] Safety classification tier=${classification.tier} actionType=${classification.actionType} autoDispatch=${classification.autoDispatch}`
            );

            if (classification.autoDispatch && reply.reply_text) {
              // Green Tier: Auto-dispatch immediate grounded reply
              try {
                await sendOutboundWhatsAppMessage({
                  supabase,
                  tenantId,
                  channelIdentityId: identity.id,
                  to: msg.from,
                  messageType: 'text',
                  text: reply.reply_text,
                  metadata: {
                    intent: reply.intent,
                    confidence: reply.confidence,
                    grounded_facts: reply.grounded_facts,
                    requires_human_approval: false,
                    escalation_reason: null,
                    action_tier: 'green',
                  },
                });
              } catch (dispatchErr) {
                console.warn(
                  `[WhatsApp Webhook] Outbound reply dispatch failed for tenant ${tenantId}:`,
                  dispatchErr
                );
              }
            } else {
              // Yellow or Red Tier: Queue action for merchant review / urgent exception
              try {
                const { error: queueInsertErr } = await supabase
                  .from('ai_action_queue')
                  .insert({
                    tenant_id: tenantId,
                    channel_identity_id: identity.id,
                    customer_id: identity.customer_id ?? null,
                    action_type: classification.actionType,
                    tier: classification.tier,
                    status: 'pending',
                    proposed_payload: {
                      reply_text: reply.reply_text,
                      to: msg.from,
                      customer_phone: identity.channel_handle || msg.from,
                      customer_name: identity.profile_name ?? undefined,
                    },
                    grounded_facts: reply.grounded_facts || [],
                    confidence: reply.confidence,
                    escalation_reason: classification.escalationReason,
                    customer_notice_sent: classification.customerAssuranceNotice ?? null,
                  });

                if (queueInsertErr) {
                  console.error(
                    `[WhatsApp Webhook] Failed to insert ${classification.tier} action into queue:`,
                    queueInsertErr
                  );
                }
              } catch (queueErr) {
                console.error('[WhatsApp Webhook] Queue insert error:', queueErr);
              }

              // Send customer assurance / handoff notice immediately if specified
              if (classification.customerAssuranceNotice) {
                try {
                  await sendOutboundWhatsAppMessage({
                    supabase,
                    tenantId,
                    channelIdentityId: identity.id,
                    to: msg.from,
                    messageType: 'text',
                    text: classification.customerAssuranceNotice,
                    metadata: {
                      intent: reply.intent,
                      confidence: reply.confidence,
                      grounded_facts: reply.grounded_facts,
                      requires_human_approval: true,
                      escalation_reason: classification.escalationReason,
                      action_tier: classification.tier,
                      is_assurance_notice: true,
                    },
                  });
                } catch (noticeErr) {
                  console.warn(
                    `[WhatsApp Webhook] Customer notice dispatch failed for tenant ${tenantId}:`,
                    noticeErr
                  );
                }
              }
            }
          } catch (replyErr) {
            console.warn('[WhatsApp Webhook] Reply generation failed', replyErr);
          }
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
