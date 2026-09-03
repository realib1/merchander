-- Migration: 20260903180321_create_storefront_rate_limits.sql
-- Fixed-window throttle store for the anonymous storefront server actions
-- (submitStorefrontOrder, getStorefrontOrderTracking, lookupCustomerOrder).
-- Written and read only by the service-role admin client; never exposed to
-- anon/authenticated (findings F-15, F-16).

CREATE TABLE IF NOT EXISTS public.storefront_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_storefront_rate_limits_bucket_time
    ON public.storefront_rate_limits(bucket, created_at);

-- RLS on with no policy: a hard deny for every caller except service_role,
-- which bypasses RLS. Belt-and-braces with the grant below.
ALTER TABLE public.storefront_rate_limits ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.storefront_rate_limits FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.storefront_rate_limits TO service_role;

NOTIFY pgrst, 'reload schema';
