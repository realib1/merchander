create or replace view public.inventory_view as
select
  pv.id as variant_id,
  pv.sku,
  pv.name as variant_name,
  pv.price,
  pv.product_id,
  p.name as product_name,
  p.image_urls,
  p.category_id,
  pc.name as category_name,
  coalesce(il.quantity, 0) as quantity,
  il.store_id,
  s.name as store_name,
  p.tenant_id
from public.product_variants pv
join public.products p on pv.product_id = p.id
left join public.product_categories pc on p.category_id = pc.id
left join public.inventory_levels il on pv.id = il.variant_id
left join public.stores s on il.store_id = s.id;
