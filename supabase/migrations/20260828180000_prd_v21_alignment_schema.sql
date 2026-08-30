-- Migration: PRD v2.1 Schema Alignment
-- Introduces Unified Customer Identities, Channel Connections, Workflow/Audit Logs, and Flyer Share Tracking

-- 1. Unified Customer Identities (PRD v2.1 §34)
CREATE TABLE IF NOT EXISTS public.customer_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    channel VARCHAR(50) NOT NULL CHECK (channel IN ('whatsapp', 'instagram', 'facebook', 'telegram', 'storefront')),
    identifier VARCHAR(255) NOT NULL, -- e.g. Phone number/JID, IG scoped ID, Telegram user ID
    profile_data JSONB DEFAULT '{}'::jsonb,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_tenant_channel_identifier UNIQUE (tenant_id, channel, identifier)
);

CREATE INDEX IF NOT EXISTS idx_customer_identities_tenant ON public.customer_identities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customer_identities_customer ON public.customer_identities(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_identities_lookup ON public.customer_identities(tenant_id, channel, identifier);

-- 2. Channel Connections & Bot Configurations (PRD v2.1 §30-§32)
CREATE TABLE IF NOT EXISTS public.channel_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    channel VARCHAR(50) NOT NULL CHECK (channel IN ('whatsapp_cloud', 'telegram', 'instagram', 'facebook')),
    status VARCHAR(50) NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error', 'pending_verification')),
    credentials JSONB DEFAULT '{}'::jsonb,
    settings JSONB DEFAULT '{"auto_reply": true, "human_escalation": true}'::jsonb,
    last_health_check TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_tenant_channel_connection UNIQUE (tenant_id, channel)
);

CREATE INDEX IF NOT EXISTS idx_channel_connections_tenant ON public.channel_connections(tenant_id);

-- 3. Workflow & Audit Logs (PRD v2.1 §35)
CREATE TABLE IF NOT EXISTS public.workflow_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    source VARCHAR(50) NOT NULL CHECK (source IN ('system', 'ai_agent', 'user', 'webhook')),
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_workflow_logs_tenant_date ON public.workflow_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_logs_entity ON public.workflow_logs(tenant_id, entity_type, entity_id);

-- 4. Product Flyer Sharing & Attribution Tracking (PRD v2.1 §36)
CREATE TABLE IF NOT EXISTS public.flyer_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    short_code VARCHAR(50) UNIQUE NOT NULL,
    channel_target VARCHAR(50) DEFAULT 'general',
    views_count INT DEFAULT 0 NOT NULL,
    scans_count INT DEFAULT 0 NOT NULL,
    orders_count INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_flyer_shares_tenant_product ON public.flyer_shares(tenant_id, product_id);
CREATE INDEX IF NOT EXISTS idx_flyer_shares_short_code ON public.flyer_shares(short_code);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.customer_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flyer_shares ENABLE ROW LEVEL SECURITY;

-- 6. Row Level Security Policies
-- customer_identities
DROP POLICY IF EXISTS "Users can view customer_identities of their tenant." ON public.customer_identities;
DROP POLICY IF EXISTS "Users can insert customer_identities for their tenant." ON public.customer_identities;
DROP POLICY IF EXISTS "Users can update customer_identities of their tenant." ON public.customer_identities;
DROP POLICY IF EXISTS "Users can delete customer_identities of their tenant." ON public.customer_identities;
DROP POLICY IF EXISTS "Superadmins can view all customer_identities." ON public.customer_identities;

CREATE POLICY "Users can view customer_identities of their tenant." ON public.customer_identities
    FOR SELECT USING (tenant_id IN (SELECT public.get_auth_user_tenant_ids()));
CREATE POLICY "Users can insert customer_identities for their tenant." ON public.customer_identities
    FOR INSERT WITH CHECK (tenant_id IN (SELECT public.get_auth_user_tenant_ids()));
CREATE POLICY "Users can update customer_identities of their tenant." ON public.customer_identities
    FOR UPDATE USING (tenant_id IN (SELECT public.get_auth_user_tenant_ids()));
CREATE POLICY "Users can delete customer_identities of their tenant." ON public.customer_identities
    FOR DELETE USING (tenant_id IN (SELECT public.get_auth_user_tenant_ids()));
CREATE POLICY "Superadmins can view all customer_identities." ON public.customer_identities
    FOR ALL USING (public.is_superadmin());

-- channel_connections
DROP POLICY IF EXISTS "Users can view channel_connections of their tenant." ON public.channel_connections;
DROP POLICY IF EXISTS "Users can insert channel_connections for their tenant." ON public.channel_connections;
DROP POLICY IF EXISTS "Users can update channel_connections of their tenant." ON public.channel_connections;
DROP POLICY IF EXISTS "Users can delete channel_connections of their tenant." ON public.channel_connections;
DROP POLICY IF EXISTS "Superadmins can view all channel_connections." ON public.channel_connections;

CREATE POLICY "Users can view channel_connections of their tenant." ON public.channel_connections
    FOR SELECT USING (tenant_id IN (SELECT public.get_auth_user_tenant_ids()));
CREATE POLICY "Users can insert channel_connections for their tenant." ON public.channel_connections
    FOR INSERT WITH CHECK (tenant_id IN (SELECT public.get_auth_user_tenant_ids()));
CREATE POLICY "Users can update channel_connections of their tenant." ON public.channel_connections
    FOR UPDATE USING (tenant_id IN (SELECT public.get_auth_user_tenant_ids()));
CREATE POLICY "Users can delete channel_connections of their tenant." ON public.channel_connections
    FOR DELETE USING (tenant_id IN (SELECT public.get_auth_user_tenant_ids()));
CREATE POLICY "Superadmins can view all channel_connections." ON public.channel_connections
    FOR ALL USING (public.is_superadmin());

-- workflow_logs
DROP POLICY IF EXISTS "Users can view workflow_logs of their tenant." ON public.workflow_logs;
DROP POLICY IF EXISTS "Users can insert workflow_logs for their tenant." ON public.workflow_logs;
DROP POLICY IF EXISTS "Superadmins can view all workflow_logs." ON public.workflow_logs;

CREATE POLICY "Users can view workflow_logs of their tenant." ON public.workflow_logs
    FOR SELECT USING (tenant_id IN (SELECT public.get_auth_user_tenant_ids()));
CREATE POLICY "Users can insert workflow_logs for their tenant." ON public.workflow_logs
    FOR INSERT WITH CHECK (tenant_id IN (SELECT public.get_auth_user_tenant_ids()));
CREATE POLICY "Superadmins can view all workflow_logs." ON public.workflow_logs
    FOR ALL USING (public.is_superadmin());

-- flyer_shares
DROP POLICY IF EXISTS "Users can view flyer_shares of their tenant." ON public.flyer_shares;
DROP POLICY IF EXISTS "Users can insert flyer_shares for their tenant." ON public.flyer_shares;
DROP POLICY IF EXISTS "Users can update flyer_shares of their tenant." ON public.flyer_shares;
DROP POLICY IF EXISTS "Users can delete flyer_shares of their tenant." ON public.flyer_shares;
DROP POLICY IF EXISTS "Superadmins can view all flyer_shares." ON public.flyer_shares;

CREATE POLICY "Users can view flyer_shares of their tenant." ON public.flyer_shares
    FOR SELECT USING (tenant_id IN (SELECT public.get_auth_user_tenant_ids()));
CREATE POLICY "Users can insert flyer_shares for their tenant." ON public.flyer_shares
    FOR INSERT WITH CHECK (tenant_id IN (SELECT public.get_auth_user_tenant_ids()));
CREATE POLICY "Users can update flyer_shares of their tenant." ON public.flyer_shares
    FOR UPDATE USING (tenant_id IN (SELECT public.get_auth_user_tenant_ids()));
CREATE POLICY "Users can delete flyer_shares of their tenant." ON public.flyer_shares
    FOR DELETE USING (tenant_id IN (SELECT public.get_auth_user_tenant_ids()));
CREATE POLICY "Superadmins can view all flyer_shares." ON public.flyer_shares
    FOR ALL USING (public.is_superadmin());

-- 7. Grant Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_identities TO authenticated;
GRANT ALL ON public.customer_identities TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.channel_connections TO authenticated;
GRANT ALL ON public.channel_connections TO service_role;

GRANT SELECT, INSERT ON public.workflow_logs TO authenticated;
GRANT ALL ON public.workflow_logs TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.flyer_shares TO authenticated;
GRANT ALL ON public.flyer_shares TO service_role;
