import 'server-only';
import { headers } from 'next/headers';

/**
 * Best-effort client IP for a server action or route handler. Reads the first
 * `x-forwarded-for` hop (Vercel sets this at the edge), falling back to
 * `x-real-ip`, then the literal `'unknown'` so callers always get a usable
 * bucket key. Not spoof-proof on its own, which is why throttles that use it
 * pair it with a second dimension (e.g. the normalised phone).
 */
export async function getRequestIp(): Promise<string> {
  const headersList = await headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  return forwardedFor?.split(',')[0]?.trim() || headersList.get('x-real-ip') || 'unknown';
}
