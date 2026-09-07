import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from './route';

// Mock dependencies
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/channels/identity', () => ({
  resolveChannelIdentity: vi.fn(),
}));

vi.mock('@/lib/intelligence/extract', () => ({
  extractCartFromChat: vi.fn(),
}));

vi.mock('@/lib/intelligence/reply', () => ({
  generateGroundedReply: vi.fn(),
}));

vi.mock('@/lib/channels/whatsapp/service', () => ({
  sendOutboundWhatsAppMessage: vi.fn(),
}));

import { createAdminClient } from '@/lib/supabase/admin';
import { resolveChannelIdentity } from '@/lib/channels/identity';
import { extractCartFromChat } from '@/lib/intelligence/extract';
import { generateGroundedReply } from '@/lib/intelligence/reply';
import { sendOutboundWhatsAppMessage } from '@/lib/channels/whatsapp/service';

describe('WhatsApp Webhook Route (/api/webhooks/whatsapp)', () => {
  const originalEnv = process.env;

  const mockSupabase = {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
      select: vi.fn().mockReturnThis(),
    }),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
      }),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      WHATSAPP_APP_SECRET: 'test-app-secret',
      WHATSAPP_VERIFY_TOKEN: 'test-verify-token',
      WHATSAPP_ACCESS_TOKEN: 'test-access-token',
    };
    (createAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase);
    (resolveChannelIdentity as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'identity-uuid-123',
      tenant_id: 'tenant-123',
      channel: 'whatsapp',
      channel_handle: '233244123456',
      profile_name: 'Ama Serwaa',
      customer_id: 'cust-uuid-789',
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('GET (Verification Challenge)', () => {
    it('returns challenge string on valid verify_token and subscribe mode', async () => {
      const url = new URL(
        'http://localhost:3000/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=test-verify-token&hub.challenge=challenge_12345'
      );
      const req = new NextRequest(url);

      const response = await GET(req);
      expect(response.status).toBe(200);
      const body = await response.text();
      expect(body).toBe('challenge_12345');
    });

    it('returns 403 Forbidden on mismatched verify_token', async () => {
      const url = new URL(
        'http://localhost:3000/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=wrong-token&hub.challenge=challenge_12345'
      );
      const req = new NextRequest(url);

      const response = await GET(req);
      expect(response.status).toBe(403);
    });
  });

  describe('POST (Inbound Events & Reply Pipeline)', () => {
    // Helper to generate a signed POST request
    const createPostRequest = async (payload: unknown, secret = 'test-app-secret') => {
      const bodyStr = JSON.stringify(payload);
      const crypto = await import('crypto');
      const signature = `sha256=${crypto.createHmac('sha256', secret).update(bodyStr).digest('hex')}`;

      return new NextRequest('http://localhost:3000/api/webhooks/whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hub-signature-256': signature,
        },
        body: bodyStr,
      });
    };

    const makeMessagePayload = (text: string, type = 'text') => ({
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
                  display_phone_number: '123456789',
                  phone_number_id: '123',
                },
                contacts: [{ profile: { name: 'Ama Serwaa' }, wa_id: '233244123456' }],
                messages: [
                  {
                    from: '233244123456',
                    id: 'wamid.HBgLMjMzMjQ0MTIzNDU2',
                    timestamp: '1725624000',
                    type,
                    text: type === 'text' ? { body: text } : undefined,
                  },
                ],
              },
            },
          ],
        },
      ],
    });

    it('returns 401 when signature is invalid', async () => {
      const req = await createPostRequest(makeMessagePayload('Hello'), 'wrong-secret');
      const response = await POST(req);
      expect(response.status).toBe(401);
    });

    it('processes inquiry message, calls generateGroundedReply, and dispatches outbound reply', async () => {
      // Extraction returns no cart items (inquiry intent)
      (extractCartFromChat as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        items: [],
        confidence: 0.9,
        intent: 'inquiry',
        notes: null,
      });

      // Grounded reply generates price answer
      (generateGroundedReply as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        reply_text: 'Perfume Blue is available for GH₵120.00.',
        intent: 'inquire_product',
        confidence: 0.95,
        grounded_facts: ['Grounded price: GH₵120.00'],
        requires_human_approval: false,
        escalation_reason: null,
      });

      (sendOutboundWhatsAppMessage as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        messaging_product: 'whatsapp',
        messages: [{ id: 'wamid.outbound-123' }],
      });

      const req = await createPostRequest(makeMessagePayload('How much is Perfume Blue?'));
      const response = await POST(req);

      expect(response.status).toBe(200);

      // Identity was resolved
      expect(resolveChannelIdentity).toHaveBeenCalledWith(
        mockSupabase,
        'tenant-123',
        'whatsapp',
        '233244123456',
        'Ama Serwaa'
      );

      // Reply was generated with customer context
      expect(generateGroundedReply).toHaveBeenCalledWith({
        tenant_id: 'tenant-123',
        message: expect.objectContaining({
          platform: 'whatsapp',
          external_id: 'wamid.HBgLMjMzMjQ0MTIzNDU2',
          sender_id: '233244123456',
          text: 'How much is Perfume Blue?',
        }),
        customer: {
          customer_id: 'cust-uuid-789',
          phone_number: '233244123456',
          name: 'Ama Serwaa',
        },
      });

      // Outbound reply was sent with metadata
      expect(sendOutboundWhatsAppMessage).toHaveBeenCalledWith({
        supabase: mockSupabase,
        tenantId: 'tenant-123',
        channelIdentityId: 'identity-uuid-123',
        to: '233244123456',
        messageType: 'text',
        text: 'Perfume Blue is available for GH₵120.00.',
        metadata: {
          intent: 'inquire_product',
          confidence: 0.95,
          grounded_facts: ['Grounded price: GH₵120.00'],
          requires_human_approval: false,
          escalation_reason: null,
        },
      });
    });

    it('does NOT call generateGroundedReply when message is a cart order with items', async () => {
      // Extraction returns cart items (e.g. customer wants to buy 2 bottles)
      (extractCartFromChat as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        items: [{ sku: 'PERF-BLUE', quantity: 2 }],
        confidence: 0.95,
        intent: 'create_order',
        notes: null,
      });

      const req = await createPostRequest(makeMessagePayload('I want 2 bottles of PERF-BLUE'));
      const response = await POST(req);

      expect(response.status).toBe(200);
      expect(extractCartFromChat).toHaveBeenCalled();
      expect(generateGroundedReply).not.toHaveBeenCalled();
      expect(sendOutboundWhatsAppMessage).not.toHaveBeenCalled();
    });

    it('remains resilient when reply generation fails and still returns 200 OK', async () => {
      (extractCartFromChat as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        items: [],
        confidence: 0,
        intent: 'unknown',
      });
      (generateGroundedReply as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Brain service connection timeout')
      );

      const req = await createPostRequest(makeMessagePayload('Where is my package?'));
      const response = await POST(req);

      expect(response.status).toBe(200);
      expect(sendOutboundWhatsAppMessage).not.toHaveBeenCalled();
    });

    it('remains resilient when outbound dispatch fails and still returns 200 OK', async () => {
      (extractCartFromChat as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        items: [],
        confidence: 0.8,
        intent: 'inquiry',
      });
      (generateGroundedReply as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        reply_text: 'Hold on please.',
        intent: 'confirm_payment',
        confidence: 0.9,
        grounded_facts: [],
        requires_human_approval: true,
        escalation_reason: 'Payment verification needed',
      });
      (sendOutboundWhatsAppMessage as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('WhatsApp integration not configured for tenant tenant-123')
      );

      const req = await createPostRequest(makeMessagePayload('I sent payment via MoMo'));
      const response = await POST(req);

      expect(response.status).toBe(200);
    });
  });
});
