-- Migration: 20260903190000_create_platform_overview_snapshot.sql
-- One aggregate call for the /platform overview instead of pulling every
-- orders and products row to the server on each load (finding F-13). Called
-- only by the service-role admin client after verifyPlatformStaff(); never
-- exposed to anon / authenticated.

CREATE OR REPLACE FUNCTION public.get_platform_overview_snapshot()
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
STABLE
AS $$
  WITH order_stats AS (
    SELECT
      tenant_id,
      COUNT(*) AS order_count,
      COALESCE(
        SUM(total_amount) FILTER (WHERE status IN ('paid', 'completed', 'delivered')),
        0
      ) AS gmv
    FROM public.orders
    GROUP BY tenant_id
  ),
  product_stats AS (
    SELECT tenant_id, COUNT(*) AS product_count
    FROM public.products
    GROUP BY tenant_id
  ),
  tenant_stats AS (
    SELECT
      COALESCE(o.tenant_id, p.tenant_id) AS tenant_id,
      COALESCE(o.order_count, 0) AS order_count,
      COALESCE(o.gmv, 0) AS gmv,
      COALESCE(p.product_count, 0) AS product_count
    FROM order_stats o
    FULL OUTER JOIN product_stats p ON p.tenant_id = o.tenant_id
  )
  SELECT jsonb_build_object(
    'tenant_stats', COALESCE(
      (
        SELECT jsonb_agg(jsonb_build_object(
          'tenant_id', tenant_id,
          'order_count', order_count,
          'gmv', gmv,
          'product_count', product_count
        ))
        FROM tenant_stats
      ),
      '[]'::jsonb
    ),
    'totals', jsonb_build_object(
      'total_orders', COALESCE((SELECT SUM(order_count) FROM tenant_stats), 0),
      'total_products', COALESCE((SELECT SUM(product_count) FROM tenant_stats), 0),
      'total_gmv', COALESCE((SELECT SUM(gmv) FROM tenant_stats), 0)
    )
  );
$$;

-- Service-role only: called exclusively by the admin client after
-- verifyPlatformStaff(). PUBLIC must be revoked too - a bare
-- "REVOKE FROM anon" leaves the default PUBLIC EXECUTE grant in place.
REVOKE ALL ON FUNCTION public.get_platform_overview_snapshot() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_platform_overview_snapshot() TO service_role;

NOTIFY pgrst, 'reload schema';
