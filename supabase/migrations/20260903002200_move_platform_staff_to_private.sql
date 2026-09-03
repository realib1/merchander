-- 1. Create the private schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS private;

-- 2. Create the secure function in the private schema
CREATE OR REPLACE FUNCTION private.is_platform_staff()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.platform_staff_users 
    WHERE user_id = auth.uid() 
      AND is_active = TRUE
  );
$$;

-- 3. Dynamically update all policies that rely on public.is_platform_staff()
DO $$
DECLARE
    pol RECORD;
    create_stmt TEXT;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check 
        FROM pg_policies 
        WHERE qual LIKE '%is_platform_staff()%' OR with_check LIKE '%is_platform_staff()%'
    LOOP
        -- Drop the old policy
        EXECUTE format('DROP POLICY %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);

        -- Recreate the policy with the updated function reference
        create_stmt := format('CREATE POLICY %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
        
        -- Add AS command
        IF pol.cmd != 'ALL' THEN
            create_stmt := create_stmt || format(' FOR %s', pol.cmd);
        END IF;

        -- Add TO roles
        IF array_length(pol.roles, 1) > 0 AND pol.roles[1] != 'public' THEN
            create_stmt := create_stmt || format(' TO %s', array_to_string(pol.roles, ', '));
        END IF;

        -- Add USING clause if it existed
        IF pol.qual IS NOT NULL THEN
            create_stmt := create_stmt || format(' USING (%s)', REPLACE(REPLACE(pol.qual, 'public.is_platform_staff()', 'private.is_platform_staff()'), 'is_platform_staff()', 'private.is_platform_staff()'));
        END IF;

        -- Add WITH CHECK clause if it existed
        IF pol.with_check IS NOT NULL THEN
            create_stmt := create_stmt || format(' WITH CHECK (%s)', REPLACE(REPLACE(pol.with_check, 'public.is_platform_staff()', 'private.is_platform_staff()'), 'is_platform_staff()', 'private.is_platform_staff()'));
        END IF;

        EXECUTE create_stmt;
    END LOOP;
END
$$;

-- 4. Drop the old function from the public schema
DROP FUNCTION IF EXISTS public.is_platform_staff();
