-- Migration: 20260901140000_create_batch_notifications.sql
-- Automated Pre-Order Batch Milestone Notifications & Dispatch Logs (PRD v2.2)

CREATE TABLE IF NOT EXISTS public.preorder_batch_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.preorder_batches(id) ON DELETE CASCADE,
    milestone VARCHAR(50) NOT NULL,
    channel VARCHAR(50) NOT NULL DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'sms', 'email')),
    recipient_count INT NOT NULL DEFAULT 0,
    message_template TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'sent' CHECK (status IN ('queued', 'sent', 'failed')),
    sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_batch_notifications_batch ON public.preorder_batch_notifications(batch_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_batch_notifications_tenant ON public.preorder_batch_notifications(tenant_id);

-- RLS
ALTER TABLE public.preorder_batch_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users manage batch notifications" ON public.preorder_batch_notifications
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()
        )
    );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.preorder_batch_notifications TO authenticated, service_role;
