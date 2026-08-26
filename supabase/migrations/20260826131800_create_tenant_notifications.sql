-- Create tenant_notifications table
CREATE TABLE IF NOT EXISTS tenant_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL, -- e.g., 'order', 'inventory', 'payment', 'system'
    is_read BOOLEAN NOT NULL DEFAULT false,
    reference_id UUID, -- optional ID for the related entity (e.g., order_id)
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenant_notifications_tenant_id ON tenant_notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_notifications_created_at ON tenant_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tenant_notifications_is_read ON tenant_notifications(is_read);

-- Enable RLS
ALTER TABLE tenant_notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for tenant users to select their notifications
CREATE POLICY "Users can view notifications in their tenant"
    ON tenant_notifications FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id 
            FROM tenant_users 
            WHERE user_id = auth.uid()
        )
    );

-- Create policy for tenant users to update their notifications (e.g., mark as read)
CREATE POLICY "Users can update notifications in their tenant"
    ON tenant_notifications FOR UPDATE
    USING (
        tenant_id IN (
            SELECT tenant_id 
            FROM tenant_users 
            WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        tenant_id IN (
            SELECT tenant_id 
            FROM tenant_users 
            WHERE user_id = auth.uid()
        )
    );

-- Grant privileges
GRANT ALL ON tenant_notifications TO authenticated;
GRANT ALL ON tenant_notifications TO service_role;
