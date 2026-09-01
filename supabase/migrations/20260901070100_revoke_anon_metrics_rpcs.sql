-- Phase 1.2: Revoke anonymous access to dashboard and metrics RPC functions.
-- These are only called from authenticated server actions (dashboard.ts),
-- so revoking anon access has zero impact on existing functionality.

REVOKE ALL ON FUNCTION public.get_dashboard_metrics(integer) FROM anon;
REVOKE ALL ON FUNCTION public.get_customer_page_metrics() FROM anon;
REVOKE ALL ON FUNCTION public.get_inventory_metrics() FROM anon;
REVOKE ALL ON FUNCTION public.is_superadmin() FROM anon;
REVOKE ALL ON FUNCTION public.handle_updated_at() FROM anon;
