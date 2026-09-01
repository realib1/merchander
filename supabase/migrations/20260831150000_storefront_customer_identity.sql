-- Migration: Storefront Customer Identity & Tokenized Order Tracking
-- Creates customer_saved_items, order_access_tokens, and storefront_sessions

-- ============================================================================
-- 1. Customer Saved Items (Wishlist) Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.customer_saved_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_customer_saved_product UNIQUE (tenant_id, customer_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_customer_saved_tenant_cust 
    ON public.customer_saved_items(tenant_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_saved_product 
    ON public.customer_saved_items(product_id);

-- ============================================================================
-- 2. Tokenized Order Access (Passwordless Tracking) Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.order_access_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + INTERVAL '30 days'),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_order_token UNIQUE (order_id, token_hash)
);

CREATE INDEX IF NOT EXISTS idx_order_access_lookup 
    ON public.order_access_tokens(tenant_id, token_hash);
CREATE INDEX IF NOT EXISTS idx_order_access_order 
    ON public.order_access_tokens(order_id);

-- ============================================================================
-- 3. Anonymous Storefront Sessions (Ephemeral Cart & AI Context) Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.storefront_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    cart_data JSONB DEFAULT '[]'::jsonb NOT NULL,
    customer_phone VARCHAR(50),
    last_active_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_storefront_sessions_lookup 
    ON public.storefront_sessions(tenant_id, session_token);

-- ============================================================================
-- 4. Enable Row Level Security (RLS)
-- ============================================================================
ALTER TABLE public.customer_saved_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storefront_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. RLS Policies
-- ============================================================================

-- customer_saved_items policies
DROP POLICY IF EXISTS "Merchants view saved items for their tenant" ON public.customer_saved_items;
CREATE POLICY "Merchants view saved items for their tenant"
    ON public.customer_saved_items FOR SELECT
    USING (tenant_id IN (SELECT public.get_auth_user_tenant_ids()));

DROP POLICY IF EXISTS "Merchants modify saved items for their tenant" ON public.customer_saved_items;
CREATE POLICY "Merchants modify saved items for their tenant"
    ON public.customer_saved_items FOR ALL
    USING (tenant_id IN (SELECT public.get_auth_user_tenant_ids()));

DROP POLICY IF EXISTS "Superadmins manage customer_saved_items" ON public.customer_saved_items;
CREATE POLICY "Superadmins manage customer_saved_items"
    ON public.customer_saved_items FOR ALL
    USING (public.is_superadmin());

-- order_access_tokens policies
DROP POLICY IF EXISTS "Public can view valid order tokens" ON public.order_access_tokens;
CREATE POLICY "Public can view valid order tokens"
    ON public.order_access_tokens FOR SELECT
    USING (expires_at > timezone('utc'::text, now()));

DROP POLICY IF EXISTS "Tenant users manage order tokens" ON public.order_access_tokens;
CREATE POLICY "Tenant users manage order tokens"
    ON public.order_access_tokens FOR ALL
    USING (tenant_id IN (SELECT public.get_auth_user_tenant_ids()));

-- storefront_sessions policies
DROP POLICY IF EXISTS "Public session access" ON public.storefront_sessions;
CREATE POLICY "Public session access"
    ON public.storefront_sessions FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- 6. Table Grants
-- ============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_saved_items TO authenticated, service_role;
GRANT SELECT, INSERT ON public.order_access_tokens TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.storefront_sessions TO anon, authenticated, service_role;
