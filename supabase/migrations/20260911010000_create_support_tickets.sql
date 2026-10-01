-- Create support_tickets table
CREATE TABLE public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    reference_code TEXT,
    user_id UUID,
    merchant_email TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'urgent', 'low')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_for_merchant', 'escalated', 'resolved', 'closed')),
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    internal_notes JSONB DEFAULT '[]'::jsonb,
    messages JSONB DEFAULT '[]'::jsonb,
    system_context JSONB,
    is_escalated BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes
CREATE INDEX idx_support_tickets_tenant_id ON public.support_tickets(tenant_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON public.support_tickets(priority);
CREATE INDEX idx_support_tickets_created_at_desc ON public.support_tickets(created_at DESC);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Policy for platform staff
CREATE POLICY "Platform staff have full access to support_tickets" ON public.support_tickets
    FOR ALL
    USING (private.is_platform_staff() OR auth.jwt() ->> 'role' = 'service_role');

-- Policy for tenant members
CREATE POLICY "Tenant members can view their own tenant's tickets" ON public.support_tickets
    FOR SELECT
    USING (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "Tenant members can create tickets for their tenant" ON public.support_tickets
    FOR INSERT
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));

-- Data migration
DO $$
DECLARE
    row record;
    ticket record;
BEGIN
    FOR row IN
        SELECT tenant_id, settings_data->'support_tickets' AS tickets
        FROM public.tenant_settings
        WHERE settings_data ? 'support_tickets' AND jsonb_typeof(settings_data->'support_tickets') = 'array'
    LOOP
        FOR ticket IN SELECT * FROM jsonb_array_elements(row.tickets)
        LOOP
            INSERT INTO public.support_tickets (
                id,
                tenant_id,
                reference_code,
                user_id,
                merchant_email,
                subject,
                message,
                category,
                priority,
                status,
                assigned_to,
                internal_notes,
                messages,
                system_context,
                is_escalated,
                resolved_at,
                created_at,
                updated_at
            ) VALUES (
                COALESCE((ticket.value->>'id')::uuid, gen_random_uuid()),
                row.tenant_id,
                ticket.value->>'referenceCode',
                (ticket.value->>'userId')::uuid,
                ticket.value->>'merchantEmail',
                COALESCE(ticket.value->>'subject', 'No Subject'),
                COALESCE(ticket.value->>'message', ''),
                COALESCE(ticket.value->>'category', 'general'),
                COALESCE(ticket.value->>'priority', 'normal'),
                COALESCE(ticket.value->>'status', 'open'),
                (ticket.value->>'assignedTo')::uuid,
                COALESCE(ticket.value->'internalNotes', '[]'::jsonb),
                COALESCE(ticket.value->'messages', '[]'::jsonb),
                ticket.value->'systemContext',
                COALESCE((ticket.value->>'isEscalated')::boolean, false),
                (ticket.value->>'resolvedAt')::timestamptz,
                COALESCE((ticket.value->>'createdAt')::timestamptz, now()),
                COALESCE((ticket.value->>'updatedAt')::timestamptz, now())
            );
        END LOOP;
    END LOOP;

    -- Clean up settings_data
    UPDATE public.tenant_settings
    SET settings_data = settings_data - 'support_tickets'
    WHERE settings_data ? 'support_tickets';
END $$;
