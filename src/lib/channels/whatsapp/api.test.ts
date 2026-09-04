import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { sendWhatsAppTextMessage, sendWhatsAppTemplateMessage, WhatsAppAPIError } from './api';

describe('WhatsApp Graph API Client', () => {
  const phoneNumberId = '12345';
  const accessToken = 'fake-token';
  const to = '987654321';

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends a text message successfully', async () => {
    const mockResponse = {
      messaging_product: 'whatsapp',
      contacts: [{ input: to, wa_id: to }],
      messages: [{ id: 'wamid.123' }]
    };

    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await sendWhatsAppTextMessage(phoneNumberId, accessToken, to, 'Hello there!');
    
    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: { body: 'Hello there!' }
        })
      }
    );
  });

  it('sends a template message successfully', async () => {
    const mockResponse = {
      messaging_product: 'whatsapp',
      contacts: [{ input: to, wa_id: to }],
      messages: [{ id: 'wamid.456' }]
    };

    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await sendWhatsAppTemplateMessage(phoneNumberId, accessToken, to, 'hello_world', 'en');
    
    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'template',
          template: {
            name: 'hello_world',
            language: { code: 'en' }
          }
        })
      }
    );
  });

  it('throws WhatsAppAPIError on failed request', async () => {
    const errorData = { error: { message: 'Invalid token' } };
    
    (global.fetch as Mock).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => errorData,
    });

    await expect(
      sendWhatsAppTextMessage(phoneNumberId, 'bad-token', to, 'Fail me')
    ).rejects.toThrow(WhatsAppAPIError);
    
    await expect(
      sendWhatsAppTextMessage(phoneNumberId, 'bad-token', to, 'Fail me')
    ).rejects.toThrow(/401/);
  });
});
