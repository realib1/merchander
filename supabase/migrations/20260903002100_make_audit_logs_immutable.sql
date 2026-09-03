-- Migration: make_audit_logs_immutable

-- 1. Create the trigger function to raise an exception
CREATE OR REPLACE FUNCTION public.prevent_audit_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable. Updates and deletions are forbidden.';
END;
$$;

-- 2. Attach the trigger to the platform_audit_logs table
-- (Using IF NOT EXISTS logic by dropping it first, as triggers don't have CREATE OR REPLACE)
DROP TRIGGER IF EXISTS trg_prevent_audit_log_mutation_update ON public.platform_audit_logs;
CREATE TRIGGER trg_prevent_audit_log_mutation_update
  BEFORE UPDATE ON public.platform_audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_audit_log_mutation();

DROP TRIGGER IF EXISTS trg_prevent_audit_log_mutation_delete ON public.platform_audit_logs;
CREATE TRIGGER trg_prevent_audit_log_mutation_delete
  BEFORE DELETE ON public.platform_audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_audit_log_mutation();
