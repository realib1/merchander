import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractCartFromChat, EMPTY_CART_FALLBACK } from './extract';
import { NormalizedMessage } from '@/types/messaging';

describe('extractCartFromChat', () => {
  const originalEnv = process.env;

  const mockMessage: NormalizedMessage = {
    platform: 'whatsapp',
    external_id: 'msg-wamid-12345',
    sender_id: '233244123456',
    text: 'I want 2 bottles of perf-blue and 1 perf-red please send to East Legon',
    timestamp: '2026-09-06T09:00:00.000Z',
  };

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      PYTHON_BRAIN_URL: 'http://127.0.0.1:8000',
      INTELLIGENCE_SERVICE_API_KEY: 'test-intelligence-secret-key',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('calls Python extraction service with auth header, tenant_id, and payload', async () => {
    const mockApiResponse = {
      items: [
        { sku: 'PERF-BLUE', quantity: 2 },
        { sku: 'PERF-RED', quantity: 1 },
      ],
      confidence: 0.95,
      intent: 'create_order',
      notes: 'Grounded against tenant catalog',
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockApiResponse,
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await extractCartFromChat(mockMessage, 'tenant-accra-123');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl, calledOptions] = fetchMock.mock.calls[0];

    expect(calledUrl).toBe('http://127.0.0.1:8000/api/v1/extract');
    expect(calledOptions.method).toBe('POST');
    expect(calledOptions.headers).toEqual({
      'Content-Type': 'application/json',
      'X-API-Key': 'test-intelligence-secret-key',
    });

    const parsedBody = JSON.parse(calledOptions.body);
    expect(parsedBody).toEqual({
      tenant_id: 'tenant-accra-123',
      message: mockMessage,
    });

    expect(result).toEqual({
      items: [
        { sku: 'PERF-BLUE', quantity: 2 },
        { sku: 'PERF-RED', quantity: 1 },
      ],
      confidence: 0.95,
      intent: 'create_order',
      notes: 'Grounded against tenant catalog',
    });
  });

  it('sends tenant_id as null when tenantId is not provided', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [],
        confidence: 0.1,
        intent: 'greeting',
        notes: null,
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await extractCartFromChat(mockMessage);

    const [, calledOptions] = fetchMock.mock.calls[0];
    const parsedBody = JSON.parse(calledOptions.body);
    expect(parsedBody.tenant_id).toBeNull();
  });

  it('returns fallback cart when service responds with non-200 status', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({ detail: 'Bad Gateway' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await extractCartFromChat(mockMessage, 'tenant-accra-123');

    expect(result.items).toEqual([]);
    expect(result.confidence).toBe(0);
    expect(result.intent).toBe('unknown');
    expect(result.notes).toContain('502');
    expect(warnSpy).toHaveBeenCalled();
  });

  it('returns fallback cart on network failure or abort timeout', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('Network connection refused'));
    vi.stubGlobal('fetch', fetchMock);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await extractCartFromChat(mockMessage, 'tenant-accra-123');

    expect(result).toEqual({
      ...EMPTY_CART_FALLBACK,
      notes: 'Extraction unavailable: Network connection refused',
    });
    expect(warnSpy).toHaveBeenCalled();
  });

  it('sanitizes customer message content from logs (F-08)', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ items: [], confidence: 0.8, intent: 'check_stock' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await extractCartFromChat(mockMessage, 'tenant-accra-123');

    expect(logSpy).toHaveBeenCalled();
    for (const callArgs of logSpy.mock.calls) {
      const loggedString = callArgs.join(' ');
      // Verify metadata is present
      expect(loggedString).toContain('platform=whatsapp');
      expect(loggedString).toContain('external_id=msg-wamid-12345');
      expect(loggedString).toContain('tenant=tenant-accra-123');
      // Verify raw message content and PII are NOT present
      expect(loggedString).not.toContain('East Legon');
      expect(loggedString).not.toContain('perf-blue');
      expect(loggedString).not.toContain(mockMessage.text);
    }
  });

  it('handles missing or malformed fields in response gracefully', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: 'not-an-array',
        confidence: 'not-a-number',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await extractCartFromChat(mockMessage, 'tenant-accra-123');

    expect(result.items).toEqual([]);
    expect(result.confidence).toBe(0);
    expect(result.intent).toBe('unknown');
    expect(result.notes).toBeNull();
  });
});
