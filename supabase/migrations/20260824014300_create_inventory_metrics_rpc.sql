create or replace function public.get_inventory_metrics()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_total_units int := 0;
  v_total_variants int := 0;
  v_total_value decimal(10,2) := 0;
  v_low_stock_count int := 0;
  v_out_of_stock_count int := 0;
begin
  select tenant_id into v_tenant_id from public.tenant_users where user_id = auth.uid() limit 1;
  if v_tenant_id is null then raise exception 'Tenant not found'; end if;

  select count(distinct variant_id) into v_total_variants
  from public.inventory_view
  where tenant_id = v_tenant_id;

  select 
    coalesce(sum(quantity), 0),
    coalesce(sum(quantity * price), 0),
    count(case when quantity > 0 and quantity < 10 then 1 end),
    count(case when quantity = 0 then 1 end)
  into 
    v_total_units,
    v_total_value,
    v_low_stock_count,
    v_out_of_stock_count
  from public.inventory_view
  where tenant_id = v_tenant_id;

  return jsonb_build_object(
    'totalUnits', v_total_units,
    'totalVariants', v_total_variants,
    'totalValue', v_total_value,
    'lowStockCount', v_low_stock_count,
    'outOfStockCount', v_out_of_stock_count
  );
end;
$$;
