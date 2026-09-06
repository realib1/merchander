import { NormalizedMessage, ExtractedCart, ExtractionRequest } from '@/types/messaging';

const DEFAULT_TIMEOUT_MS = 8000;

export const EMPTY_CART_FALLBACK: ExtractedCart = {
  items: [],
  confidence: 0,
  intent: 'unknown',
  notes: null,
};

/**
 * Sends a normalized message to the Python Intelligence Brain to extract structured cart intent.
 * Grounded against the tenant's product catalog when tenantId is provided.
 *
 * Logs only sanitized metadata (platform, external ID, length, tenant) to protect customer PII (F-08).
 * Fails safely to an empty cart fallback if the service is unreachable or times out.
 */
export async function extractCartFromChat(
  message: NormalizedMessage,
  tenantId?: string | null
): Promise<ExtractedCart> {
  const serviceUrl = process.env.PYTHON_BRAIN_URL || 'http://127.0.0.1:8000';
  const apiKey = process.env.INTELLIGENCE_SERVICE_API_KEY || '';

  // Redact customer message content from application logs (F-08)
  console.log(
    `[AI Brain Interface] Extracting intent: platform=${message.platform} external_id=${message.external_id} length=${message.text?.length ?? 0} tenant=${tenantId ?? 'none'}`
  );

  const payload: ExtractionRequest = {
    tenant_id: tenantId ?? null,
    message,
  };

  try {
    const endpoint = `${serviceUrl.replace(/\/+$/, '')}/api/v1/extract`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'X-API-Key': apiKey } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.warn(
        `[AI Brain Interface] Intelligence service responded with HTTP status ${response.status}`
      );
      return {
        ...EMPTY_CART_FALLBACK,
        notes: `Intelligence service error (status ${response.status})`,
      };
    }

    const data = await response.json();

    return {
      items: Array.isArray(data.items)
        ? data.items.map((item: { sku: string; quantity: number }) => ({
            sku: String(item.sku),
            quantity: Number(item.quantity) || 1,
          }))
        : [],
      confidence: typeof data.confidence === 'number' ? data.confidence : 0,
      intent: typeof data.intent === 'string' ? data.intent : 'unknown',
      notes: typeof data.notes === 'string' ? data.notes : null,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`[AI Brain Interface] Extraction failed: ${errorMessage}`);
    return {
      ...EMPTY_CART_FALLBACK,
      notes: `Extraction unavailable: ${errorMessage}`,
    };
  }
}

