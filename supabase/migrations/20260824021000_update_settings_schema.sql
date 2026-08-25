-- Grant UPDATE on tenants
GRANT UPDATE ON public.tenants TO authenticated;

-- Add missing columns to tenant_settings
ALTER TABLE public.tenant_settings
ADD COLUMN IF NOT EXISTS trading_name text,
ADD COLUMN IF NOT EXISTS industry text,
ADD COLUMN IF NOT EXISTS tax_id text;

-- Add RLS policy for updating tenants
CREATE POLICY "Users with owner or admin role can update their tenant." 
  ON public.tenants FOR UPDATE 
  USING (
    id IN (
      SELECT tenant_id 
      FROM public.tenant_users 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Update RLS policy for tenant_settings to also allow admins
DROP POLICY IF EXISTS "Tenant settings are updatable by tenant users" ON public.tenant_settings;
CREATE POLICY "Tenant settings are updatable by tenant users"
  ON public.tenant_settings FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM public.tenant_users 
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );
