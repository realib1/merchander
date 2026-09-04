import { describe, it, expect } from 'vitest';
import { verifyWhatsAppSignature, parseWhatsAppMessages } from './webhook';
import { WhatsAppWebhookPayload } from './types';
import crypto from 'crypto';

describe('verifyWhatsAppSignature', () => {
  const secret = 'my-secret';
  const payload = JSON.stringify({ test: 'data' });

  it('returns true for a valid signature', () => {
    const signature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');
    
    expect(verifyWhatsAppSignature(payload, `sha256=${signature}`, secret)).toBe(true);
  });

  it('returns false for an invalid signature', () => {
    expect(verifyWhatsAppSignature(payload, 'sha256=invalid-signature', secret)).toBe(false);
  });

  it('returns false for a missing or malformed signature header', () => {
    expect(verifyWhatsAppSignature(payload, null, secret)).toBe(false);
    expect(verifyWhatsAppSignature(payload, 'invalid-format', secret)).toBe(false);
  });
});

describe('parseWhatsAppMessages', () => {
  it('extracts text messages correctly', () => {
    const payload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'entry-1',
          changes: [
            {
              field: 'messages',
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '12345',
                  phone_number_id: 'phone-id-1',
                },
                contacts: [
                  { profile: { name: 'Test User' }, wa_id: '123456789' }
                ],
                messages: [
                  {
                    from: '123456789',
                    id: 'wamid-123',
                    timestamp: '1690000000',
                    type: 'text',
                    text: { body: 'Hello world' }
                  }
                ]
              }
            }
          ]
        }
      ]
    };

    const parsed = parseWhatsAppMessages(payload as unknown as WhatsAppWebhookPayload);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toEqual({
      phoneNumberId: 'phone-id-1',
      from: '123456789',
      profileName: 'Test User',
      messageId: 'wamid-123',
      text: 'Hello world',
      timestamp: '1690000000',
    });
  });

  it('ignores non-text messages', () => {
    const payload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'entry-1',
          changes: [
            {
              field: 'messages',
              value: {
                messaging_product: 'whatsapp',
                metadata: { display_phone_number: '1', phone_number_id: '1' },
                messages: [
                  {
                    from: '123', id: 'wamid-2', timestamp: '1', type: 'image'
                  }
                ]
              }
            }
          ]
        }
      ]
    };
    const parsed = parseWhatsAppMessages(payload as unknown as WhatsAppWebhookPayload);
    expect(parsed).toHaveLength(0);
  });

  it('returns empty array for unrelated events', () => {
    const payload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: '1',
          changes: [
            {
              field: 'statuses',
              value: { messaging_product: 'whatsapp', metadata: { display_phone_number: '1', phone_number_id: '1' } }
            }
          ]
        }
      ]
    };
    const parsed = parseWhatsAppMessages(payload as unknown as WhatsAppWebhookPayload);
    expect(parsed).toHaveLength(0);
  });
});
