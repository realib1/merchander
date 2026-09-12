import type { Mock } from 'vitest';
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

import { fetchWhatsAppMedia } from './api';

describe('fetchWhatsAppMedia', () => {
  const mediaId = 'media-123';
  const accessToken = 'fake-token';

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches media metadata and downloads binary successfully', async () => {
    const mockMetadataResponse = {
      url: 'https://lookaside.fbsbx.com/whatsapp_business/attachments/some-long-id',
      mime_type: 'image/jpeg',
      sha256: 'abc',
      file_size: 1024,
      id: mediaId
    };

    const mockBuffer = new ArrayBuffer(8);

    // First call: metadata
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockMetadataResponse,
    });

    // Second call: binary download
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => mockBuffer,
    });

    const result = await fetchWhatsAppMedia(mediaId, accessToken);
    
    expect(result.mimeType).toBe('image/jpeg');
    expect(result.buffer).toBe(mockBuffer);
    
    expect(global.fetch).toHaveBeenNthCalledWith(1, `https://graph.facebook.com/v19.0/${mediaId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    expect(global.fetch).toHaveBeenNthCalledWith(2, mockMetadataResponse.url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  });

  it('throws error if metadata fetch fails', async () => {
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: { message: 'Not found' } }),
    });

    await expect(fetchWhatsAppMedia(mediaId, accessToken)).rejects.toThrow(WhatsAppAPIError);
  });

  it('throws error if download fetch fails', async () => {
    const mockMetadataResponse = {
      url: 'https://example.com/media',
      mime_type: 'image/jpeg',
    };

    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockMetadataResponse,
    });

    (global.fetch as Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Forbidden',
    });

    await expect(fetchWhatsAppMedia(mediaId, accessToken)).rejects.toThrow(/Failed to download media/);
  });
});
