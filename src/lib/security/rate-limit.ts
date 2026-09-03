import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Fixed-window throttle backed by `public.storefront_rate_limits`.
 *
 * Counts events recorded for `bucket` within the trailing `windowSeconds`. If
 * the count is already at or above `max`, the call is blocked (`false`).
 * Otherwise it records one event and allows the call (`true`).
 *
 * Fails **open**: any DB error (including the table not existing on an
 * un-migrated environment) logs and returns `true`. A throttle outage must never
 * take down storefront checkout or order tracking.
 *
 * The table is written and read only by the service-role client; RLS denies
 * anon/authenticated entirely.
 */
export async function enforceRateLimit(
  bucket: string,
  max: number,
  windowSeconds: number
): Promise<boolean> {
  const supabase = createAdminClient();
  const now = Date.now();
  const windowStart = new Date(now - windowSeconds * 1000).toISOString();

  try {
    const { count, error } = await supabase
      .from('storefront_rate_limits')
      .select('id', { count: 'exact', head: true })
      .eq('bucket', bucket)
      .gte('created_at', windowStart);

    if (error) {
      console.error('enforceRateLimit count failed, allowing request:', error.message);
      return true;
    }

    if ((count ?? 0) >= max) {
      return false;
    }

    const { error: insertError } = await supabase
      .from('storefront_rate_limits')
      .insert({ bucket });

    if (insertError) {
      console.error('enforceRateLimit insert failed, allowing request:', insertError.message);
      return true;
    }

    // Opportunistic cleanup: drop this bucket's rows older than a day so the
    // table does not grow unbounded. Best-effort, never blocks the request.
    const dayAgo = new Date(now - 86_400_000).toISOString();
    void supabase
      .from('storefront_rate_limits')
      .delete()
      .eq('bucket', bucket)
      .lt('created_at', dayAgo)
      .then(({ error: cleanupError }) => {
        if (cleanupError) {
          console.warn('enforceRateLimit cleanup warning:', cleanupError.message);
        }
      });

    return true;
  } catch (err) {
    console.error('enforceRateLimit threw, allowing request:', err);
    return true;
  }
}
