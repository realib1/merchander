import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseCredentials,
  getTenantByWhatsAppPhoneId,
  getTenantWhatsAppConfig,
  sendOutboundWhatsAppMessage,
} from './service';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Mock ./api methods
vi.mock('./api', () => ({
  sendWhatsAppTextMessage: vi.fn(),
  sendWhatsAppTemplateMessage: vi.fn(),
}));

import { sendWhatsAppTextMessage, sendWhatsAppTemplateMessage } from './api';

describe('WhatsApp Channel Service (service.ts)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.WHATSAPP_ACCESS_TOKEN;
    delete process.env.WHATSAPP_PHONE_NUMBER_ID;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('parseCredentials', () => {
    it('returns null for null or undefined credentials', () => {
      expect(parseCredentials(null)).toBeNull();
      expect(parseCredentials(undefined as unknown as null)).toBeNull();
    });

    it('returns object credentials as-is', () => {
      const creds = { phone_number_id: '111', access_token: 'tok' };
      expect(parseCredentials(creds)).toEqual(creds);
    });

    it('parses valid JSON string credentials', () => {
      const credsStr = JSON.stringify({ phone_number_id: '222', access_token: 'tok2' });
      expect(parseCredentials(credsStr)).toEqual({ phone_number_id: '222', access_token: 'tok2' });
    });

    it('returns null for invalid JSON string or array', () => {
      expect(parseCredentials('{invalid-json')).toBeNull();
      expect(parseCredentials(JSON.stringify(['not', 'an', 'object']))).toBeNull();
      expect(parseCredentials(123 as unknown as null)).toBeNull();
    });
  });

  describe('getTenantByWhatsAppPhoneId', () => {
    it('returns null when phoneNumberId is empty', async () => {
      const mockSupabase = {} as SupabaseClient<Database>;
      expect(await getTenantByWhatsAppPhoneId(mockSupabase, '')).toBeNull();
    });

    it('resolves tenant_id from database when channel_connections has matching phone_number_id', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEqChannel = vi.fn().mockReturnThis();
      const mockEqStatus = vi.fn().mockResolvedValue({
        data: [
          {
            tenant_id: 'tenant-real-1',
            credentials: { phone_number_id: '10987654321', access_token: 'meta-token-1' },
            status: 'connected',
          },
          {
            tenant_id: 'tenant-real-2',
            credentials: { phone_number_id: '99988877766', access_token: 'meta-token-2' },
            status: 'connected',
          },
        ],
        error: null,
      });

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: mockSelect,
          eq: (field: string, value: string) => {
            if (field === 'channel' && value === 'whatsapp_cloud') {
              return {
                eq: mockEqStatus,
              };
            }
            return mockEqChannel;
          },
        }),
      } as unknown as SupabaseClient<Database>;

      const result = await getTenantByWhatsAppPhoneId(mockSupabase, '99988877766');
      expect(result).toBe('tenant-real-2');
    });

    it('resolves tenant_id when credentials uses camelCase phoneNumberId and stringified JSON', async () => {
      const mockEqStatus = vi.fn().mockResolvedValue({
        data: [
          {
            tenant_id: 'tenant-camel-case',
            credentials: JSON.stringify({ phoneNumberId: '555444333', accessToken: 'camel-token' }),
            status: 'connected',
          },
        ],
        error: null,
      });

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: mockEqStatus,
            }),
          }),
        }),
      } as unknown as SupabaseClient<Database>;

      const result = await getTenantByWhatsAppPhoneId(mockSupabase, '555444333');
      expect(result).toBe('tenant-camel-case');
    });

    it('falls back to tenant-123 for mock phone id 123 when not found in database', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      } as unknown as SupabaseClient<Database>;

      const result = await getTenantByWhatsAppPhoneId(mockSupabase, '123');
      expect(result).toBe('tenant-123');
    });

    it('returns null when no matching phone id exists in database and id is not 123', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [
                  {
                    tenant_id: 'tenant-other',
                    credentials: { phone_number_id: '000111222' },
                    status: 'connected',
                  },
                ],
                error: null,
              }),
            }),
          }),
        }),
      } as unknown as SupabaseClient<Database>;

      const result = await getTenantByWhatsAppPhoneId(mockSupabase, '999999999');
      expect(result).toBeNull();
    });

    it('handles database error gracefully and falls back to fixture if id is 123', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB connection error' } }),
            }),
          }),
        }),
      } as unknown as SupabaseClient<Database>;

      const resultFallback = await getTenantByWhatsAppPhoneId(mockSupabase, '123');
      expect(resultFallback).toBe('tenant-123');

      const resultUnknown = await getTenantByWhatsAppPhoneId(mockSupabase, '456');
      expect(resultUnknown).toBeNull();
    });
  });

  describe('getTenantWhatsAppConfig', () => {
    it('returns mock credentials for tenant-123 fixture', async () => {
      const config = await getTenantWhatsAppConfig('tenant-123');
      expect(config).toEqual({
        phoneNumberId: 'mock-phone-id',
        accessToken: 'mock-access-token',
      });
    });

    it('uses environment variables for tenant-123 if defined', async () => {
      process.env.WHATSAPP_PHONE_NUMBER_ID = 'custom-env-phone';
      process.env.WHATSAPP_ACCESS_TOKEN = 'custom-env-token';

      const config = await getTenantWhatsAppConfig('tenant-123');
      expect(config).toEqual({
        phoneNumberId: 'custom-env-phone',
        accessToken: 'custom-env-token',
      });
    });

    it('queries channel_connections and returns live credentials when Supabase client is passed', async () => {
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: {
          status: 'connected',
          credentials: {
            phone_number_id: 'live-phone-id-001',
            access_token: 'live-access-token-001',
          },
        },
        error: null,
      });

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: mockMaybeSingle,
              }),
            }),
          }),
        }),
      } as unknown as SupabaseClient<Database>;

      const config = await getTenantWhatsAppConfig('tenant-live-abc', mockSupabase);
      expect(config).toEqual({
        phoneNumberId: 'live-phone-id-001',
        accessToken: 'live-access-token-001',
      });
    });

    it('parses stringified JSON credentials from channel_connections', async () => {
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: {
          status: 'connected',
          credentials: JSON.stringify({
            phoneNumberId: 'live-phone-str-002',
            accessToken: 'live-access-str-002',
          }),
        },
        error: null,
      });

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: mockMaybeSingle,
              }),
            }),
          }),
        }),
      } as unknown as SupabaseClient<Database>;

      const config = await getTenantWhatsAppConfig('tenant-live-str', mockSupabase);
      expect(config).toEqual({
        phoneNumberId: 'live-phone-str-002',
        accessToken: 'live-access-str-002',
      });
    });

    it('falls back to process.env.WHATSAPP_ACCESS_TOKEN when tenant has no live connection in database', async () => {
      process.env.WHATSAPP_ACCESS_TOKEN = 'fallback-env-token';
      process.env.WHATSAPP_PHONE_NUMBER_ID = 'fallback-phone-id';

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        }),
      } as unknown as SupabaseClient<Database>;

      const config = await getTenantWhatsAppConfig('tenant-unconnected', mockSupabase);
      expect(config).toEqual({
        phoneNumberId: 'fallback-phone-id',
        accessToken: 'fallback-env-token',
      });
    });

    it('throws an error when tenant has no configuration in database and no environment variable is set', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        }),
      } as unknown as SupabaseClient<Database>;

      await expect(
        getTenantWhatsAppConfig('tenant-missing', mockSupabase)
      ).rejects.toThrow('WhatsApp integration not configured for tenant tenant-missing');
    });
  });

  describe('sendOutboundWhatsAppMessage', () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'channel_connections') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      status: 'connected',
                      credentials: {
                        phone_number_id: 'db-phone-id',
                        access_token: 'db-access-token',
                      },
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {
          insert: mockInsert,
        };
      }),
    } as unknown as SupabaseClient<Database>;

    it('dispatches text message and records outbound message in database', async () => {
      (sendWhatsAppTextMessage as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        messaging_product: 'whatsapp',
        messages: [{ id: 'wamid.outbound-999' }],
      });

      const response = await sendOutboundWhatsAppMessage({
        supabase: mockSupabase,
        tenantId: 'tenant-live-999',
        channelIdentityId: 'channel-id-123',
        to: '233244000111',
        messageType: 'text',
        text: 'Your order is confirmed!',
        metadata: { order_id: 'order-1' },
      });

      expect(sendWhatsAppTextMessage).toHaveBeenCalledWith(
        'db-phone-id',
        'db-access-token',
        '233244000111',
        'Your order is confirmed!'
      );
      expect(response).toEqual({
        messaging_product: 'whatsapp',
        messages: [{ id: 'wamid.outbound-999' }],
      });
      expect(mockInsert).toHaveBeenCalledWith({
        tenant_id: 'tenant-live-999',
        channel_identity_id: 'channel-id-123',
        direction: 'outbound',
        type: 'text',
        status: 'sent',
        external_id: 'wamid.outbound-999',
        content: {
          text: 'Your order is confirmed!',
          metadata: { order_id: 'order-1' },
        },
      });
    });

    it('dispatches template message and records outbound message in database', async () => {
      (sendWhatsAppTemplateMessage as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        messaging_product: 'whatsapp',
        messages: [{ id: 'wamid.template-outbound-888' }],
      });

      const response = await sendOutboundWhatsAppMessage({
        supabase: mockSupabase,
        tenantId: 'tenant-live-999',
        channelIdentityId: 'channel-id-123',
        to: '233244000111',
        messageType: 'template',
        templateName: 'order_receipt',
        templateLanguage: 'en_US',
        templateComponents: [],
      });

      expect(sendWhatsAppTemplateMessage).toHaveBeenCalledWith(
        'db-phone-id',
        'db-access-token',
        '233244000111',
        'order_receipt',
        'en_US',
        []
      );
      expect(response.messages[0]?.id).toBe('wamid.template-outbound-888');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'template',
          external_id: 'wamid.template-outbound-888',
        })
      );
    });

    it('throws error when text message lacks text property', async () => {
      await expect(
        sendOutboundWhatsAppMessage({
          supabase: mockSupabase,
          tenantId: 'tenant-live-999',
          channelIdentityId: 'channel-id-123',
          to: '233244000111',
          messageType: 'text',
        })
      ).rejects.toThrow('Text is required for text messages');
    });

    it('throws error when template message lacks templateName property', async () => {
      await expect(
        sendOutboundWhatsAppMessage({
          supabase: mockSupabase,
          tenantId: 'tenant-live-999',
          channelIdentityId: 'channel-id-123',
          to: '233244000111',
          messageType: 'template',
        })
      ).rejects.toThrow('Template name is required for template messages');
    });
  });
});
