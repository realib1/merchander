
import { parseWhatsAppMessages } from './webhook';
import { WhatsAppWebhookPayload } from './types';

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
      type: 'text',
      text: 'Hello world',
      mediaId: undefined,
      mimeType: undefined,
      timestamp: '1690000000',
    });
  });

  it('extracts media messages correctly', () => {
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
                    from: '123', id: 'wamid-2', timestamp: '1', type: 'image',
                    image: { id: 'media-1', mime_type: 'image/jpeg', sha256: 'abc' }
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
    expect(parsed[0].type).toBe('image');
    expect(parsed[0].mediaId).toBe('media-1');
    expect(parsed[0].mimeType).toBe('image/jpeg');
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

import { parseWhatsAppStatuses } from './webhook';

describe('parseWhatsAppStatuses', () => {
  it('extracts statuses correctly', () => {
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
                metadata: { display_phone_number: '1', phone_number_id: 'phone-1' },
                statuses: [
                  { id: 'wamid-1', status: 'delivered', timestamp: '1', recipient_id: '123' }
                ]
              }
            }
          ]
        }
      ]
    };
    const parsed = parseWhatsAppStatuses(payload as unknown as WhatsAppWebhookPayload);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toEqual({
      phoneNumberId: 'phone-1',
      messageId: 'wamid-1',
      status: 'delivered',
      timestamp: '1',
      recipientId: '123'
    });
  });
});
