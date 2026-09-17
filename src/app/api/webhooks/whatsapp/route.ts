import { NextRequest, NextResponse } from 'next/server';
import { parseWhatsAppMessages, parseWhatsAppStatuses } from '@/lib/channels/whatsapp/webhook';
import { verifyMetaSignature, timingSafeStringEqual } from '@/utils/webhook-signature';
import { resolveChannelIdentity } from '@/lib/channels/identity';
import { createAdminClient } from '@/lib/supabase/admin';

import { fetchWhatsAppMedia } from '@/lib/channels/whatsapp/api';
import { sendOutboundWhatsAppMessage, getTenantByWhatsAppPhoneId } from '@/lib/channels/whatsapp/service';
import { extractCartFromChat } from '@/lib/intelligence/extract';
import { captureDraftOrderFromCart } from '@/lib/intelligence/orders';
import { generateGroundedReply } from '@/lib/intelligence/reply';
import { classifyActionSafety } from '@/lib/intelligence/safety';
import { NormalizedMessage, CustomerContext, BusinessGroundingContext, AiAgentConfig } from '@/types/messaging';
import { Database } from '@/types/supabase';
import { isSocialIntelligenceAllowed } from '@/lib/intelligence/social-release';

type DbMessageType = Database['public']['Enums']['message_type'];

/**
 * Maps WhatsApp message parser types to PostgreSQL message_type enum.
 * Granular media types ('image', 'audio', 'document', 'video') map to 'media'.
 */
export function mapWhatsAppMessageTypeToDb(type: string): DbMessageType {
  switch (type) {
    case 'text':
      return 'text';
    case 'image':
    case 'audio':
    case 'document':
    case 'video':
      return 'media';
    case 'interactive':
      return 'interactive';
    case 'template':
      return 'template';
    case 'system':
      return 'system';
    default:
      return 'text';
  }
}

// Meta Cloud API credentials. Names match .env.example. A future per-tenant
// connector will source these from platform_settings instead.
const getAppSecret = () => process.env.WHATSAPP_APP_SECRET;
const getVerifyToken = () => process.env.WHATSAPP_VERIFY_TOKEN;
const getAccessToken = () => process.env.WHATSAPP_ACCESS_TOKEN || '';

function hasRequiredWhatsAppWebhookConfig(): boolean {
  return !!getAppSecret() && !!getVerifyToken() && !!getAccessToken();
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');
  const verifyToken = getVerifyToken();

  if (!hasRequiredWhatsAppWebhookConfig()) {
    return new NextResponse('Service unavailable', { status: 503 });
  }

  if (mode === 'subscribe' && !!verifyToken && !!token && timingSafeStringEqual(token, verifyToken)) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    if (!hasRequiredWhatsAppWebhookConfig()) {
      return new NextResponse('WhatsApp webhook service is not configured', { status: 503 });
    }

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
      let tenantId: string | null = null;
      try {
        tenantId = await getTenantByWhatsAppPhoneId(supabase, msg.phoneNumberId);
        if (!tenantId) {
          console.warn(`No tenant found for phone_number_id: ${msg.phoneNumberId}`);
          continue;
        }
      } catch (err) {
        console.error('Routing failed', err);
        continue; // Skip this message, try the next
      }

      // 2. Resolve the sender's identity
      const identity = await resolveChannelIdentity(supabase, tenantId, 'whatsapp', msg.from, msg.profileName);

      const contentObj: Record<string, unknown> = { type: msg.type, text: msg.text };

      // 3. Download and store media if present
      if (msg.mediaId && accessToken) {
        try {
          const { buffer, mimeType } = await fetchWhatsAppMedia(msg.mediaId, accessToken);

          const ext = mimeType.split('/')[1] || 'bin';
          const filePath = `${tenantId}/whatsapp/${msg.messageId}.${ext}`;

          const { error: uploadError } = await supabase.storage.from('message-media').upload(filePath, buffer, {
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
      const dbType = mapWhatsAppMessageTypeToDb(msg.type);
      const { error: insertError } = await supabase.from('messages').insert({
        tenant_id: tenantId,
        channel_identity_id: identity.id,
        direction: 'inbound',
        type: dbType,
        status: 'received',
        external_id: msg.messageId,
        content: contentObj,
        created_at: new Date(parseInt(msg.timestamp) * 1000).toISOString(),
      });

      if (insertError) {
        if (insertError.code === '23505') {
          // Unique constraint violation on external_id, safely ignore (idempotent retry)
          console.log(`Duplicate message skipped: ${msg.messageId}`);
          continue;
        } else {
          console.error(`Failed to insert message ${msg.messageId}`, insertError);
        }
      }

      // 5. Dispatch inbound text messages to the Intelligence pipeline
      if (msg.type === 'text' && msg.text && !insertError) {
        // 5.0 Load tenant settings for AI automation & business grounding (F-20, F-21)
        const { data: tenantSettingsRow } = await supabase
          .from('tenant_settings')
          .select('settings_data')
          .eq('tenant_id', tenantId)
          .maybeSingle();

        const settingsData = (tenantSettingsRow?.settings_data as Record<string, unknown> | null) || {};
        const automationSettings = (settingsData.automation as Record<string, unknown> | null) || {};
        const rawAiAgent = (automationSettings.aiAgent as Record<string, unknown> | null) || {};
        const rawIntelligence = (settingsData.intelligence as Record<string, unknown> | null) || {};

        if (rawAiAgent.enabled === false) {
          console.log(
            `[WhatsApp Webhook] AI Conversational Agent disabled for tenant ${tenantId}. Skipping intelligence dispatch.`
          );
          continue;
        }

        if (!isSocialIntelligenceAllowed()) {
          console.log(
            `[WhatsApp Webhook] Social intelligence is under review for tenant ${tenantId}. Skipping social reply dispatch until privacy validation is complete.`
          );
          continue;
        }

        const agentMode: 'assisted' | 'autonomous' = rawAiAgent.mode === 'assisted' ? 'assisted' : 'autonomous';

        const aiAgentConfig: AiAgentConfig = {
          enabled: rawAiAgent.enabled !== false,
          mode: agentMode,
          responseTone: (rawAiAgent.responseTone as AiAgentConfig['responseTone']) || 'friendly',
          safetyTier: (rawAiAgent.safetyTier as AiAgentConfig['safetyTier']) || 'standard',
          groundingEnabled: rawAiAgent.groundingEnabled !== false,
        };

        const businessGrounding: BusinessGroundingContext | null = aiAgentConfig.groundingEnabled
          ? {
              aboutBusiness: typeof rawIntelligence.aboutBusiness === 'string' ? rawIntelligence.aboutBusiness : null,
              whatWeSell: typeof rawIntelligence.whatWeSell === 'string' ? rawIntelligence.whatWeSell : null,
              deliveryInfo: typeof rawIntelligence.deliveryInfo === 'string' ? rawIntelligence.deliveryInfo : null,
              returnPolicy: typeof rawIntelligence.returnPolicy === 'string' ? rawIntelligence.returnPolicy : null,
              customerPolicies:
                typeof rawIntelligence.customerPolicies === 'string' ? rawIntelligence.customerPolicies : null,
            }
          : null;

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
            const orderResult = await captureDraftOrderFromCart({
              supabase,
              tenantId,
              channelIdentityId: identity.id,
              customerId: identity.customer_id ?? null,
              customerPhone: identity.channel_handle || msg.from,
              customerName: identity.profile_name ?? null,
              items: extractedCart.items,
            });

            if (orderResult.success) {
              isCartOrder = true;
              console.log(
                `[WhatsApp Webhook] Draft order captured: #${orderResult.orderNumber} id=${orderResult.orderId} total=${orderResult.totalAmount}`
              );

              // 1. Queue Yellow action in ai_action_queue
              const { error: queueInsertErr } = await supabase.from('ai_action_queue').insert({
                tenant_id: tenantId,
                channel_identity_id: identity.id,
                customer_id: orderResult.customerId,
                action_type: 'draft_order',
                tier: 'yellow',
                status: 'pending',
                proposed_payload: {
                  order_id: orderResult.orderId,
                  order_number: orderResult.orderNumber,
                  payment_url: orderResult.paymentUrl,
                  items: orderResult.items,
                  subtotal: orderResult.subtotal,
                  delivery_fee: orderResult.deliveryFee,
                  total_amount: orderResult.totalAmount,
                  currency: orderResult.currency,
                  reply_text: orderResult.proposedReplyText,
                  to: msg.from,
                  customer_phone: identity.channel_handle || msg.from,
                  customer_name: identity.profile_name ?? undefined,
                  has_stock_deficit: orderResult.hasStockDeficit,
                  warnings: orderResult.warnings,
                },
                grounded_facts: orderResult.groundedFacts,
                confidence: extractedCart.confidence || 0.85,
                escalation_reason: orderResult.hasStockDeficit
                  ? 'Stock constraint detected on requested order items'
                  : 'Commercial draft order capture requires merchant confirmation',
                customer_notice_sent: agentMode === 'autonomous' ? orderResult.customerAssuranceNotice : null,
              });

              if (queueInsertErr) {
                console.error('[WhatsApp Webhook] Failed to insert draft_order action into queue:', queueInsertErr);
              }

              // 2. Dispatch immediate customer assurance notice via WhatsApp (autonomous mode only)
              if (agentMode === 'autonomous') {
                try {
                  await sendOutboundWhatsAppMessage({
                    supabase,
                    tenantId,
                    channelIdentityId: identity.id,
                    to: msg.from,
                    messageType: 'text',
                    text: orderResult.customerAssuranceNotice,
                    metadata: {
                      action_type: 'draft_order',
                      tier: 'yellow',
                      order_id: orderResult.orderId,
                      order_number: orderResult.orderNumber,
                      is_assurance_notice: true,
                    },
                  });
                } catch (noticeErr) {
                  console.warn('[WhatsApp Webhook] Customer order assurance notice dispatch failed:', noticeErr);
                }
              }
            } else {
              console.log(
                `[WhatsApp Webhook] Order capture skipped (${orderResult.reason}): ${orderResult.error}. Falling back to Q&A.`
              );
            }
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
              grounding: businessGrounding,
              agent_config: aiAgentConfig,
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

            if (agentMode === 'autonomous' && classification.autoDispatch && reply.reply_text) {
              // Autonomous Green Tier: Auto-dispatch immediate grounded reply
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
                console.warn(`[WhatsApp Webhook] Outbound reply dispatch failed for tenant ${tenantId}:`, dispatchErr);
              }
            } else {
              // Assisted mode (all tiers) or Autonomous Yellow/Red Tier: Queue action for merchant review
              try {
                const { error: queueInsertErr } = await supabase.from('ai_action_queue').insert({
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
                  escalation_reason:
                    agentMode === 'assisted' && classification.autoDispatch
                      ? 'Copilot assisted mode: merchant review required before dispatch'
                      : classification.escalationReason,
                  customer_notice_sent:
                    agentMode === 'autonomous' ? (classification.customerAssuranceNotice ?? null) : null,
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

              // Send customer assurance / handoff notice immediately if in autonomous mode
              if (agentMode === 'autonomous' && classification.customerAssuranceNotice) {
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
                  console.warn(`[WhatsApp Webhook] Customer notice dispatch failed for tenant ${tenantId}:`, noticeErr);
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
