-- Fix linter warnings for handle_updated_at search_path
alter function public.handle_updated_at() set search_path = '';

-- Fix linter warnings for security definer functions being callable by anon/authenticated roles
-- By switching to security invoker, they execute with the privileges of the caller.
-- Since the tables have RLS for tenant isolation, this is the safest approach.
alter function public.decrement_inventory_batch(jsonb, uuid) security invoker;
alter function public.get_customer_page_metrics() security invoker;
alter function public.get_dashboard_metrics(integer) security invoker;
alter function public.get_inventory_metrics() security invoker;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
