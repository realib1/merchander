-- ====================================================================
-- Migration: Consolidate Admin RLS Functions and Remove Bypass
-- ====================================================================

-- 1. Remove legacy JWT bypass (app_metadata->is_superadmin) from is_platform_staff
CREATE OR REPLACE FUNCTION public.is_platform_staff()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.platform_staff_users
        WHERE user_id = auth.uid() AND is_active = TRUE
    );
$$;

-- 2. Consolidate is_superadmin to use the secure is_platform_staff function
-- This maintains compatibility with existing RLS policies while enforcing the new security model.
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT public.is_platform_staff();
$$;

-- 3. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
