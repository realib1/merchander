-- Migration: 20260901160000_create_business_targets.sql
-- Merchant Business Goals & Targets Engine (PRD v2.2)

CREATE TABLE IF NOT EXISTS public.business_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    metric VARCHAR(50) NOT NULL,
    target_value NUMERIC NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    period VARCHAR(50) NOT NULL DEFAULT 'monthly',
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    batch_id UUID REFERENCES public.preorder_batches(id) ON DELETE SET NULL,
    currency VARCHAR(10) DEFAULT 'GHS',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_business_targets_tenant ON public.business_targets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_business_targets_metric ON public.business_targets(tenant_id, metric, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_business_targets_batch ON public.business_targets(batch_id);

-- RLS
ALTER TABLE public.business_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users manage business targets" ON public.business_targets
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()
        )
    );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_targets TO authenticated, service_role;
