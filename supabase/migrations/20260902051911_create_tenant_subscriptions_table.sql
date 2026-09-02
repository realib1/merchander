DO $$ BEGIN
    CREATE TYPE public.subscription_tier AS ENUM ('free', 'starter', 'growth', 'business', 'enterprise');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.subscription_status AS ENUM ('active', 'past_due', 'canceled', 'trialing');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.billing_cycle AS ENUM ('monthly', 'annual');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.tenant_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    tier public.subscription_tier NOT NULL DEFAULT 'starter',
    status public.subscription_status NOT NULL DEFAULT 'active',
    billing_cycle public.billing_cycle NOT NULL DEFAULT 'monthly',
    price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0,
    renewal_date TIMESTAMPTZ,
    payment_method JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id)
);

-- Enable RLS
ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;

-- Migration of existing JSONB data
INSERT INTO public.tenant_subscriptions (tenant_id, tier, status, billing_cycle, renewal_date, payment_method, price_monthly)
SELECT 
    tenant_id,
    (COALESCE(settings_data->'subscription'->>'tier', 'starter'))::public.subscription_tier,
    (COALESCE(settings_data->'subscription'->>'status', 'active'))::public.subscription_status,
    (COALESCE(settings_data->'subscription'->>'billingCycle', 'monthly'))::public.billing_cycle,
    (settings_data->'subscription'->>'renewalDate')::TIMESTAMPTZ,
    COALESCE(settings_data->'subscription'->'paymentMethod', '{}'::jsonb),
    CASE 
        WHEN (settings_data->'subscription'->>'tier') = 'enterprise' THEN 1800
        WHEN (settings_data->'subscription'->>'tier') = 'business' THEN 750
        WHEN (settings_data->'subscription'->>'tier') = 'growth' THEN 350
        WHEN (settings_data->'subscription'->>'tier') = 'starter' THEN 150
        ELSE 0
    END
FROM public.tenant_settings
ON CONFLICT (tenant_id) DO NOTHING;

DROP POLICY IF EXISTS "Tenant owners can read own subscription" ON public.tenant_subscriptions;
CREATE POLICY "Tenant owners can read own subscription" ON public.tenant_subscriptions
    FOR SELECT TO authenticated
    USING (tenant_id IN (
        SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Platform staff can read all subscriptions" ON public.tenant_subscriptions;
CREATE POLICY "Platform staff can read all subscriptions" ON public.tenant_subscriptions
    FOR SELECT TO authenticated
    USING (public.is_platform_staff());

DROP POLICY IF EXISTS "Platform staff can update subscriptions" ON public.tenant_subscriptions;
CREATE POLICY "Platform staff can update subscriptions" ON public.tenant_subscriptions
    FOR UPDATE TO authenticated
    USING (public.is_platform_staff());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_subscriptions TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
