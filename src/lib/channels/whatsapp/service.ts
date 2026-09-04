import { SupabaseClient } from '@supabase/supabase-js';
import { Database, Json } from '@/types/supabase';
import { sendWhatsAppTextMessage, sendWhatsAppTemplateMessage } from './api';
import { WhatsAppTemplateComponent } from './types';

// Mock credentials resolver (to be replaced when integration settings exist)
export async function getTenantWhatsAppConfig(tenantId: string) {
  // TODO: Replace with real db query against tenant settings
  if (tenantId === 'tenant-123') {
    return {
      phoneNumberId: 'mock-phone-id',
      accessToken: 'mock-access-token'
    };
  }
  throw new Error(`WhatsApp integration not configured for tenant ${tenantId}`);
}

/**
 * Sends an outbound message (text or template) and logs it in the messages table.
 */
export async function sendOutboundWhatsAppMessage({
  supabase,
  tenantId,
  channelIdentityId,
  to,
  messageType,
  text,
  templateName,
  templateLanguage,
  templateComponents
}: {
  supabase: SupabaseClient<Database>;
  tenantId: string;
  channelIdentityId: string;
  to: string;
  messageType: 'text' | 'template';
  text?: string;
  templateName?: string;
  templateLanguage?: string;
  templateComponents?: WhatsAppTemplateComponent[];
}) {
  const config = await getTenantWhatsAppConfig(tenantId);
  
  let response;
  
  if (messageType === 'text') {
    if (!text) throw new Error("Text is required for text messages");
    response = await sendWhatsAppTextMessage(config.phoneNumberId, config.accessToken, to, text);
  } else if (messageType === 'template') {
    if (!templateName) throw new Error("Template name is required for template messages");
    response = await sendWhatsAppTemplateMessage(
      config.phoneNumberId, 
      config.accessToken, 
      to, 
      templateName, 
      templateLanguage, 
      templateComponents
    );
  } else {
    throw new Error(`Unsupported message type: ${messageType}`);
  }

  // Insert into messages table
  const externalId = response.messages[0]?.id;
  
  const content = messageType === 'text' 
    ? { text } 
    : { template: { name: templateName, language: templateLanguage, components: templateComponents } };

  const { error } = await supabase
    .from('messages')
    .insert({
      tenant_id: tenantId,
      channel_identity_id: channelIdentityId,
      direction: 'outbound',
      type: messageType,
      status: 'sent',
      external_id: externalId,
      content: content as unknown as Json
    });

  if (error) {
    console.error("Failed to insert outbound message into database", error);
  }

  return response;
}
