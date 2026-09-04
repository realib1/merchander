-- Create ENUM for channel types
CREATE TYPE public.channel_type AS ENUM ('whatsapp', 'instagram', 'telegram', 'facebook', 'storefront', 'email');

-- Create ENUM for message directions
CREATE TYPE public.message_direction AS ENUM ('inbound', 'outbound');

-- Create ENUM for message status
CREATE TYPE public.message_status AS ENUM ('received', 'queued', 'sent', 'delivered', 'read', 'failed');

-- Create ENUM for message type
CREATE TYPE public.message_type AS ENUM ('text', 'template', 'media', 'interactive', 'system');

-- Channel Identities
CREATE TABLE public.channel_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    channel public.channel_type NOT NULL,
    channel_handle TEXT NOT NULL,
    profile_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, channel, channel_handle)
);

ALTER TABLE public.channel_identities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can manage channel_identities" ON public.channel_identities
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

-- Messages
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    channel_identity_id UUID NOT NULL REFERENCES public.channel_identities(id) ON DELETE CASCADE,
    direction public.message_direction NOT NULL,
    type public.message_type NOT NULL,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    status public.message_status NOT NULL,
    external_id TEXT,
    error_details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying messages by identity and external_id
CREATE INDEX idx_messages_identity ON public.messages(tenant_id, channel_identity_id, created_at DESC);
CREATE INDEX idx_messages_external_id ON public.messages(tenant_id, external_id) WHERE external_id IS NOT NULL;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can manage messages" ON public.messages
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
