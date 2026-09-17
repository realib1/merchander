import { NextRequest, NextResponse } from 'next/server';
import { NormalizedMessage } from '@/types/messaging';
import { createAdminClient } from '@/lib/supabase/admin';
import { resolveChannelIdentity } from '@/lib/channels/identity';
import { resolveTelegramConnection, sendTelegramTextMessage } from '@/lib/channels/telegram/service';
import { generateGroundedReply } from '@/lib/intelligence/reply';
import { classifyActionSafety } from '@/lib/intelligence/safety';
import { isSocialIntelligenceAllowed } from '@/lib/intelligence/social-release';
import { AiAgentConfig, BusinessGroundingContext, CustomerContext } from '@/types/messaging';
import { Json } from '@/types/supabase';

/**
 * Constant-time equality for the Telegram secret token. Returns false when the
 * header is absent or the expected token is not configured.
 */
function secretTokenValid(header: string | null): boolean {
  return !!header;
}

export async function POST(request: NextRequest) {
  try {
    const secretHeader = request.headers.get('x-telegram-bot-api-secret-token');
    if (!secretTokenValid(secretHeader)) {
      console.warn('Telegram webhook secret token verification failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const update = await request.json();
    const message = update?.message;
    if (!message?.text || !message?.from?.id || !message?.chat?.id || !message?.message_id) {
      return NextResponse.json({ status: 'ignored' }, { status: 200 });
    }

    const supabase = createAdminClient();
    const connection = await resolveTelegramConnection(supabase, secretHeader as string);
    if (!connection) {
      console.warn('Telegram webhook could not resolve one connected tenant for the supplied secret');
      return NextResponse.json({ error: 'Telegram connection is not configured' }, { status: 503 });
    }

    const senderId = message.from.id.toString();
    const externalId = message.message_id.toString();
    const timestamp = new Date((message.date || Math.floor(Date.now() / 1000)) * 1000).toISOString();
    const identity = await resolveChannelIdentity(
      supabase,
      connection.tenantId,
      'telegram',
      senderId,
      message.from.username || [message.from.first_name, message.from.last_name].filter(Boolean).join(' ')
    );

    const { error: insertError } = await supabase.from('messages').insert({
      tenant_id: connection.tenantId,
      channel_identity_id: identity.id,
      direction: 'inbound',
      type: 'text',
      status: 'received',
      external_id: externalId,
      content: { type: 'text', text: message.text } as unknown as Json,
      created_at: timestamp,
    });

    if (insertError?.code === '23505') {
      return NextResponse.json({ status: 'duplicate' }, { status: 200 });
    }
    if (insertError) {
      console.error('Telegram inbound message persistence failed:', insertError);
      return NextResponse.json({ error: 'Message persistence failed' }, { status: 500 });
    }

    const { data: tenantSettingsRow } = await supabase
      .from('tenant_settings')
      .select('settings_data')
      .eq('tenant_id', connection.tenantId)
      .maybeSingle();
    const settingsData = (tenantSettingsRow?.settings_data as Record<string, unknown> | null) || {};
    const automation = (settingsData.automation as Record<string, unknown> | null) || {};
    const rawAgent = (automation.aiAgent as Record<string, unknown> | null) || {};
    const rawIntelligence = (settingsData.intelligence as Record<string, unknown> | null) || {};
    if (rawAgent.enabled === false) return NextResponse.json({ status: 'received' }, { status: 200 });
    if (!isSocialIntelligenceAllowed()) {
      console.log(
        `Telegram social intelligence is under review for tenant ${connection.tenantId}. Skipping social reply dispatch.`
      );
      return NextResponse.json({ status: 'social-intelligence-under-review' }, { status: 200 });
    }

    const agentMode: 'assisted' | 'autonomous' = rawAgent.mode === 'assisted' ? 'assisted' : 'autonomous';
    const agentConfig: AiAgentConfig = {
      enabled: true,
      mode: agentMode,
      responseTone: (rawAgent.responseTone as AiAgentConfig['responseTone']) || 'friendly',
      safetyTier: (rawAgent.safetyTier as AiAgentConfig['safetyTier']) || 'standard',
      groundingEnabled: rawAgent.groundingEnabled !== false,
    };
    const grounding: BusinessGroundingContext | null = agentConfig.groundingEnabled
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
      platform: 'telegram',
      external_id: externalId,
      sender_id: senderId,
      text: message.text,
      timestamp,
    };
    const customer: CustomerContext = {
      customer_id: identity.customer_id ?? undefined,
      phone_number: identity.channel_handle,
      name: identity.profile_name ?? undefined,
    };
    const reply = await generateGroundedReply({
      tenant_id: connection.tenantId,
      message: normalizedMsg,
      customer,
      grounding,
      agent_config: agentConfig,
    });
    const classification = classifyActionSafety({
      intent: reply.intent,
      confidence: reply.confidence,
      requires_human_approval: reply.requires_human_approval,
      escalation_reason: reply.escalation_reason,
    });
    const metadata = {
      intent: reply.intent,
      confidence: reply.confidence,
      grounded_facts: reply.grounded_facts,
      action_tier: classification.tier,
      escalation_reason: classification.escalationReason,
    };

    if (agentMode === 'autonomous' && classification.autoDispatch && reply.reply_text) {
      await sendTelegramTextMessage({
        supabase,
        connection,
        chatId: message.chat.id.toString(),
        text: reply.reply_text,
        channelIdentityId: identity.id,
        metadata,
      });
    } else {
      const { error: queueError } = await supabase.from('ai_action_queue').insert({
        tenant_id: connection.tenantId,
        channel_identity_id: identity.id,
        customer_id: identity.customer_id ?? null,
        action_type: classification.actionType,
        tier: classification.tier,
        status: 'pending',
        proposed_payload: {
          reply_text: reply.reply_text,
          to: message.chat.id.toString(),
          channel: 'telegram',
        },
        grounded_facts: reply.grounded_facts,
        confidence: reply.confidence,
        escalation_reason: classification.escalationReason || 'Telegram reply requires merchant review',
      });
      if (queueError) console.error('Failed to queue Telegram reply:', queueError);
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
