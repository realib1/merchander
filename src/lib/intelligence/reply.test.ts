import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateGroundedReply, SAFE_REPLY_FALLBACK } from './reply';
import { ReplyRequest } from '@/types/messaging';

describe('generateGroundedReply', () => {
  const originalEnv = process.env;

  const mockRequest: ReplyRequest = {
    tenant_id: 'tenant-accra-123',
    message: {
      platform: 'whatsapp',
      external_id: 'msg-wamid-99999',
      sender_id: '233244123456',
      text: 'How much is the blue perfume and do you have it in stock?',
      timestamp: '2026-09-06T10:00:00.000Z',
    },
    customer: {
      customer_id: 'cust-uuid-456',
      phone_number: '233244123456',
      name: 'Kofi Mensah',
    },
  };

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      PYTHON_BRAIN_URL: 'http://127.0.0.1:8000',
      INTELLIGENCE_SERVICE_API_KEY: 'test-qa-secret-key',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('calls Python reply endpoint with auth header and request body', async () => {
    const mockApiResponse = {
      reply_text: 'Yes, Blue Perfume is available for GH₵150.00.',
      intent: 'check_stock',
      confidence: 0.95,
      grounded_facts: ['Blue Perfume is AVAILABLE (stock: 12)'],
      requires_human_approval: false,
      escalation_reason: null,
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockApiResponse,
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await generateGroundedReply(mockRequest);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl, calledOptions] = fetchMock.mock.calls[0];

    expect(calledUrl).toBe('http://127.0.0.1:8000/api/v1/reply');
    expect(calledOptions.method).toBe('POST');
    expect(calledOptions.headers).toEqual({
      'Content-Type': 'application/json',
      'X-API-Key': 'test-qa-secret-key',
    });

    const parsedBody = JSON.parse(calledOptions.body);
    expect(parsedBody).toEqual(mockRequest);

    expect(result).toEqual({
      reply_text: 'Yes, Blue Perfume is available for GH₵150.00.',
      intent: 'check_stock',
      confidence: 0.95,
      grounded_facts: ['Blue Perfume is AVAILABLE (stock: 12)'],
      requires_human_approval: false,
      escalation_reason: null,
    });
  });

  it('omits X-API-Key header when key is not configured', async () => {
    delete process.env.INTELLIGENCE_SERVICE_API_KEY;

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        reply_text: 'Hello! How can we help you?',
        intent: 'greeting',
        confidence: 0.9,
        grounded_facts: [],
        requires_human_approval: false,
        escalation_reason: null,
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await generateGroundedReply(mockRequest);

    const [, calledOptions] = fetchMock.mock.calls[0];
    expect(calledOptions.headers).toEqual({
      'Content-Type': 'application/json',
    });
  });

  it('returns safe fallback when reply service returns HTTP error', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await generateGroundedReply(mockRequest);

    expect(result.requires_human_approval).toBe(true);
    expect(result.intent).toBe('unknown');
    expect(result.escalation_reason).toContain('503');
    expect(result.reply_text).toBe(SAFE_REPLY_FALLBACK.reply_text);
  });

  it('returns safe fallback on network timeout or fetch exception', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('Connection refused'));
    vi.stubGlobal('fetch', fetchMock);

    const result = await generateGroundedReply(mockRequest);

    expect(result.requires_human_approval).toBe(true);
    expect(result.intent).toBe('unknown');
    expect(result.escalation_reason).toContain('Connection refused');
    expect(result.reply_text).toBe(SAFE_REPLY_FALLBACK.reply_text);
  });

  it('redacts customer message text from console logs for privacy (F-08)', async () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        reply_text: 'Welcome!',
        intent: 'greeting',
        confidence: 0.9,
        grounded_facts: [],
        requires_human_approval: false,
        escalation_reason: null,
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await generateGroundedReply(mockRequest);

    const logCalls = consoleLogSpy.mock.calls.map((c) => c.join(' '));
    const allLogs = logCalls.join('\n');

    expect(allLogs).toContain('platform=whatsapp');
    expect(allLogs).toContain('external_id=msg-wamid-99999');
    expect(allLogs).not.toContain('How much is the blue perfume');
  });

  it('forwards grounding and agent_config in request payload (F-20, F-21)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        reply_text: 'We deliver in 24 hours!',
        intent: 'inquiry',
        confidence: 0.9,
        grounded_facts: [],
        requires_human_approval: false,
        escalation_reason: null,
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const requestWithGrounding: ReplyRequest = {
      ...mockRequest,
      grounding: {
        aboutBusiness: 'Accra Premier Boutique',
        whatWeSell: 'Luxury perfumes and watches',
        deliveryInfo: 'Same-day delivery in Accra, 48 hours for other regions',
        returnPolicy: '7-day return window for unopened items',
        customerPolicies: 'Orders confirmed on payment',
      },
      agent_config: {
        enabled: true,
        mode: 'assisted',
        groundingEnabled: true,
        responseTone: 'friendly',
        safetyTier: 'strict',
      },
    };

    await generateGroundedReply(requestWithGrounding);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, calledOptions] = fetchMock.mock.calls[0];
    const parsedBody = JSON.parse(calledOptions.body);

    expect(parsedBody.grounding).toEqual(requestWithGrounding.grounding);
    expect(parsedBody.agent_config).toEqual(requestWithGrounding.agent_config);
  });

  it('answers delivery inquiries via grounding when intelligence service is unavailable (F-20 fallback)', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('Brain offline'));
    vi.stubGlobal('fetch', fetchMock);

    const requestWithDeliveryGrounding: ReplyRequest = {
      ...mockRequest,
      message: {
        ...mockRequest.message,
        text: 'What are your delivery options and where do you ship?',
      },
      grounding: {
        deliveryInfo: 'We deliver to Greater Accra for GH₵30 and Kumasi for GH₵50.',
      },
    };

    const result = await generateGroundedReply(requestWithDeliveryGrounding);

    expect(result.requires_human_approval).toBe(false);
    expect(result.intent).toBe('inquiry');
    expect(result.reply_text).toContain('We deliver to Greater Accra for GH₵30');
    expect(result.grounded_facts[0]).toContain('Delivery info:');
  });

  it('answers return policy inquiries via grounding when service returns HTTP error (F-20 fallback)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });
    vi.stubGlobal('fetch', fetchMock);

    const requestWithReturnGrounding: ReplyRequest = {
      ...mockRequest,
      message: {
        ...mockRequest.message,
        text: 'Can I get a refund if the item does not fit?',
      },
      grounding: {
        returnPolicy: 'Refunds processed within 3 business days of return receipt.',
      },
    };

    const result = await generateGroundedReply(requestWithReturnGrounding);

    expect(result.requires_human_approval).toBe(false);
    expect(result.intent).toBe('inquiry');
    expect(result.reply_text).toContain('Refunds processed within 3 business days');
    expect(result.grounded_facts[0]).toContain('Return policy:');
  });
});
