-- Migration: 20260901100000_create_superadmin_platform_schema.sql
-- Merchander Superadmin (Platform Control Plane) Schema
-- Aligned with PRD v2.2 and docs/06_superadmin_prd.md

-- 1. Platform Staff Users & RBAC
CREATE TABLE IF NOT EXISTS public.platform_staff_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN (
        'platform_owner',
        'platform_admin',
        'operations',
        'support',
        'finance',
        'tech_admin',
        'compliance'
    )),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    mfa_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_platform_staff_user UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_platform_staff_users_role ON public.platform_staff_users(role);
CREATE INDEX IF NOT EXISTS idx_platform_staff_users_active ON public.platform_staff_users(is_active);

-- 2. Immutable Platform Audit Logs
CREATE TABLE IF NOT EXISTS public.platform_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_email VARCHAR(255) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL CHECK (target_type IN (
        'tenant',
        'subscription',
        'plan',
        'connector',
        'domain',
        'support_ticket',
        'broadcast',
        'incident',
        'staff_role',
        'security_event',
        'system_config'
    )),
    target_id VARCHAR(255) NOT NULL,
    target_name VARCHAR(255),
    reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    ip_address VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_platform_audit_logs_created ON public.platform_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_audit_logs_target ON public.platform_audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_platform_audit_logs_actor ON public.platform_audit_logs(actor_id);

-- 3. Platform Commercial Plans & Feature Entitlements
CREATE TABLE IF NOT EXISTS public.platform_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_ghs NUMERIC(12, 2) NOT NULL DEFAULT 0,
    price_usd NUMERIC(12, 2) NOT NULL DEFAULT 0,
    billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
    entitlements JSONB NOT NULL DEFAULT '{
        "max_products": 50,
        "max_monthly_orders": 100,
        "max_staff_seats": 2,
        "custom_domain_allowed": false,
        "ai_queries_monthly": 100,
        "priority_support": false
    }'::jsonb,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    sort_order INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed initial standard plans if table is empty
INSERT INTO public.platform_plans (slug, name, description, price_ghs, price_usd, entitlements, sort_order)
VALUES 
    ('free', 'Free Explorer', 'Essential tools to launch social commerce in Ghana', 0, 0, '{"max_products": 20, "max_monthly_orders": 50, "max_staff_seats": 1, "custom_domain_allowed": false, "ai_queries_monthly": 50, "priority_support": false}'::jsonb, 1),
    ('starter', 'Starter Tier', 'Organize procurement, pre-orders and customer sales', 150, 12, '{"max_products": 100, "max_monthly_orders": 300, "max_staff_seats": 3, "custom_domain_allowed": false, "ai_queries_monthly": 250, "priority_support": false}'::jsonb, 2),
    ('growth', 'Growth Tier', 'Scale multi-channel WhatsApp, Instagram, and shipment tracking', 350, 29, '{"max_products": 500, "max_monthly_orders": 1500, "max_staff_seats": 7, "custom_domain_allowed": true, "ai_queries_monthly": 1000, "priority_support": true}'::jsonb, 3),
    ('business', 'Business Pro', 'High-volume importers, inventory intelligence, custom domain', 750, 59, '{"max_products": 2500, "max_monthly_orders": 10000, "max_staff_seats": 20, "custom_domain_allowed": true, "ai_queries_monthly": 5000, "priority_support": true}'::jsonb, 4),
    ('enterprise', 'Enterprise Custom', 'Unlimited throughput, dedicated account manager, bespoke SLAs', 1800, 149, '{"max_products": 100000, "max_monthly_orders": 500000, "max_staff_seats": 100, "custom_domain_allowed": true, "ai_queries_monthly": 50000, "priority_support": true}'::jsonb, 5)
ON CONFLICT (slug) DO NOTHING;

-- 4. Platform Announcements & Communications
CREATE TABLE IF NOT EXISTS public.platform_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'announcement', 'maintenance', 'warning', 'security')),
    target_tier VARCHAR(50) NOT NULL DEFAULT 'all' CHECK (target_tier IN ('all', 'free', 'starter', 'growth', 'business', 'enterprise')),
    target_country VARCHAR(10) DEFAULT 'all',
    action_label VARCHAR(100),
    action_url VARCHAR(255),
    is_pinned BOOLEAN DEFAULT FALSE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    starts_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_platform_announcements_active ON public.platform_announcements(is_active, starts_at, expires_at);

-- 5. Platform Status & System Incidents
CREATE TABLE IF NOT EXISTS public.platform_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('investigating', 'identified', 'monitoring', 'resolved')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    affected_areas TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_platform_incidents_active ON public.platform_incidents(is_active, created_at DESC);

-- 6. Helper Function: Is Platform Staff
CREATE OR REPLACE FUNCTION public.is_platform_staff()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.platform_staff_users
        WHERE user_id = auth.uid() AND is_active = TRUE
    ) OR (
        -- Support JWT claim fallback
        (auth.jwt() -> 'app_metadata' ->> 'is_superadmin')::boolean IS TRUE
    );
$$;

-- 7. Enable Row Level Security (RLS)
ALTER TABLE public.platform_staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_incidents ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies
-- platform_staff_users: Only platform staff can view; owners can mutate
CREATE POLICY "Platform staff can view staff users" ON public.platform_staff_users
    FOR SELECT USING (public.is_platform_staff());

CREATE POLICY "Service role and owners manage staff users" ON public.platform_staff_users
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'service_role' OR 
        EXISTS (
            SELECT 1 FROM public.platform_staff_users
            WHERE user_id = auth.uid() AND role = 'platform_owner' AND is_active = TRUE
        )
    );

-- platform_audit_logs: Platform staff can view; insertions allowed for authenticated staff
CREATE POLICY "Platform staff can view audit logs" ON public.platform_audit_logs
    FOR SELECT USING (public.is_platform_staff());

CREATE POLICY "Platform staff can insert audit logs" ON public.platform_audit_logs
    FOR INSERT WITH CHECK (public.is_platform_staff() OR auth.jwt() ->> 'role' = 'service_role');

-- platform_plans: Anyone authenticated can view plans; platform staff can manage
CREATE POLICY "Anyone can view active plans" ON public.platform_plans
    FOR SELECT USING (TRUE);

CREATE POLICY "Platform staff can manage plans" ON public.platform_plans
    FOR ALL USING (public.is_platform_staff() OR auth.jwt() ->> 'role' = 'service_role');

-- platform_announcements: Active announcements visible to all; platform staff manage
CREATE POLICY "Anyone can view active announcements" ON public.platform_announcements
    FOR SELECT USING (is_active = TRUE OR public.is_platform_staff());

CREATE POLICY "Platform staff can manage announcements" ON public.platform_announcements
    FOR ALL USING (public.is_platform_staff() OR auth.jwt() ->> 'role' = 'service_role');

-- platform_incidents: Active incidents visible to all; platform staff manage
CREATE POLICY "Anyone can view active incidents" ON public.platform_incidents
    FOR SELECT USING (is_active = TRUE OR public.is_platform_staff());

CREATE POLICY "Platform staff can manage incidents" ON public.platform_incidents
    FOR ALL USING (public.is_platform_staff() OR auth.jwt() ->> 'role' = 'service_role');

-- 9. Table Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_staff_users TO authenticated, service_role;
GRANT SELECT, INSERT ON public.platform_audit_logs TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_plans TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_announcements TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_incidents TO authenticated, service_role;
