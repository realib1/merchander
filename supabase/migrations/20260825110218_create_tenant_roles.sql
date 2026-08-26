-- 1. Create tenant_roles table
CREATE TABLE IF NOT EXISTS public.tenant_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_role_name UNIQUE (tenant_id, name)
);

CREATE INDEX idx_tenant_roles_tenant ON public.tenant_roles(tenant_id);

-- 2. Add role_id to tenant_users
ALTER TABLE public.tenant_users ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES public.tenant_roles(id) ON DELETE SET NULL;
CREATE INDEX idx_tenant_users_role_id ON public.tenant_users(role_id);

-- 3. Enable RLS on tenant_roles
ALTER TABLE public.tenant_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_tenant_roles ON public.tenant_roles
    FOR ALL USING (tenant_id in (select public.get_auth_user_tenant_ids()));

-- 4. Grants for tenant_roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_roles TO authenticated;
-- (service_role will automatically get ALL due to the previous default privileges migration)
