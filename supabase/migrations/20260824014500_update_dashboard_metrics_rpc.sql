create or replace function public.get_dashboard_metrics(
  p_days integer default 30
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_current_start timestamp with time zone;
  v_previous_start timestamp with time zone;
  
  v_current_sales decimal(10,2) := 0;
  v_previous_sales decimal(10,2) := 0;
  v_current_orders int := 0;
  v_previous_orders int := 0;
  v_current_cost decimal(10,2) := 0;
  v_previous_cost decimal(10,2) := 0;
  v_current_customers int := 0;
  v_total_customers int := 0;
  
  v_sales_chart jsonb := '[]'::jsonb;
  v_top_products jsonb := '[]'::jsonb;
begin
  -- Get user's tenant
  select tenant_id into v_tenant_id from public.tenant_users where user_id = auth.uid() limit 1;
  
  if v_tenant_id is null then
    raise exception 'Tenant not found';
  end if;

  v_current_start := (now() - (p_days || ' days')::interval);
  v_previous_start := (now() - ((p_days * 2) || ' days')::interval);

  -- Current Period Sales & Costs
  select 
    coalesce(sum(o.total_amount - o.delivery_fee), 0),
    count(distinct o.id),
    coalesce(sum(oi.quantity * coalesce(pv.cost_price, (oi.unit_price * 0.6))), 0)
  into v_current_sales, v_current_orders, v_current_cost
  from public.orders o
  left join public.order_items oi on o.id = oi.order_id
  left join public.product_variants pv on oi.variant_id = pv.id
  where o.tenant_id = v_tenant_id
    and o.status in ('paid', 'dispatched', 'delivered')
    and o.created_at >= v_current_start;

  -- Previous Period Sales & Costs
  select 
    coalesce(sum(o.total_amount - o.delivery_fee), 0),
    count(distinct o.id),
    coalesce(sum(oi.quantity * coalesce(pv.cost_price, (oi.unit_price * 0.6))), 0)
  into v_previous_sales, v_previous_orders, v_previous_cost
  from public.orders o
  left join public.order_items oi on o.id = oi.order_id
  left join public.product_variants pv on oi.variant_id = pv.id
  where o.tenant_id = v_tenant_id
    and o.status in ('paid', 'dispatched', 'delivered')
    and o.created_at >= v_previous_start
    and o.created_at < v_current_start;

  -- Customer metrics
  select count(id) into v_total_customers from public.customers where tenant_id = v_tenant_id;
  select count(id) into v_current_customers from public.customers where tenant_id = v_tenant_id and created_at >= v_current_start;

  -- Sales Chart (daily grouping)
  select jsonb_agg(
    jsonb_build_object(
      'date', t.date_day,
      'sales', coalesce(t.sales, 0)
    )
  ) into v_sales_chart
  from (
    select 
      date_trunc('day', o.created_at)::date as date_day,
      sum(o.total_amount - o.delivery_fee) as sales
    from public.orders o
    where o.tenant_id = v_tenant_id
      and o.status not in ('draft', 'cancelled')
      and o.created_at >= v_current_start
    group by date_trunc('day', o.created_at)
    order by date_trunc('day', o.created_at) asc
  ) t;

  if v_sales_chart is null then v_sales_chart := '[]'::jsonb; end if;

  -- Top Products
  select jsonb_agg(
    jsonb_build_object(
      'id', t.id,
      'name', t.name,
      'price', t.price,
      'quantitySold', t.quantity_sold
    )
  ) into v_top_products
  from (
    select 
      p.id,
      p.name,
      max(oi.unit_price) as price,
      sum(oi.quantity) as quantity_sold
    from public.order_items oi
    join public.orders o on oi.order_id = o.id
    join public.product_variants pv on oi.variant_id = pv.id
    join public.products p on pv.product_id = p.id
    where o.tenant_id = v_tenant_id
      and o.status in ('paid', 'dispatched', 'delivered')
      and o.created_at >= v_current_start
    group by p.id, p.name
    order by sum(oi.quantity) desc
    limit 4
  ) t;

  if v_top_products is null then v_top_products := '[]'::jsonb; end if;

  return jsonb_build_object(
    'current_sales', v_current_sales,
    'previous_sales', v_previous_sales,
    'current_orders', v_current_orders,
    'previous_orders', v_previous_orders,
    'current_cost', v_current_cost,
    'previous_cost', v_previous_cost,
    'current_customers', v_current_customers,
    'total_customers', v_total_customers,
    'sales_chart', v_sales_chart,
    'top_products', v_top_products
  );
end;
$$;
