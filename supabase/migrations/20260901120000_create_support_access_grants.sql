-- Migration: 20260901120000_create_support_access_grants.sql
-- Support Access Handshake & Time-Limited Delegation Tokens (PRD v2.2)

CREATE TABLE IF NOT EXISTS public.platform_support_access_grants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    granted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ticket_id VARCHAR(255),
    token VARCHAR(255) UNIQUE NOT NULL,
    reason TEXT NOT NULL,
    duration_hours INT NOT NULL DEFAULT 2,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_support_grants_tenant ON public.platform_support_access_grants(tenant_id, status, expires_at);
CREATE INDEX IF NOT EXISTS idx_support_grants_token ON public.platform_support_access_grants(token);

-- RLS
ALTER TABLE public.platform_support_access_grants ENABLE ROW LEVEL SECURITY;

-- Policy: Tenant users can view and manage their own tenant's grants
CREATE POLICY "Tenant users manage support grants" ON public.platform_support_access_grants
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()
        )
    );

-- Policy: Platform staff can view active support grants
CREATE POLICY "Platform staff can view support grants" ON public.platform_support_access_grants
    FOR SELECT USING (public.is_platform_staff() OR auth.jwt() ->> 'role' = 'service_role');

-- Table Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_support_access_grants TO authenticated, service_role;
