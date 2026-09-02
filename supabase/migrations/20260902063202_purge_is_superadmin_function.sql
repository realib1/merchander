DO $$
DECLARE
    pol RECORD;
    new_polname TEXT;
    create_stmt TEXT;
BEGIN
    FOR pol IN
        SELECT
            n.nspname AS schemaname,
            c.relname AS tablename,
            p.polname AS policyname,
            p.polcmd,
            pg_get_expr(p.polqual, p.polrelid) AS qual,
            pg_get_expr(p.polwithcheck, p.polrelid) AS with_check
        FROM pg_policy p
        JOIN pg_class c ON p.polrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE pg_get_expr(p.polqual, p.polrelid) LIKE '%is_superadmin()%' 
           OR pg_get_expr(p.polwithcheck, p.polrelid) LIKE '%is_superadmin()%'
    LOOP
        new_polname := REPLACE(pol.policyname, 'Superadmin', 'Platform staff');
        new_polname := REPLACE(new_polname, 'superadmin', 'platform staff');
        
        EXECUTE format('DROP POLICY %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
        
        create_stmt := format('CREATE POLICY %I ON %I.%I FOR %s',
            new_polname, pol.schemaname, pol.tablename,
            CASE pol.polcmd
                WHEN 'r' THEN 'SELECT'
                WHEN 'w' THEN 'UPDATE'
                WHEN 'a' THEN 'INSERT'
                WHEN 'd' THEN 'DELETE'
                WHEN '*' THEN 'ALL'
            END
        );
        
        IF pol.qual IS NOT NULL THEN
            create_stmt := create_stmt || format(' USING (%s)', REPLACE(pol.qual, 'is_superadmin()', 'is_platform_staff()'));
        END IF;
        
        IF pol.with_check IS NOT NULL THEN
            create_stmt := create_stmt || format(' WITH CHECK (%s)', REPLACE(pol.with_check, 'is_superadmin()', 'is_platform_staff()'));
        END IF;
        
        EXECUTE create_stmt;
    END LOOP;
END
$$;

DROP FUNCTION IF EXISTS public.is_superadmin();

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
