-- 1. Create the private schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS private;

-- 1a. RLS quals execute with the caller's privileges, so the roles that hit
--     is_platform_staff()-backed policies need USAGE on the schema or every such
--     policy raises "permission denied for schema private". This does not
--     re-expose the function on the REST surface: PostgREST only serves the
--     `public` and `graphql_public` schemas.
GRANT USAGE ON SCHEMA private TO authenticated, anon, service_role;

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

-- 3. Dynamically update all policies that rely on is_platform_staff()
DO $$
DECLARE
    pol RECORD;
    create_stmt TEXT;
    roles_list TEXT;
BEGIN
    FOR pol IN
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
        FROM pg_policies
        WHERE qual LIKE '%is_platform_staff()%' OR with_check LIKE '%is_platform_staff()%'
    LOOP
        -- Drop the old policy
        EXECUTE format('DROP POLICY %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);

        -- Recreate the policy with the updated function reference
        create_stmt := format('CREATE POLICY %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);

        -- Carry the permissive/restrictive kind through; CREATE POLICY defaults
        -- to PERMISSIVE, so a RESTRICTIVE policy must say so explicitly.
        IF pol.permissive = 'RESTRICTIVE' THEN
            create_stmt := create_stmt || ' AS RESTRICTIVE';
        END IF;

        -- Add FOR command
        IF pol.cmd != 'ALL' THEN
            create_stmt := create_stmt || format(' FOR %s', pol.cmd);
        END IF;

        -- Add TO roles, each identifier quoted
        IF array_length(pol.roles, 1) > 0 AND pol.roles[1] != 'public' THEN
            SELECT string_agg(format('%I', r), ', ')
              INTO roles_list
              FROM unnest(pol.roles) AS r;
            create_stmt := create_stmt || format(' TO %s', roles_list);
        END IF;

        -- Add USING clause if it existed. The regexp strips any existing
        -- qualification (bare, public., or already private.) before adding a
        -- single private., so the rewrite is idempotent.
        IF pol.qual IS NOT NULL THEN
            create_stmt := create_stmt || format(
                ' USING (%s)',
                regexp_replace(pol.qual, '(\w+\.)?is_platform_staff\(\)', 'private.is_platform_staff()', 'g')
            );
        END IF;

        -- Add WITH CHECK clause if it existed
        IF pol.with_check IS NOT NULL THEN
            create_stmt := create_stmt || format(
                ' WITH CHECK (%s)',
                regexp_replace(pol.with_check, '(\w+\.)?is_platform_staff\(\)', 'private.is_platform_staff()', 'g')
            );
        END IF;

        EXECUTE create_stmt;
    END LOOP;
END
$$;

-- 4. Drop the old function from the public schema
DROP FUNCTION IF EXISTS public.is_platform_staff();

-- 5. Tell PostgREST to reload its schema cache now that policies and the
--    function surface have changed.
NOTIFY pgrst, 'reload schema';
