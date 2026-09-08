-- Create table for AI Action Safety Queue (Green / Yellow / Red action safety & human handoff)
CREATE TABLE IF NOT EXISTS public.ai_action_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    channel_identity_id UUID NOT NULL REFERENCES public.channel_identities(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL DEFAULT 'reply',
    tier TEXT NOT NULL CHECK (tier IN ('green', 'yellow', 'red')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'executed', 'cancelled')),
    proposed_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    grounded_facts JSONB NOT NULL DEFAULT '[]'::jsonb,
    confidence NUMERIC(3,2) NOT NULL DEFAULT 0.00,
    escalation_reason TEXT,
    customer_notice_sent TEXT,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queue filtering and tenant isolation
CREATE INDEX IF NOT EXISTS idx_ai_action_queue_tenant_status ON public.ai_action_queue(tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_action_queue_tenant_tier ON public.ai_action_queue(tenant_id, tier);
CREATE INDEX IF NOT EXISTS idx_ai_action_queue_channel_identity ON public.ai_action_queue(tenant_id, channel_identity_id);

-- Enable Row Level Security
ALTER TABLE public.ai_action_queue ENABLE ROW LEVEL SECURITY;

-- Tenant isolation RLS policies
CREATE POLICY "Tenant users can manage ai_action_queue" ON public.ai_action_queue
    FOR ALL
    USING (tenant_id IN (
        SELECT tenant_users.tenant_id 
        FROM tenant_users 
        WHERE tenant_users.user_id = auth.uid()
    ))
    WITH CHECK (tenant_id IN (
        SELECT tenant_users.tenant_id 
        FROM tenant_users 
        WHERE tenant_users.user_id = auth.uid()
    ));
