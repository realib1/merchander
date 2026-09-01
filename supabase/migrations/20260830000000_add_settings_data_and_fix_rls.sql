-- ====================================================================
-- Migration: Add settings_data and optimize all RLS policies (0003_auth_rls_initplan)
-- ====================================================================

-- 1. Add settings_data jsonb and auxiliary columns to tenant_settings
ALTER TABLE public.tenant_settings
ADD COLUMN IF NOT EXISTS settings_data jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS business_phone text,
ADD COLUMN IF NOT EXISTS description text;

-- 2. Add custom domain columns to storefront_settings
ALTER TABLE public.storefront_settings
ADD COLUMN IF NOT EXISTS custom_domain text,
ADD COLUMN IF NOT EXISTS custom_domain_config jsonb;

-- 3. Optimize public.waitlist RLS
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;
CREATE POLICY "Anyone can join waitlist" ON public.waitlist
  FOR INSERT WITH CHECK ((SELECT auth.role()) IN ('anon', 'authenticated'));

-- 4. Optimize public.tenant_settings RLS
DROP POLICY IF EXISTS "Tenant settings are viewable by tenant users" ON public.tenant_settings;
CREATE POLICY "Tenant settings are viewable by tenant users"
  ON public.tenant_settings FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM public.tenant_users 
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Tenant settings are insertable by tenant users" ON public.tenant_settings;
CREATE POLICY "Tenant settings are insertable by tenant users"
  ON public.tenant_settings FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id 
      FROM public.tenant_users 
      WHERE user_id = (SELECT auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Tenant settings are updatable by tenant users" ON public.tenant_settings;
CREATE POLICY "Tenant settings are updatable by tenant users"
  ON public.tenant_settings FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM public.tenant_users 
      WHERE user_id = (SELECT auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

-- 5. Optimize public.storefront_settings RLS
DROP POLICY IF EXISTS "Storefront settings are publicly viewable if active" ON public.storefront_settings;
CREATE POLICY "Storefront settings are publicly viewable if active"
  ON public.storefront_settings FOR SELECT
  USING (
    is_active = true OR
    tenant_id IN (
      SELECT tenant_id 
      FROM public.tenant_users 
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Storefront settings are insertable by tenant admins" ON public.storefront_settings;
CREATE POLICY "Storefront settings are insertable by tenant admins"
  ON public.storefront_settings FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id 
      FROM public.tenant_users 
      WHERE user_id = (SELECT auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Storefront settings are updatable by tenant admins" ON public.storefront_settings;
CREATE POLICY "Storefront settings are updatable by tenant admins"
  ON public.storefront_settings FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM public.tenant_users 
      WHERE user_id = (SELECT auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

-- 6. Optimize public.tenant_notifications RLS
DROP POLICY IF EXISTS "Users can view their tenant notifications" ON public.tenant_notifications;
CREATE POLICY "Users can view their tenant notifications"
  ON public.tenant_notifications FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM public.tenant_users 
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update their tenant notifications" ON public.tenant_notifications;
CREATE POLICY "Users can update their tenant notifications"
  ON public.tenant_notifications FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM public.tenant_users 
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can manage their tenant notifications" ON public.tenant_notifications;
CREATE POLICY "Admins can manage their tenant notifications"
  ON public.tenant_notifications FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM public.tenant_users 
      WHERE user_id = (SELECT auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

-- 7. Optimize public.user_backup_codes RLS
DROP POLICY IF EXISTS "Users can manage their own backup codes" ON public.user_backup_codes;
CREATE POLICY "Users can manage their own backup codes"
  ON public.user_backup_codes FOR ALL
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- 8. Optimize public.tenants RLS
DROP POLICY IF EXISTS "Users with owner or admin role can update their tenant." ON public.tenants;
CREATE POLICY "Users with owner or admin role can update their tenant."
  ON public.tenants FOR UPDATE
  USING (
    id IN (
      SELECT tenant_id
      FROM public.tenant_users
      WHERE user_id = (SELECT auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

-- 9. Optimize helper security functions
CREATE OR REPLACE FUNCTION private.get_auth_user_tenant_ids()
RETURNS setof uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.tenant_users WHERE user_id = (SELECT auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(((SELECT auth.jwt()) -> 'app_metadata' ->> 'is_superadmin')::boolean, false);
$$;

-- 10. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
