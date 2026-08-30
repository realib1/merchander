-- Migration: Enforce Security Invoker on inventory_view
-- Description: Ensures inventory_view respects the Row Level Security (RLS) policies of the querying user.

CREATE OR REPLACE VIEW public.inventory_view WITH (security_invoker = true) AS
SELECT
  pv.id AS variant_id,
  pv.sku,
  pv.name AS variant_name,
  pv.price,
  pv.product_id,
  p.name AS product_name,
  p.image_urls,
  p.category_id,
  pc.name AS category_name,
  coalesce(il.quantity, 0) AS quantity,
  il.store_id,
  s.name AS store_name,
  p.tenant_id
FROM public.product_variants pv
JOIN public.products p ON pv.product_id = p.id
LEFT JOIN public.product_categories pc ON p.category_id = pc.id
LEFT JOIN public.inventory_levels il ON pv.id = il.variant_id
LEFT JOIN public.stores s ON il.store_id = s.id;

-- Ensure grants are in place
GRANT SELECT ON public.inventory_view TO authenticated;
GRANT ALL ON public.inventory_view TO service_role;
