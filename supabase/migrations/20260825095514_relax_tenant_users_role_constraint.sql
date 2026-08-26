-- Relax the strict role constraint on tenant_users to allow custom role names
ALTER TABLE public.tenant_users DROP CONSTRAINT IF EXISTS tenant_users_role_check;
