-- Migration: Secure storefront_sessions table
-- Hardens RLS and verifies no public/anon access permissions exist

-- Revoke all table-level access from anon role
REVOKE ALL ON TABLE public.storefront_sessions FROM anon;

-- Ensure RLS is active
ALTER TABLE public.storefront_sessions ENABLE ROW LEVEL SECURITY;

-- Drop any lingering or overly permissive legacy policies
DROP POLICY IF EXISTS "Public session access" ON public.storefront_sessions;
DROP POLICY IF EXISTS "Public can view valid order tokens" ON public.storefront_sessions;

-- Ensure merchants can manage sessions scoped strictly to their tenant
DROP POLICY IF EXISTS "Merchants manage storefront sessions" ON public.storefront_sessions;
CREATE POLICY "Merchants manage storefront sessions"
    ON public.storefront_sessions FOR ALL
    TO authenticated
    USING (tenant_id IN (SELECT public.get_auth_user_tenant_ids()))
    WITH CHECK (tenant_id IN (SELECT public.get_auth_user_tenant_ids()));

-- Ensure service_role has full management capabilities
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.storefront_sessions TO service_role;
