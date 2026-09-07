import { ReplyRequest, ReplyResponse } from '@/types/messaging';

const DEFAULT_TIMEOUT_MS = 8000;

export const SAFE_REPLY_FALLBACK: ReplyResponse = {
  reply_text:
    'Thank you for reaching out! A member of our team will review your message and get back to you shortly.',
  intent: 'unknown',
  confidence: 0,
  grounded_facts: [],
  requires_human_approval: true,
  escalation_reason: 'Intelligence service unavailable',
};

/**
 * Sends a customer message and grounding context to the Python Intelligence Brain to generate
 * a grounded, polite conversational reply.
 *
 * Logs only sanitized metadata (platform, external ID, length, tenant) to protect customer PII (F-08).
 * Fails safely to a polite human-hold fallback if the service is unreachable or times out.
 */
export async function generateGroundedReply(
  request: ReplyRequest
): Promise<ReplyResponse> {
  const serviceUrl = process.env.PYTHON_BRAIN_URL || 'http://127.0.0.1:8000';
  const apiKey = process.env.INTELLIGENCE_SERVICE_API_KEY || '';

  // Redact customer message content from application logs (F-08)
  console.log(
    `[AI Brain Interface] Generating reply: platform=${request.message.platform} external_id=${request.message.external_id} length=${request.message.text?.length ?? 0} tenant=${request.tenant_id ?? 'none'}`
  );

  try {
    const endpoint = `${serviceUrl.replace(/\/+$/, '')}/api/v1/reply`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'X-API-Key': apiKey } : {}),
      },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.warn(
        `[AI Brain Interface] Reply service responded with HTTP status ${response.status}`
      );
      return {
        ...SAFE_REPLY_FALLBACK,
        escalation_reason: `Intelligence service error (status ${response.status})`,
      };
    }

    const data = await response.json();

    return {
      reply_text:
        typeof data.reply_text === 'string'
          ? data.reply_text
          : SAFE_REPLY_FALLBACK.reply_text,
      intent: typeof data.intent === 'string' ? data.intent : 'unknown',
      confidence: typeof data.confidence === 'number' ? data.confidence : 0,
      grounded_facts: Array.isArray(data.grounded_facts)
        ? data.grounded_facts.map((f: unknown) => String(f))
        : [],
      requires_human_approval: Boolean(data.requires_human_approval),
      escalation_reason:
        typeof data.escalation_reason === 'string' ? data.escalation_reason : null,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`[AI Brain Interface] Reply generation failed: ${errorMessage}`);
    return {
      ...SAFE_REPLY_FALLBACK,
      escalation_reason: `Reply generation unavailable: ${errorMessage}`,
    };
  }
}
